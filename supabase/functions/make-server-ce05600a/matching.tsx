/**
 * MATCHING MODULE
 * Creates matches between confirmed participants at T-0 (round start time)
 */

import * as kv from './kv_wrapper.tsx';
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
    
    // 1. Get session to find userId
    const allSessions = await kv.getByPrefix(`user_sessions:`);
    const session = allSessions.find((s: any) => s.id === sessionId);
    
    if (!session) {
      console.log(`❌ Session ${sessionId} not found`);
      return { success: false, error: 'Session not found' };
    }
    
    const userId = session.userId;
    const round = session.rounds?.find((r: any) => r.id === roundId);
    
    if (!round) {
      console.log(`❌ Round ${roundId} not found`);
      return { success: false, error: 'Round not found' };
    }
    
    console.log(`📋 Round details: name="${round.name}", groupSize=${round.groupSize || 2}`);
    
    // 2. Check if matching already happened (idempotency)
    const matchingLockKey = `matching_lock:${sessionId}:${roundId}`;
    const existingLock = await kv.get(matchingLockKey);
    
    if (existingLock) {
      console.log(`⚠️ Matching already completed for this round`);
      return { success: true, message: 'Matching already completed', matches: [] };
    }
    
    // 3. Load all participants for this round
    const allParticipants = await kv.getByPrefix(`participant:${sessionId}:${roundId}:`);
    console.log(`📦 Total participants: ${allParticipants.length}`);
    
    // 4. Filter only CONFIRMED participants
    const confirmedParticipants = allParticipants.filter((p: any) => p.status === 'confirmed');
    console.log(`✅ Confirmed participants: ${confirmedParticipants.length}`);
    
    if (confirmedParticipants.length === 0) {
      console.log(`⚠️ No confirmed participants to match`);
      await kv.set(matchingLockKey, { completedAt: new Date().toISOString(), matchCount: 0 });
      return { success: true, message: 'No participants to match', matches: [] };
    }
    
    // 5. Mark unconfirmed participants as 'unconfirmed'
    for (const participant of allParticipants) {
      if (participant.status === 'registered') {
        participant.status = 'unconfirmed';
        participant.unconfirmedReason = 'Did not confirm attendance before round start (T-0)';
        await kv.set(`participant:${sessionId}:${roundId}:${participant.participantId}`, participant);
        
        // Also update in participant_registrations
        const registrations = await kv.get(`participant_registrations:${participant.participantId}`) || [];
        const regIndex = registrations.findIndex((r: any) => r.sessionId === sessionId && r.roundId === roundId);
        if (regIndex !== -1) {
          registrations[regIndex].status = 'unconfirmed';
          registrations[regIndex].unconfirmedReason = 'Did not confirm attendance before round start (T-0)';
          registrations[regIndex].lastStatusUpdate = new Date().toISOString();
          await kv.set(`participant_registrations:${participant.participantId}`, registrations);
        }
      }
    }
    
    // 6. Check for solo participant (only 1 confirmed)
    if (confirmedParticipants.length === 1) {
      console.log(`😞 Only 1 confirmed participant - marking as no-match`);
      const soloParticipant = confirmedParticipants[0];
      soloParticipant.status = 'no-match';
      soloParticipant.noMatchReason = 'You were the only participant who confirmed attendance';
      await kv.set(`participant:${sessionId}:${roundId}:${soloParticipant.participantId}`, soloParticipant);
      
      // Update in participant_registrations
      const registrations = await kv.get(`participant_registrations:${soloParticipant.participantId}`) || [];
      const regIndex = registrations.findIndex((r: any) => r.sessionId === sessionId && r.roundId === roundId);
      if (regIndex !== -1) {
        registrations[regIndex].status = 'no-match';
        registrations[regIndex].noMatchReason = 'You were the only participant who confirmed attendance';
        registrations[regIndex].lastStatusUpdate = new Date().toISOString();
        await kv.set(`participant_registrations:${soloParticipant.participantId}`, registrations);
      }
      
      await kv.set(matchingLockKey, { completedAt: new Date().toISOString(), matchCount: 0, soloParticipant: true });
      return { success: true, message: 'Solo participant marked as no-match', matches: [] };
    }
    
    // 7. Run matching algorithm
    const groupSize = round.groupSize || 2;
    const matchingType = session.matchingType || 'across-teams'; // Default to across-teams
    const matches = await runMatchingAlgorithm(confirmedParticipants, groupSize, sessionId, roundId, matchingType);
    
    console.log(`🎉 Created ${matches.length} matches`);
    
    // 8. Save matches and update participant statuses
    for (const match of matches) {
      const matchId = `match-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      match.matchId = matchId;
      
      // Save match
      await kv.set(`match:${sessionId}:${roundId}:${matchId}`, match);
      
      // Update each participant in the match
      for (const participantId of match.participantIds) {
        const participant = confirmedParticipants.find((p: any) => p.participantId === participantId);
        if (participant) {
          participant.status = 'matched';
          participant.matchId = matchId;
          participant.matchedAt = new Date().toISOString();
          await kv.set(`participant:${sessionId}:${roundId}:${participantId}`, participant);
          
          // Update in participant_registrations
          const registrations = await kv.get(`participant_registrations:${participantId}`) || [];
          const regIndex = registrations.findIndex((r: any) => r.sessionId === sessionId && r.roundId === roundId);
          if (regIndex !== -1) {
            registrations[regIndex].status = 'matched';
            registrations[regIndex].matchId = matchId;
            registrations[regIndex].matchPartnerNames = match.participants.filter((p: any) => p.participantId !== participantId).map((p: any) => `${p.firstName} ${p.lastName}`);
            registrations[regIndex].meetingPointId = match.meetingPoint;
            registrations[regIndex].lastStatusUpdate = new Date().toISOString();
            await kv.set(`participant_registrations:${participantId}`, registrations);
          }
        }
      }
    }
    
    // 8.5. Handle odd participant AFTER matches are saved (if exactly 1 left over, add to smallest existing match)
    const matchedIds = matches.flatMap((m: any) => m.participantIds);
    const unmatchedParticipants = confirmedParticipants.filter((p: any) => !matchedIds.includes(p.participantId));
    
    if (unmatchedParticipants.length === 1 && matches.length > 0) {
      const oddParticipant = unmatchedParticipants[0];
      console.log(`👤 One odd participant found, adding to existing group`);
      
      // Find the smallest match (or random if all same size)
      let smallestMatch = matches[0];
      for (const match of matches) {
        if (match.participantIds.length < smallestMatch.participantIds.length) {
          smallestMatch = match;
        }
      }
      
      // Add odd participant to this match
      smallestMatch.participantIds.push(oddParticipant.participantId);
      smallestMatch.participants.push({
        participantId: oddParticipant.participantId,
        firstName: oddParticipant.firstName,
        lastName: oddParticipant.lastName,
        email: oddParticipant.email,
        team: oddParticipant.team,
        topics: oddParticipant.topics || []
      });
      
      console.log(`✅ Added odd participant to match ${smallestMatch.matchId}, new size: ${smallestMatch.participantIds.length}`);
      
      // Re-save the updated match
      await kv.set(`match:${sessionId}:${roundId}:${smallestMatch.matchId}`, smallestMatch);
      
      // Update odd participant's status
      oddParticipant.status = 'matched';
      oddParticipant.matchId = smallestMatch.matchId;
      oddParticipant.matchedAt = new Date().toISOString();
      await kv.set(`participant:${sessionId}:${roundId}:${oddParticipant.participantId}`, oddParticipant);
      
      // Update in participant_registrations
      const registrations = await kv.get(`participant_registrations:${oddParticipant.participantId}`) || [];
      const regIndex = registrations.findIndex((r: any) => r.sessionId === sessionId && r.roundId === roundId);
      if (regIndex !== -1) {
        registrations[regIndex].status = 'matched';
        registrations[regIndex].matchId = smallestMatch.matchId;
        registrations[regIndex].matchPartnerNames = smallestMatch.participants
          .filter((p: any) => p.participantId !== oddParticipant.participantId)
          .map((p: any) => `${p.firstName} ${p.lastName}`);
        registrations[regIndex].meetingPointId = smallestMatch.meetingPoint;
        registrations[regIndex].lastStatusUpdate = new Date().toISOString();
        await kv.set(`participant_registrations:${oddParticipant.participantId}`, registrations);
      }
      
      // Remove from unmatchedParticipants array
      const unmatchedIndex = unmatchedParticipants.indexOf(oddParticipant);
      if (unmatchedIndex !== -1) {
        unmatchedParticipants.splice(unmatchedIndex, 1);
      }
    }
    
    // 9. Mark any remaining leftover participants as 'no-match'
    for (const participant of unmatchedParticipants) {
      participant.status = 'no-match';
      participant.noMatchReason = 'Could not find a suitable match';
      await kv.set(`participant:${sessionId}:${roundId}:${participant.participantId}`, participant);
      
      // Update in participant_registrations
      const registrations = await kv.get(`participant_registrations:${participant.participantId}`) || [];
      const regIndex = registrations.findIndex((r: any) => r.sessionId === sessionId && r.roundId === roundId);
      if (regIndex !== -1) {
        registrations[regIndex].status = 'no-match';
        registrations[regIndex].noMatchReason = 'Could not find a suitable match';
        registrations[regIndex].lastStatusUpdate = new Date().toISOString();
        await kv.set(`participant_registrations:${participant.participantId}`, registrations);
      }
    }
    
    console.log(`❌ Unmatched participants: ${unmatchedParticipants.length}`);
    
    // 10. Set matching lock to prevent re-running
    await kv.set(matchingLockKey, { 
      completedAt: new Date().toISOString(), 
      matchCount: matches.length,
      unmatchedCount: unmatchedParticipants.length
    });
    
    console.log(`✅ MATCHING COMPLETE`);
    
    return { 
      success: true, 
      matches, 
      matchCount: matches.length,
      unmatchedCount: unmatchedParticipants.length
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
 * Scoring system:
 * - Meeting memory (30 points): participants who haven't met before get higher priority
 * - Teams matching (20 points): tries to match different teams together
 * - Topics matching (10 points): tries to match participants with similar topics
 * 
 * @param participants - Array of confirmed participants
 * @param groupSize - Desired group size (2, 3, 4...)
 * @param sessionId - Session ID
 * @param roundId - Round ID
 * @param matchingType - Type of matching ('across-teams' or 'within-teams')
 * @returns Array of matches
 */
async function runMatchingAlgorithm(participants: any[], groupSize: number, sessionId: string, roundId: string, matchingType: string) {
  const matches = [];
  const availableParticipants = [...participants];
  
  // Get meeting history for all participants
  const meetingHistory = await getMeetingHistory(sessionId, participants);
  
  // Calculate scores for all possible pairings
  const scoredPairs = calculatePairingScores(availableParticipants, meetingHistory, matchingType);
  
  // Greedy matching: repeatedly pick the best scoring group
  while (availableParticipants.length >= groupSize) {
    const bestGroup = findBestGroup(availableParticipants, groupSize, scoredPairs, meetingHistory);
    
    if (!bestGroup || bestGroup.length === 0) {
      // No good groups found, break
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
 */
async function getMeetingHistory(sessionId: string, participants: any[]) {
  const history: Record<string, Set<string>> = {};
  
  // Initialize history for each participant
  for (const p of participants) {
    history[p.participantId] = new Set();
  }
  
  // Get all past matches in this session
  const allMatches = await kv.getByPrefix(`match:${sessionId}:`);
  
  for (const match of allMatches) {
    if (match.participantIds && Array.isArray(match.participantIds)) {
      // For each pair in this match, record that they met
      for (let i = 0; i < match.participantIds.length; i++) {
        for (let j = i + 1; j < match.participantIds.length; j++) {
          const id1 = match.participantIds[i];
          const id2 = match.participantIds[j];
          
          if (history[id1]) history[id1].add(id2);
          if (history[id2]) history[id2].add(id1);
        }
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
    // Use greedy approach: start with best pair, then add best fitting participants
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