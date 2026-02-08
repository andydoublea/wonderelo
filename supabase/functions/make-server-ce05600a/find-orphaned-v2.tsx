// Find orphaned participants - V2 with proper key handling
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';
import * as kv from './kv_store.tsx';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export async function findOrphanedParticipantsV2() {
  console.log('=== FINDING ORPHANED PARTICIPANTS ===');
  
  // Get all email and profile records with KEYS
  const { data: allEmailRows, error: emailError } = await supabase
    .from('kv_store_ce05600a')
    .select('key, value')
    .like('key', 'participant_email:%');
  
  const { data: allProfileRows, error: profileError } = await supabase
    .from('kv_store_ce05600a')
    .select('key, value')
    .like('key', 'participant_profile:%');
  
  if (emailError || profileError) {
    throw new Error(`Failed to fetch participants: ${emailError?.message || profileError?.message}`);
  }
  
  const orphanedParticipants = [];
  
  console.log(`Total emails found: ${allEmailRows?.length || 0}`);
  console.log(`Total profiles found: ${allProfileRows?.length || 0}`);
  
  // Find orphaned email records
  for (const row of (allEmailRows || [])) {
    const emailKey = row.key;
    const data = row.value as any;
    const participantId = data.participantId;
    
    if (!participantId) {
      orphanedParticipants.push({
        type: 'missing_id_in_email',
        key: emailKey,
        participantId: null,
        data: data
      });
      continue;
    }
    
    const profile = await kv.get(`participant_profile:${participantId}`);
    if (!profile) {
      orphanedParticipants.push({
        type: 'missing_profile',
        participantId,
        emailKey,
        email: data.email
      });
    }
    
    if (!data.email || data.email === '') {
      orphanedParticipants.push({
        type: 'empty_email',
        participantId,
        emailKey,
        data
      });
    }
  }
  
  // Find orphaned profile records (no email)
  for (const row of (allProfileRows || [])) {
    const profileKey = row.key;
    const participantId = profileKey.replace('participant_profile:', '');
    const emailRecord = (allEmailRows || []).find((e: any) => e.value.participantId === participantId);
    
    if (!emailRecord) {
      orphanedParticipants.push({
        type: 'profile_without_email',
        participantId,
        profileKey,
        profile: row.value
      });
    }
  }
  
  console.log(`Found ${orphanedParticipants.length} orphaned participants`);
  
  return {
    success: true,
    orphanedCount: orphanedParticipants.length,
    orphanedParticipants
  };
}
