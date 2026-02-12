/**
 * MATCHING MODULE
 * Creates matches between confirmed participants at T-0 (round start time)
 */

import * as db from './db.ts';
import { errorLog, debugLog } from './debug.tsx';

/**
 * Main matching function - called when round reaches T-0
 * @param sessionId - Session ID
 * @param roundId - Round ID
 * @returns Object with success status and created matches
 */
export async function createMatchesForRound(sessionId: string, roundId: string) {
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

    // 2. Check if matching already happened (idempotency)
    const existingLock = await db.getMatchingLock(sessionId, roundId);

    if (existingLock) {
      console.log(`⚠️ Matching already completed for this round`);
      return { success: true, message: 'Matching already completed', matches: [] };
    }

    // 3. Load all registrations for this round (with participant data via JOIN)
    const allRegistrations = await db.getRegistrationsForRound(sessionId, roundId);
    console.log(`📦 Total registrations: ${allRegistrations.length}`);

    // 4. Filter only CONFIRMED participants
    const confirmedRegs = allRegistrations.filter((r: any) => r.status === 'confirmed');
    console.log(`✅ Confirmed participants: ${confirmedRegs.length}`);

    if (confirmedRegs.length === 0) {
      console.log(`⚠️ No confirmed participants to match`);
      await db.setMatchingLock({ sessionId, roundId, matchCount: 0, unmatchedCount: 0 });
      return { success: true, message: 'No participants to match', matches: [] };
    }

    // 5. Mark unconfirmed registrations as 'unconfirmed'
    for (const reg of allRegistrations) {
      if (reg.status === 'registered') {
        await db.updateRegistrationStatus(reg.participantId, sessionId, roundId, 'unconfirmed', {
          unconfirmedReason: 'Did not confirm attendance before round start (T-0)',
        });
      }
    }

    // 6. Check for solo participant (only 1 confirmed)
    if (confirmedRegs.length === 1) {
      console.log(`😞 Only 1 confirmed participant - marking as no-match`);
      const solo = confirmedRegs[0];
      await db.updateRegistrationStatus(solo.participantId, sessionId, roundId, 'no-match', {
        noMatchReason: 'You were the only participant who confirmed attendance',
      });
      await db.setMatchingLock({ sessionId, roundId, matchCount: 0, unmatchedCount: 0, soloParticipant: true });
      return { success: true, message: 'Solo participant marked as no-match', matches: [] };
    }

    // 7. Run matching algorithm
    const groupSize = round.groupSize || session.groupSize || 2;
    const matchingType = session.matchingType || 'across-teams';
    const matches = await runMatchingAlgorithm(confirmedRegs, groupSize, sessionId, roundId, matchingType);

    console.log(`🎉 Created ${matches.length} matches`);

    // 8. Save matches and update participant statuses
    for (const match of matches) {
      const matchId = `match-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      match.matchId = matchId;

      // Save match to matches table
      await db.createMatch({
        matchId,
        sessionId,
        roundId,
        meetingPoint: match.meetingPoint,
      });

      // Update each participant's registration
      for (const participantId of match.participantIds) {
        const partnerNames = match.participants
          .filter((p: any) => p.participantId !== participantId)
          .map((p: any) => `${p.firstName} ${p.lastName}`);

        await db.updateRegistrationStatus(participantId, sessionId, roundId, 'matched', {
          matchId,
          matchPartnerNames: partnerNames,
          meetingPointId: match.meetingPoint,
          matchedAt: new Date().toISOString(),
        });
      }
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

      // Update odd participant's registration
      const partnerNames = smallestMatch.participants
        .filter((p: any) => p.participantId !== oddReg.participantId)
        .map((p: any) => `${p.firstName} ${p.lastName}`);

      await db.updateRegistrationStatus(oddReg.participantId, sessionId, roundId, 'matched', {
        matchId: smallestMatch.matchId,
        matchPartnerNames: partnerNames,
        meetingPointId: smallestMatch.meetingPoint,
        matchedAt: new Date().toISOString(),
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

    // 9. Mark any remaining leftover participants as 'no-match'
    for (const reg of unmatchedRegs) {
      await db.updateRegistrationStatus(reg.participantId, sessionId, roundId, 'no-match', {
        noMatchReason: 'Could not find a suitable match',
      });
    }

    console.log(`❌ Unmatched participants: ${unmatchedRegs.length}`);

    // 10. Set matching lock to prevent re-running
    await db.setMatchingLock({
      sessionId,
      roundId,
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
    return { success: false, error: 'Matching failed', details: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Matching algorithm - creates optimal groups based on scoring
 */
async function runMatchingAlgorithm(participants: any[], groupSize: number, sessionId: string, roundId: string, matchingType: string) {
  const matches: any[] = [];
  const availableParticipants = [...participants];

  // Get meeting history for all participants
  const meetingHistory = await getMeetingHistory(sessionId, participants);

  // Calculate scores for all possible pairings
  const scoredPairs = calculatePairingScores(availableParticipants, meetingHistory, matchingType);

  // Greedy matching: repeatedly pick the best scoring group
  while (availableParticipants.length >= groupSize) {
    const bestGroup = findBestGroup(availableParticipants, groupSize, scoredPairs, meetingHistory);

    if (!bestGroup || bestGroup.length === 0) {
      break;
    }

    // Remove matched participants from available pool
    for (const participant of bestGroup) {
      const index = availableParticipants.findIndex((p: any) => p.participantId === participant.participantId);
      if (index !== -1) {
        availableParticipants.splice(index, 1);
      }
    }

    // Create match
    matches.push({
      participantIds: bestGroup.map((p: any) => p.participantId),
      participants: bestGroup.map((p: any) => ({
        participantId: p.participantId,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        team: p.team,
        topics: p.topics || []
      })),
      meetingPoint: bestGroup[0].meetingPoint || 'TBD',
      createdAt: new Date().toISOString()
    });
  }

  return matches;
}

/**
 * Get meeting history for participants in this session
 * Uses matches + registrations tables instead of KV getByPrefix
 */
async function getMeetingHistory(sessionId: string, participants: any[]) {
  const history: Record<string, Set<string>> = {};

  // Initialize history for each participant
  for (const p of participants) {
    history[p.participantId] = new Set();
  }

  // Get all past matches in this session
  const allMatches = await db.getMatchesForSession(sessionId);

  for (const match of allMatches) {
    // Get participants in this match (via registrations.match_id)
    const matchParticipants = await db.getMatchParticipants(match.matchId);

    // For each pair in this match, record that they met
    const pIds = matchParticipants.map(p => p.participantId);
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
