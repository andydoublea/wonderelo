// Force delete participant by ID - V2 with proper key handling
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';
import * as kv from './kv_store.tsx';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export async function forceDeleteParticipant(participantId: string) {
  console.log('=== FORCE DELETE PARTICIPANT ===', participantId);
  
  const deletedKeys: string[] = [];
  
  // 1. Delete all participant: keys for this participant
  const { data: participantRows, error: participantError } = await supabase
    .from('kv_store_ce05600a')
    .select('key, value')
    .like('key', 'participant:%');
  
  if (participantError) {
    throw new Error(`Failed to fetch participant keys: ${participantError.message}`);
  }
  
  for (const row of (participantRows || [])) {
    const key = row.key;
    const data = row.value as any;
    if (data.id === participantId || key.endsWith(`:${participantId}`)) {
      await kv.del(key);
      deletedKeys.push(key);
      console.log(`Deleted participant key: ${key}`);
    }
  }
  
  // 2. Delete participant_email: keys
  const { data: emailRows, error: emailError } = await supabase
    .from('kv_store_ce05600a')
    .select('key, value')
    .like('key', 'participant_email:%');
  
  if (emailError) {
    throw new Error(`Failed to fetch email keys: ${emailError.message}`);
  }
  
  for (const row of (emailRows || [])) {
    const key = row.key;
    const data = row.value as any;
    if (data.participantId === participantId) {
      await kv.del(key);
      deletedKeys.push(key);
      console.log(`Deleted email key: ${key}`);
    }
  }
  
  // 3. Delete participant_profile
  const profileKey = `participant_profile:${participantId}`;
  const profile = await kv.get(profileKey);
  if (profile) {
    await kv.del(profileKey);
    deletedKeys.push(profileKey);
    console.log(`Deleted profile key: ${profileKey}`);
  }
  
  // 4. Delete participant_registrations
  const registrationsKey = `participant_registrations:${participantId}`;
  const registrations = await kv.get(registrationsKey);
  if (registrations) {
    await kv.del(registrationsKey);
    deletedKeys.push(registrationsKey);
    console.log(`Deleted registrations key: ${registrationsKey}`);
  }
  
  // 5. Delete participant_audit
  const auditKey = `participant_audit:${participantId}`;
  const audit = await kv.get(auditKey);
  if (audit) {
    await kv.del(auditKey);
    deletedKeys.push(auditKey);
    console.log(`Deleted audit key: ${auditKey}`);
  }
  
  // 6. Delete participant_token_by_id and participant_token
  const tokenByIdKey = `participant_token_by_id:${participantId}`;
  const token = await kv.get(tokenByIdKey);
  if (token) {
    await kv.del(tokenByIdKey);
    deletedKeys.push(tokenByIdKey);
    console.log(`Deleted token_by_id key: ${tokenByIdKey}`);
    
    const tokenKey = `participant_token:${token}`;
    await kv.del(tokenKey);
    deletedKeys.push(tokenKey);
    console.log(`Deleted token key: ${tokenKey}`);
  }
  
  // 7. Delete verification: keys
  const { data: verificationRows, error: verificationError } = await supabase
    .from('kv_store_ce05600a')
    .select('key, value')
    .like('key', 'verification:%');
  
  if (verificationError) {
    throw new Error(`Failed to fetch verification keys: ${verificationError.message}`);
  }
  
  for (const row of (verificationRows || [])) {
    const key = row.key;
    const data = row.value as any;
    if (data.participantId === participantId) {
      await kv.del(key);
      deletedKeys.push(key);
      console.log(`Deleted verification key: ${key}`);
    }
  }
  
  // 8. Delete participant_access: keys
  const { data: accessRows, error: accessError } = await supabase
    .from('kv_store_ce05600a')
    .select('key, value')
    .like('key', 'participant_access:%');
  
  if (accessError) {
    throw new Error(`Failed to fetch access keys: ${accessError.message}`);
  }
  
  for (const row of (accessRows || [])) {
    const key = row.key;
    const data = row.value as any;
    if (data.participantId === participantId) {
      await kv.del(key);
      deletedKeys.push(key);
      console.log(`Deleted access key: ${key}`);
    }
  }
  
  console.log(`Total deleted keys: ${deletedKeys.length}`);
  
  return {
    success: true,
    message: `Force deleted participant ${participantId}`,
    deletedKeys,
    deletedCount: deletedKeys.length
  };
}
