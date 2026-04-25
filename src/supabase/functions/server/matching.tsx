/**
 * MATCHING MODULE
 * Creates matches between confirmed participants at T-0 (round start time)
 */

import * as db from './db.ts';
import { errorLog, debugLog } from './debug.tsx';

/** Lock TTL in milliseconds — if a lock is older than this and still in-progress, treat as stale */
const LOCK_TTL_MS = 60_000; // 60 seconds

/**
 * Main matching function - called when round reaches T-0
 * @param sessionId - Session ID
 * @param roundId - Round ID
 * @returns Object with success status and created matches
 */
export async function createMatchesForRound(sessionId: string, roundId: string) {
  let lockAcquired = false;

  try {
    console.log(`🎯 MATCHING START: session=${sessionId}, round=${roundId}`);

    // 1. Get session to find userId and round details
    const session = await db.getSessionById(sessionId);

    if (!session) {
      console.log(`❌ Session ${sessionId} not found`);
      return { success: false, error: 'Session not found' };
    }

    const round = session.rounds?.find((r: any) => r.id === roundId);

    if (!round) {
      console.log(`❌ Round ${roundId} not found`);
      return { success: false, error: 'Round not found' };
    }

    console.log(`📋 Round details: name="${round.name}", groupSize=${round.groupSize || 2}`);

    // 2. Atomically acquire matching lock (prevents race conditions)
    lockAcquired = await db.tryAcquireMatchingLock(sessionId, roundId);

    if (!lockAcquired) {
      const existingLock = await db.getMatchingLock(sessionId, roundId);

      // Lock was deleted between our failed insert and this fetch — retry acquire
      if (!existingLock) {
        console.log(`🔄 Lock disappeared after failed acquire — retrying`);
        lockAcquired = await db.tryAcquireMatchingLock(sessionId, roundId);
        if (!lockAcquired) {
          return { success: true, message: 'Matching in progress (race)', matches: [] };
        }
        // Fall through to continue with matching
      }

      // matchCount === -1 means another process is still running matching
      else if (existingLock.matchCount === -1) {
        // Check if lock is stale (older than TTL)
        const lockAge = Date.now() - new Date(existingLock.completedAt).getTime();
        if (lockAge > LOCK_TTL_MS) {
          console.log(`🔓 Stale matching lock detected (age: ${Math.round(lockAge / 1000)}s) — deleting and retrying`);
          await db.deleteMatchingLock(sessionId, roundId);
          lockAcquired = await db.tryAcquireMatchingLock(sessionId, roundId);
          if (!lockAcquired) {
            console.log(`⚠️ Retry lock acquisition failed — another process took it`);
            return { success: true, message: 'Matching in progress (retry)', matches: [] };
          }
          // Fall through to continue with matching
        } else {
          console.log(`⏳ Matching is currently in progress (age: ${Math.round(lockAge / 1000)}s) — skipping`);
          return { success: true, message: 'Matching in progress', matches: [] };
        }
      }

      // Check if previous matching produced results — allow retry if it was a solo/no-match run
      // but now more participants might be confirmed
      else if (existingLock && existingLock.matchCount === 0) {
        // Previous matching found no matches — check if there are now more matchable participants
        const allRegs = await db.getRegistrationsForRound(sessionId, roundId);
        const confirmedNow = allRegs.filter((r: any) => r.status === 'confirmed');
        const noMatchFromPrevious = allRegs.filter((r: any) => r.status === 'no-match');
        const potentialParticipants = confirmedNow.length + noMatchFromPrevious.length;

        // Only retry if there are genuinely NEW confirmed participants (not just the same no-match ones)
        if (confirmedNow.length > 0 && potentialParticipants >= (round?.groupSize || session?.groupSize || 2)) {
          console.log(`🔄 Previous matching found 0 matches, but now ${potentialParticipants} potential participants (${confirmedNow.length} NEW confirmed + ${noMatchFromPrevious.length} no-match) — retrying`);
          // Delete the old lock so we can re-run
          await db.deleteMatchingLock(sessionId, roundId);
          // Bulk revert no-match statuses from previous run
          const noMatchIds = noMatchFromPrevious.map((r: any) => r.participantId);
          if (noMatchIds.length > 0) {
            await db.bulkUpdateRegistrationStatusByIds(noMatchIds, sessionId, roundId, 'confirmed', {});
          }
          // Re-acquire lock and continue
          lockAcquired = await db.tryAcquireMatchingLock(sessionId, roundId);
          if (!lockAcquired) {
            console.log(`⚠️ Retry lock acquisition failed — another process is running`);
            return { success: true, message: 'Matching retry in progress', matches: [] };
          }
          // Fall through to continue with matching
        } else {
          console.log(`⚠️ Matching already completed (0 matches, ${potentialParticipants} potential — not enough to retry)`);
          return { success: true, message: 'Matching already completed', matches: [] };
        }
      }

      // Lock exists with matchCount === -2 means previous run failed — allow retry
      else if (existingLock && existingLock.matchCount === -2) {
        console.log(`🔄 Previous matching failed — deleting lock and retrying`);
        await db.deleteMatchingLock(sessionId, roundId);
        lockAcquired = await db.tryAcquireMatchingLock(sessionId, roundId);
        if (!lockAcquired) {
          return { success: true, message: 'Matching retry in progress', matches: [] };
        }
        // Fall through
      }

      // matchCount > 0 means matching completed successfully, BUT there may be late-confirmed participants
      else if (existingLock && existingLock.matchCount > 0) {
        const allRegs = await db.getRegistrationsForRound(sessionId, roundId);
        const lateConfirmed = allRegs.filter((r: any) => r.status === 'confirmed');
        const noMatchParticipants = allRegs.filter((r: any) => r.status === 'no-match');
        const potentialNew = lateConfirmed.length + noMatchParticipants.length;

        if (potentialNew >= (round?.groupSize || session?.groupSize || 2)) {
          console.log(`🔄 Matching completed with ${existingLock.matchCount} matches, but ${lateConfirmed.length} late confirmed + ${noMatchParticipants.length} no-match participants can be re-matched — retrying`);
          await db.deleteMatchingLock(sessionId, roundId);
          // Revert no-match to confirmed so they can be re-matched with late arrivals
          const noMatchIds = noMatchParticipants.map((r: any) => r.participantId);
          if (noMatchIds.length > 0) {
            await db.bulkUpdateRegistrationStatusByIds(noMatchIds, sessionId, roundId, 'confirmed', {});
          }
          lockAcquired = await db.tryAcquireMatchingLock(sessionId, roundId);
          if (!lockAcquired) {
            return { success: true, message: 'Matching retry in progress', matches: [] };
          }
          // Fall through — but we need to skip bulkUpdateRegistrationStatusByRound for 'registered'→'unconfirmed'
          // because those already happened. The matching algorithm will only find 'confirmed' participants.
        } else if (lateConfirmed.length === 1 && noMatchParticipants.length === 0) {
          // Solo late arrival — mark as no-match immediately without re-running full matching
          const solo = lateConfirmed[0];
          await db.updateRegistrationStatus(solo.participantId, sessionId, roundId, 'no-match', {
            noMatchReason: 'No other participants available to match with',
          });
          console.log(`😞 Solo late participant ${solo.participantId} marked as no-match`);
          return { success: true, message: 'Late solo participant marked no-match', matches: [] };
        } else {
          console.log(`⚠️ Matching already completed with ${existingLock.matchCount} matches (${lateConfirmed.length} late confirmed — not enough to re-match)`);
          return { success: true, message: 'Matching already completed', matches: [] };
        }
      }

      else {
        console.log(`⚠️ Matching already completed with ${existingLock?.matchCount || 0} matches`);
        return { success: true, message: 'Matching already completed', matches: [] };
      }
    }

    // 3. Load all registrations for this round (with participant data via JOIN)
    const allRegistrations = await db.getRegistrationsForRound(sessionId, roundId);
    console.log(`📦 Total registrations: ${allRegistrations.length}`);

    // 4. Filter only CONFIRMED participants
    const confirmedRegs = allRegistrations.filter((r: any) => r.status === 'confirmed');
    console.log(`✅ Confirmed participants: ${confirmedRegs.length}`);

    if (confirmedRegs.length === 0) {
      console.log(`⚠️ No confirmed participants to match`);
      await db.updateMatchingLock(sessionId, roundId, { matchCount: 0, unmatchedCount: 0 });
      return { success: true, message: 'No participants to match', matches: [] };
    }

    // 5. Bulk mark unconfirmed registrations (single query instead of loop)
    await db.bulkUpdateRegistrationStatusByRound(sessionId, roundId, 'registered', 'unconfirmed', {
      unconfirmedReason: 'Did not confirm attendance before round start (T-0)',
    });

    // 6. Check for solo participant (only 1 confirmed)
    if (confirmedRegs.length === 1) {
      console.log(`😞 Only 1 confirmed participant - marking as no-match`);
      const solo = confirmedRegs[0];
      await db.updateRegistrationStatus(solo.participantId, sessionId, roundId, 'no-match', {
        noMatchReason: 'You were the only participant who confirmed attendance',
      });
      await db.updateMatchingLock(sessionId, roundId, { matchCount: 0, unmatchedCount: 0, soloParticipant: true });
      return { success: true, message: 'Solo participant marked as no-match', matches: [] };
    }

    // 7. Run matching algorithm
    const groupSize = round.groupSize || session.groupSize || 2;
    const matchingType = session.matchingType || 'across-teams';

    // Get available meeting points (round-level override, then session-level)
    const availableMeetingPoints = (round.meetingPoints?.length > 0
      ? round.meetingPoints
      : session.meetingPoints) || [];
    console.log(`📍 Available meeting points: ${availableMeetingPoints.length} (${availableMeetingPoints.map((mp: any) => mp.name).join(', ')})`);

    const matches = await runMatchingAlgorithm(confirmedRegs, groupSize, sessionId, roundId, matchingType, availableMeetingPoints);

    console.log(`🎉 Created ${matches.length} matches (algorithm output, before DB persist)`);

    // 8. Save matches and update participant statuses (BULK).
    //
    // Performance note: doing N serial INSERTs + 2N UPDATEs (~7500 queries for
    // 2500 matches × 5000 participants) burns ~75s of wall time on staging.
    // Two bulk operations bring this down to ~200ms total.

    // 8a. Generate match IDs and identification numbers in memory
    const usedNumbersPerMatch = new Map<string, Set<number>>();
    const matchRows: Array<{ matchId: string; sessionId: string; roundId: string; meetingPoint?: string }> = [];
    const assignmentRows: Array<{
      participantId: string;
      matchId: string;
      matchPartnerNames: string[];
      meetingPointId: string;
      identificationNumber: number;
      identificationOptions: number[];
    }> = [];

    // Source organizer ID for upserts (registrations table requires it)
    const organizerId: string = (session as any).userId;

    const baseTs = Date.now();
    for (let mIdx = 0; mIdx < matches.length; mIdx++) {
      const match = matches[mIdx];
      const matchId = `match-${baseTs}-${mIdx}-${Math.random().toString(36).substring(2, 7)}`;
      match.matchId = matchId;

      matchRows.push({
        matchId,
        sessionId,
        roundId,
        meetingPoint: match.meetingPoint,
      });

      // Generate unique identification numbers within this match
      const usedNumbers = new Set<number>();
      const idDataPerParticipant = new Map<string, { number: number; options: number[] }>();
      for (const participantId of match.participantIds) {
        let idData = db.generateIdentificationData();
        while (usedNumbers.has(idData.number)) {
          idData = db.generateIdentificationData();
        }
        usedNumbers.add(idData.number);
        idDataPerParticipant.set(participantId, idData);
      }
      usedNumbersPerMatch.set(matchId, usedNumbers);

      // Build assignment rows for each participant in this match
      for (const participantId of match.participantIds) {
        const partnerNames = match.participants
          .filter((p: any) => p.participantId !== participantId)
          .map((p: any) => `${p.firstName} ${p.lastName}`);
        const idData = idDataPerParticipant.get(participantId)!;
        assignmentRows.push({
          participantId,
          matchId,
          matchPartnerNames: partnerNames,
          meetingPointId: match.meetingPoint,
          identificationNumber: idData.number,
          identificationOptions: idData.options,
        });
      }
    }

    // 8b. Two bulk DB roundtrips (chunked internally at 500 rows):
    if (matchRows.length > 0) {
      console.log(`💾 Persisting ${matchRows.length} matches + ${assignmentRows.length} registration upserts`);
      await db.createMatchesBatch(matchRows);
      await db.bulkAssignMatchesToRegistrations(sessionId, roundId, organizerId, assignmentRows);
      console.log(`💾 Persist complete`);
    }

    // 8.5. Handle odd participant AFTER matches are saved
    const matchedIds = matches.flatMap((m: any) => m.participantIds);
    const unmatchedRegs = confirmedRegs.filter((r: any) => !matchedIds.includes(r.participantId));

    if (unmatchedRegs.length === 1 && matches.length > 0) {
      const oddReg = unmatchedRegs[0];
      console.log(`👤 One odd participant found, adding to existing group`);

      // Find the smallest match
      let smallestMatch = matches[0];
      for (const match of matches) {
        if (match.participantIds.length < smallestMatch.participantIds.length) {
          smallestMatch = match;
        }
      }

      // Add odd participant to this match
      smallestMatch.participantIds.push(oddReg.participantId);
      smallestMatch.participants.push({
        participantId: oddReg.participantId,
        firstName: oddReg.firstName,
        lastName: oddReg.lastName,
        email: oddReg.email,
        team: oddReg.team,
        topics: oddReg.topics || [],
      });

      console.log(`✅ Added odd participant to match ${smallestMatch.matchId}, new size: ${smallestMatch.participantIds.length}`);

      // Update odd participant's registration with unique identification number
      const partnerNames = smallestMatch.participants
        .filter((p: any) => p.participantId !== oddReg.participantId)
        .map((p: any) => `${p.firstName} ${p.lastName}`);

      // Ensure unique identification number within this match
      const matchUsedNumbers = usedNumbersPerMatch.get(smallestMatch.matchId) || new Set();
      let oddIdData = db.generateIdentificationData();
      while (matchUsedNumbers.has(oddIdData.number)) {
        oddIdData = db.generateIdentificationData();
      }
      matchUsedNumbers.add(oddIdData.number);

      await db.updateRegistrationStatus(oddReg.participantId, sessionId, roundId, 'matched', {
        matchId: smallestMatch.matchId,
        matchPartnerNames: partnerNames,
        meetingPointId: smallestMatch.meetingPoint,
        matchedAt: new Date().toISOString(),
        identificationNumber: oddIdData.number,
        identificationOptions: oddIdData.options,
      });

      // Update existing partners' registration to include the new partner
      for (const existingPId of smallestMatch.participantIds) {
        if (existingPId === oddReg.participantId) continue;
        const updatedPartnerNames = smallestMatch.participants
          .filter((p: any) => p.participantId !== existingPId)
          .map((p: any) => `${p.firstName} ${p.lastName}`);
        await db.updateRegistrationStatus(existingPId, sessionId, roundId, 'matched', {
          matchId: smallestMatch.matchId,
          matchPartnerNames: updatedPartnerNames,
        });
      }

      // Remove from unmatched
      const unmatchedIndex = unmatchedRegs.indexOf(oddReg);
      if (unmatchedIndex !== -1) {
        unmatchedRegs.splice(unmatchedIndex, 1);
      }
    }

    // 9. Bulk mark remaining leftover participants as 'no-match'
    const remainingUnmatchedIds = unmatchedRegs.map((r: any) => r.participantId);
    if (remainingUnmatchedIds.length > 0) {
      await db.bulkUpdateRegistrationStatusByIds(remainingUnmatchedIds, sessionId, roundId, 'no-match', {
        noMatchReason: 'Could not find a suitable match',
      });
    }

    console.log(`❌ Unmatched participants: ${unmatchedRegs.length}`);

    // 10. Update matching lock with final counts
    await db.updateMatchingLock(sessionId, roundId, {
      matchCount: matches.length,
      unmatchedCount: unmatchedRegs.length,
    });

    console.log(`✅ MATCHING COMPLETE`);

    return {
      success: true,
      matches,
      matchCount: matches.length,
      unmatchedCount: unmatchedRegs.length
    };

  } catch (error) {
    console.error('💥 ERROR in createMatchesForRound:');
    console.error('Error:', error);
    errorLog('Error in createMatchesForRound:', error);

    // Mark lock as failed so it can be retried
    if (lockAcquired) {
      try {
        await db.updateMatchingLock(sessionId, roundId, { matchCount: -2, unmatchedCount: 0 });
      } catch (lockErr) {
        console.error('Failed to update lock after error:', lockErr);
      }
    }

    const errorDetails = error instanceof Error
      ? error.message
      : (typeof error === 'object' ? JSON.stringify(error) : String(error));
    return { success: false, error: 'Matching failed', details: errorDetails };
  }
}

/**
 * Matching algorithm - creates optimal groups based on scoring
 */
async function runMatchingAlgorithm(participants: any[], groupSize: number, sessionId: string, roundId: string, matchingType: string, meetingPoints: any[] = []) {
  // Get meeting history for all participants (single batch query)
  const meetingHistory = await getMeetingHistory(sessionId, participants);

  // Fast path for the common case (groupSize=2): O(n² log n) sort-based greedy.
  // The general path below is O(n³) which exceeds Supabase edge-fn CPU budget
  // beyond ~400 participants. Pairs of 2 covers >95% of real events, so we
  // optimize that hot path while keeping the general algorithm for groupSize≥3.
  if (groupSize === 2) {
    return runPairwiseGreedy(participants, meetingHistory, matchingType, meetingPoints);
  }

  // General path (groups of 3+): keep existing O(n³) implementation
  return runGeneralGreedy(participants, groupSize, meetingHistory, matchingType, meetingPoints);
}

/**
 * Fast pairwise matching: O(n²) time and memory using bucket sort.
 *
 * Scoring weights (30 + 20 + 10) keep scores in [0, 60], so we bucket pairs
 * by score and walk from highest to lowest. No comparator-based sort is
 * needed — at n=5000 this avoids both the V8 TypedArray.sort quirks observed
 * at large sizes and the ~1GB memory blowup of Array<number>.
 *
 * Verified perf on staging: n=200 → ~80ms, n=1000 → ~500ms, n=5000 → ~3s
 * (most time spent on score computation, not the matching itself).
 */
const MAX_PAIR_SCORE = 60;

function runPairwiseGreedy(
  participants: any[],
  meetingHistory: Record<string, Set<string>>,
  matchingType: string,
  meetingPoints: any[],
) {
  const n = participants.length;
  if (n < 2) return [];

  // Pre-extract participant data for tight inner loops (avoid property lookup overhead)
  const ids: string[] = new Array(n);
  const teams: (string | null)[] = new Array(n);
  const topicsArr: string[][] = new Array(n);
  const histories: (Set<string> | undefined)[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const p = participants[i];
    ids[i] = p.participantId;
    teams[i] = p.team || null;
    topicsArr[i] = p.topics || [];
    histories[i] = meetingHistory[p.participantId];
  }

  // Pass 1: count pairs per score bucket. We do this in two passes so we can
  // allocate the right-sized Int32Array per bucket (no per-push amortization).
  const bucketCounts = new Int32Array(MAX_PAIR_SCORE + 1);
  for (let i = 0; i < n; i++) {
    const teamI = teams[i];
    const topicsI = topicsArr[i];
    const histI = histories[i];
    for (let j = i + 1; j < n; j++) {
      let score = 0;
      if (!histI || !histI.has(ids[j])) score += 30;
      const teamJ = teams[j];
      if (teamI && teamJ) {
        if (matchingType === 'across-teams' && teamI !== teamJ) score += 20;
        else if (matchingType === 'within-teams' && teamI === teamJ) score += 20;
      }
      const topicsJ = topicsArr[j];
      if (topicsI.length > 0 && topicsJ.length > 0) {
        for (let t = 0; t < topicsI.length; t++) {
          if (topicsJ.includes(topicsI[t])) { score += 10; break; }
        }
      }
      bucketCounts[score]++;
    }
  }

  // Allocate per-bucket buffers — flat [i0, j0, i1, j1, …]
  const buckets: Int32Array[] = new Array(MAX_PAIR_SCORE + 1);
  for (let s = 0; s <= MAX_PAIR_SCORE; s++) {
    buckets[s] = new Int32Array(bucketCounts[s] * 2);
  }
  const cursors = new Int32Array(MAX_PAIR_SCORE + 1);

  // Pass 2: place pairs into buckets (recomputing score is cheaper than storing it)
  for (let i = 0; i < n; i++) {
    const teamI = teams[i];
    const topicsI = topicsArr[i];
    const histI = histories[i];
    for (let j = i + 1; j < n; j++) {
      let score = 0;
      if (!histI || !histI.has(ids[j])) score += 30;
      const teamJ = teams[j];
      if (teamI && teamJ) {
        if (matchingType === 'across-teams' && teamI !== teamJ) score += 20;
        else if (matchingType === 'within-teams' && teamI === teamJ) score += 20;
      }
      const topicsJ = topicsArr[j];
      if (topicsI.length > 0 && topicsJ.length > 0) {
        for (let t = 0; t < topicsI.length; t++) {
          if (topicsJ.includes(topicsI[t])) { score += 10; break; }
        }
      }
      const buf = buckets[score];
      const k = cursors[score];
      buf[2 * k] = i;
      buf[2 * k + 1] = j;
      cursors[score] = k + 1;
    }
  }

  // Greedy walk from highest to lowest score
  const used = new Uint8Array(n);
  const matches: any[] = [];
  let meetingPointIndex = 0;

  for (let s = MAX_PAIR_SCORE; s >= 0; s--) {
    const buf = buckets[s];
    const len = bucketCounts[s];
    for (let k = 0; k < len; k++) {
      const i = buf[2 * k];
      const j = buf[2 * k + 1];
      if (used[i] || used[j]) continue;
      used[i] = 1;
      used[j] = 1;

      const p1 = participants[i];
      const p2 = participants[j];

      let assignedMeetingPoint: string;
      if (meetingPoints.length > 0) {
        const mp = meetingPoints[meetingPointIndex % meetingPoints.length];
        assignedMeetingPoint = mp.name || mp.id;
        meetingPointIndex++;
      } else {
        assignedMeetingPoint = p1.meetingPoint || p2.meetingPoint || 'TBD';
      }

      matches.push({
        participantIds: [p1.participantId, p2.participantId],
        participants: [
          { participantId: p1.participantId, firstName: p1.firstName, lastName: p1.lastName, email: p1.email, team: p1.team, topics: p1.topics || [] },
          { participantId: p2.participantId, firstName: p2.firstName, lastName: p2.lastName, email: p2.email, team: p2.team, topics: p2.topics || [] },
        ],
        meetingPoint: assignedMeetingPoint,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return matches;
}

/**
 * General matching for groupSize ≥ 3 (legacy path, O(n³)).
 */
async function runGeneralGreedy(
  participants: any[],
  groupSize: number,
  meetingHistory: Record<string, Set<string>>,
  matchingType: string,
  meetingPoints: any[],
) {
  const matches: any[] = [];
  const availableParticipants = [...participants];

  const scoredPairs = calculatePairingScores(availableParticipants, meetingHistory, matchingType);
  let meetingPointIndex = 0;

  while (availableParticipants.length >= groupSize) {
    const bestGroup = findBestGroup(availableParticipants, groupSize, scoredPairs, meetingHistory);
    if (!bestGroup || bestGroup.length === 0) break;

    for (const participant of bestGroup) {
      const index = availableParticipants.findIndex((p: any) => p.participantId === participant.participantId);
      if (index !== -1) availableParticipants.splice(index, 1);
    }

    let assignedMeetingPoint: string;
    if (meetingPoints.length > 0) {
      const mp = meetingPoints[meetingPointIndex % meetingPoints.length];
      assignedMeetingPoint = mp.name || mp.id;
      meetingPointIndex++;
    } else {
      assignedMeetingPoint = bestGroup.find((p: any) => p.meetingPoint)?.meetingPoint || 'TBD';
    }

    matches.push({
      participantIds: bestGroup.map((p: any) => p.participantId),
      participants: bestGroup.map((p: any) => ({
        participantId: p.participantId, firstName: p.firstName, lastName: p.lastName,
        email: p.email, team: p.team, topics: p.topics || []
      })),
      meetingPoint: assignedMeetingPoint,
      createdAt: new Date().toISOString(),
    });
  }

  return matches;
}

/**
 * Get meeting history for participants in this session.
 * Uses a SINGLE batch query instead of N+1 individual queries.
 */
async function getMeetingHistory(sessionId: string, participants: any[]) {
  const history: Record<string, Set<string>> = {};

  // Initialize history for each participant
  for (const p of participants) {
    history[p.participantId] = new Set();
  }

  // Get ALL match-participant pairs in ONE query
  const matchParticipantsMap = await db.getMatchParticipantsBatch(sessionId);

  // For each match, record that participants met each other
  for (const [_matchId, pIds] of matchParticipantsMap) {
    for (let i = 0; i < pIds.length; i++) {
      for (let j = i + 1; j < pIds.length; j++) {
        const id1 = pIds[i];
        const id2 = pIds[j];

        if (history[id1]) history[id1].add(id2);
        if (history[id2]) history[id2].add(id1);
      }
    }
  }

  return history;
}

/**
 * Calculate pairing scores between all participants
 */
function calculatePairingScores(participants: any[], meetingHistory: Record<string, Set<string>>, matchingType: string) {
  const scores: Record<string, number> = {};

  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      const p1 = participants[i];
      const p2 = participants[j];
      const key = `${p1.participantId}:${p2.participantId}`;

      let score = 0;

      // MEETING MEMORY (30 points): Haven't met before?
      const haveMet = meetingHistory[p1.participantId]?.has(p2.participantId);
      if (!haveMet) {
        score += 30;
      }

      // TEAMS MATCHING (20 points): Different teams?
      if (matchingType === 'across-teams') {
        if (p1.team && p2.team && p1.team !== p2.team) {
          score += 20;
        }
      } else if (matchingType === 'within-teams') {
        if (p1.team && p2.team && p1.team === p2.team) {
          score += 20;
        }
      }

      // TOPICS MATCHING (10 points): Similar topics?
      const topics1 = p1.topics || [];
      const topics2 = p2.topics || [];
      const commonTopics = topics1.filter((t: string) => topics2.includes(t));
      if (commonTopics.length > 0) {
        score += 10 * Math.min(commonTopics.length, 1); // Max 10 points
      }

      scores[key] = score;
    }
  }

  return scores;
}

/**
 * Find the best scoring group of given size
 */
function findBestGroup(
  availableParticipants: any[],
  groupSize: number,
  pairingScores: Record<string, number>,
  meetingHistory: Record<string, Set<string>>
) {
  let bestGroup: any[] = [];
  let bestScore = -Infinity;

  // For group size 2, simple pairwise matching
  if (groupSize === 2) {
    for (let i = 0; i < availableParticipants.length; i++) {
      for (let j = i + 1; j < availableParticipants.length; j++) {
        const p1 = availableParticipants[i];
        const p2 = availableParticipants[j];
        const key = `${p1.participantId}:${p2.participantId}`;
        const score = pairingScores[key] || 0;

        if (score > bestScore) {
          bestScore = score;
          bestGroup = [p1, p2];
        }
      }
    }
  }
  // For larger groups, try to find best combination
  else {
    const pairs: Array<{participants: any[], score: number}> = [];

    for (let i = 0; i < availableParticipants.length; i++) {
      for (let j = i + 1; j < availableParticipants.length; j++) {
        const p1 = availableParticipants[i];
        const p2 = availableParticipants[j];
        const key = `${p1.participantId}:${p2.participantId}`;
        const score = pairingScores[key] || 0;
        pairs.push({ participants: [p1, p2], score });
      }
    }

    // Sort pairs by score
    pairs.sort((a, b) => b.score - a.score);

    // Try to expand best pair to group size
    for (const pair of pairs) {
      const group = [...pair.participants];
      let totalScore = pair.score;

      // Add more participants to reach group size
      for (const candidate of availableParticipants) {
        if (group.length >= groupSize) break;
        if (group.some((p: any) => p.participantId === candidate.participantId)) continue;

        // Calculate how well candidate fits with current group
        let candidateScore = 0;
        for (const member of group) {
          const key1 = `${member.participantId}:${candidate.participantId}`;
          const key2 = `${candidate.participantId}:${member.participantId}`;
          candidateScore += (pairingScores[key1] || pairingScores[key2] || 0);
        }

        group.push(candidate);
        totalScore += candidateScore;
      }

      if (group.length === groupSize && totalScore > bestScore) {
        bestScore = totalScore;
        bestGroup = group;
      }
    }
  }

  return bestGroup;
}
