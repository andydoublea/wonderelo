// Force delete orphaned participants - V2 with proper key handling
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';
import * as kv from './kv_store.tsx';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export async function forceDeleteAllOrphanedV2() {
  console.log('=== FORCE DELETE ALL ORPHANED PARTICIPANTS ===');
  
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
  const deletedKeys: string[] = [];
  
  console.log(`Total emails found: ${allEmailRows?.length || 0}`);
  console.log(`Total profiles found: ${allProfileRows?.length || 0}`);
  
  // Find orphaned email records (no profile or missing data)
  for (const row of (allEmailRows || [])) {
    const emailKey = row.key;
    const data = row.value as any;
    const participantId = data.participantId;
    
    if (!participantId || !data.email || data.email === '') {
      console.log(`Deleting orphaned email (no ID or empty): ${emailKey}`);
      await kv.del(emailKey);
      deletedKeys.push(emailKey);
      orphanedParticipants.push({ type: 'orphaned_email', key: emailKey });
      continue;
    }
    
    const profile = await kv.get(`participant_profile:${participantId}`);
    if (!profile) {
      console.log(`Deleting email without profile: ${emailKey} (participant: ${participantId})`);
      await kv.del(emailKey);
      deletedKeys.push(emailKey);
      
      // Delete all participant: keys with this ID
      const { data: allParticipantKeys } = await supabase
        .from('kv_store_ce05600a')
        .select('key, value')
        .like('key', 'participant:%');
      
      for (const pRow of (allParticipantKeys || [])) {
        const pData = pRow.value as any;
        if (pData.id === participantId || pRow.key.endsWith(`:${participantId}`)) {
          console.log(`  -> Deleting related participant key: ${pRow.key}`);
          await kv.del(pRow.key);
          deletedKeys.push(pRow.key);
        }
      }
      
      orphanedParticipants.push({ type: 'missing_profile', participantId, emailKey });
    }
  }
  
  // Reload profiles after email cleanup
  const { data: allProfileRowsAfterCleanup } = await supabase
    .from('kv_store_ce05600a')
    .select('key, value')
    .like('key', 'participant_profile:%');
  
  console.log(`Profiles after email cleanup: ${allProfileRowsAfterCleanup?.length || 0}`);
  
  // Find orphaned profile records (no email)
  for (const row of (allProfileRowsAfterCleanup || [])) {
    const profileKey = row.key;
    const participantId = profileKey.replace('participant_profile:', '');
    
    // Reload emails to get fresh data
    const { data: freshEmailRows } = await supabase
      .from('kv_store_ce05600a')
      .select('key, value')
      .like('key', 'participant_email:%');
    
    const emailRecord = (freshEmailRows || []).find((e: any) => e.value.participantId === participantId);
    
    if (!emailRecord) {
      console.log(`Deleting profile without email: ${profileKey} (participant: ${participantId})`);
      await kv.del(profileKey);
      deletedKeys.push(profileKey);
      
      // Delete registrations and audit log
      await kv.del(`participant_registrations:${participantId}`);
      deletedKeys.push(`participant_registrations:${participantId}`);
      
      await kv.del(`participant_audit:${participantId}`);
      deletedKeys.push(`participant_audit:${participantId}`);
      
      // Delete tokens
      const tokenByIdKey = `participant_token_by_id:${participantId}`;
      const token = await kv.get(tokenByIdKey);
      if (token) {
        console.log(`  -> Deleting token: ${tokenByIdKey}`);
        await kv.del(tokenByIdKey);
        deletedKeys.push(tokenByIdKey);
        await kv.del(`participant_token:${token}`);
        deletedKeys.push(`participant_token:${token}`);
      }
      
      // Delete verification tokens
      const { data: verificationTokens } = await supabase
        .from('kv_store_ce05600a')
        .select('key, value')
        .like('key', 'verification:%');
      
      for (const vRow of (verificationTokens || [])) {
        const vData = vRow.value as any;
        if (vData.participantId === participantId) {
          console.log(`  -> Deleting verification token: ${vRow.key}`);
          await kv.del(vRow.key);
          deletedKeys.push(vRow.key);
        }
      }
      
      // Delete access tokens
      const { data: accessTokens } = await supabase
        .from('kv_store_ce05600a')
        .select('key, value')
        .like('key', 'participant_access:%');
      
      for (const aRow of (accessTokens || [])) {
        const aData = aRow.value as any;
        if (aData.participantId === participantId) {
          console.log(`  -> Deleting access token: ${aRow.key}`);
          await kv.del(aRow.key);
          deletedKeys.push(aRow.key);
        }
      }
      
      // Delete participant: keys
      const { data: allParticipantKeys } = await supabase
        .from('kv_store_ce05600a')
        .select('key, value')
        .like('key', 'participant:%');
      
      for (const pRow of (allParticipantKeys || [])) {
        const pData = pRow.value as any;
        if (pData.id === participantId || pRow.key.endsWith(`:${participantId}`)) {
          console.log(`  -> Deleting related participant key: ${pRow.key}`);
          await kv.del(pRow.key);
          deletedKeys.push(pRow.key);
        }
      }
      
      orphanedParticipants.push({ type: 'profile_without_email', participantId, profileKey });
    }
  }
  
  console.log(`Deleted ${deletedKeys.length} orphaned keys from ${orphanedParticipants.length} orphaned participants`);
  
  return {
    success: true,
    message: `Force deleted all orphaned participants`,
    orphanedCount: orphanedParticipants.length,
    deletedKeys,
    deletedCount: deletedKeys.length
  };
}
