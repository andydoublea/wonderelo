/**
 * i18n Database Operations
 * All i18n table queries and mutations
 */

import { getGlobalSupabaseClient } from './global-supabase.tsx';

function getSupabase() {
  return getGlobalSupabaseClient();
}

// ============================================
// LANGUAGES
// ============================================

export async function listLanguages(includeInactive = false) {
  let query = getSupabase()
    .from('i18n_languages')
    .select('*')
    .order('sort_order', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getLanguage(code: string) {
  const { data, error } = await getSupabase()
    .from('i18n_languages')
    .select('*')
    .eq('code', code)
    .single();
  if (error) throw error;
  return data;
}

export async function createLanguage(lang: {
  code: string;
  name: string;
  native_name: string;
  flag_emoji?: string;
  is_default?: boolean;
  is_active?: boolean;
  sort_order?: number;
}) {
  // If setting as default, unset current default first
  if (lang.is_default) {
    await getSupabase()
      .from('i18n_languages')
      .update({ is_default: false })
      .eq('is_default', true);
  }

  const { data, error } = await getSupabase()
    .from('i18n_languages')
    .insert(lang)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLanguage(code: string, updates: {
  name?: string;
  native_name?: string;
  flag_emoji?: string;
  is_default?: boolean;
  is_active?: boolean;
  sort_order?: number;
}) {
  // If setting as default, unset current default first
  if (updates.is_default) {
    await getSupabase()
      .from('i18n_languages')
      .update({ is_default: false })
      .eq('is_default', true);
  }

  const { data, error } = await getSupabase()
    .from('i18n_languages')
    .update(updates)
    .eq('code', code)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLanguage(code: string) {
  const { error } = await getSupabase()
    .from('i18n_languages')
    .delete()
    .eq('code', code);
  if (error) throw error;
}

// ============================================
// KEYS
// ============================================

export async function listKeys(filters: {
  namespace?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  let query = getSupabase()
    .from('i18n_keys')
    .select('*', { count: 'exact' })
    .order('namespace', { ascending: true })
    .order('key', { ascending: true });

  if (filters.namespace) {
    query = query.eq('namespace', filters.namespace);
  }
  if (filters.search) {
    query = query.or(
      `key.ilike.%${filters.search}%,default_text.ilike.%${filters.search}%`
    );
  }

  const limit = filters.limit || 100;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
}

export async function createKey(key: {
  key: string;
  namespace: string;
  default_text: string;
  description?: string;
}) {
  const { data, error } = await getSupabase()
    .from('i18n_keys')
    .insert(key)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateKey(id: string, updates: {
  default_text?: string;
  description?: string;
}) {
  const { data, error } = await getSupabase()
    .from('i18n_keys')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteKey(id: string) {
  const { error } = await getSupabase()
    .from('i18n_keys')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getNamespaces() {
  const { data, error } = await getSupabase()
    .from('i18n_keys')
    .select('namespace')
    .order('namespace', { ascending: true });
  if (error) throw error;
  // Deduplicate
  const namespaces = [...new Set((data || []).map((d: any) => d.namespace))];
  return namespaces;
}

// ============================================
// TRANSLATIONS
// ============================================

/**
 * Get all translations for a language as a flat { key: text } map.
 * Falls back to default_text from i18n_keys for missing translations.
 */
export async function getTranslationBundle(languageCode: string) {
  // Get all keys with their translations for this language
  const { data, error } = await getSupabase()
    .from('i18n_keys')
    .select(`
      key,
      default_text,
      i18n_translations!left(translated_text, language_code)
    `);
  if (error) throw error;

  const bundle: Record<string, string> = {};
  for (const row of data || []) {
    const translation = (row.i18n_translations || []).find(
      (t: any) => t.language_code === languageCode
    );
    bundle[row.key] = translation?.translated_text || row.default_text;
  }
  return bundle;
}

/**
 * Get all translations for a language with full details (for admin editor).
 */
export async function getTranslationsForLanguage(languageCode: string) {
  const { data, error } = await getSupabase()
    .from('i18n_keys')
    .select(`
      id,
      key,
      namespace,
      default_text,
      description,
      i18n_translations!left(id, translated_text, status, updated_by, updated_at, language_code)
    `)
    .order('namespace', { ascending: true })
    .order('key', { ascending: true });
  if (error) throw error;

  return (data || []).map((row: any) => {
    const translation = (row.i18n_translations || []).find(
      (t: any) => t.language_code === languageCode
    );
    return {
      key_id: row.id,
      key: row.key,
      namespace: row.namespace,
      default_text: row.default_text,
      description: row.description,
      translation_id: translation?.id || null,
      translated_text: translation?.translated_text || '',
      status: translation?.status || null,
      updated_by: translation?.updated_by || null,
      updated_at: translation?.updated_at || null,
    };
  });
}

export async function upsertTranslation(data: {
  key_id: string;
  language_code: string;
  translated_text: string;
  status?: string;
  updated_by?: string;
}) {
  const { data: result, error } = await getSupabase()
    .from('i18n_translations')
    .upsert(
      {
        key_id: data.key_id,
        language_code: data.language_code,
        translated_text: data.translated_text,
        status: data.status || 'draft',
        updated_by: data.updated_by || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key_id,language_code' }
    )
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function bulkUpsertTranslations(translations: Array<{
  key_id: string;
  language_code: string;
  translated_text: string;
  status?: string;
  updated_by?: string;
}>) {
  const records = translations.map(t => ({
    key_id: t.key_id,
    language_code: t.language_code,
    translated_text: t.translated_text,
    status: t.status || 'ai_translated',
    updated_by: t.updated_by || 'ai',
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await getSupabase()
    .from('i18n_translations')
    .upsert(records, { onConflict: 'key_id,language_code' })
    .select();
  if (error) throw error;
  return data;
}

/**
 * Get keys that need translation for a given language.
 * Optionally filter by specific key IDs.
 */
export async function getKeysForTranslation(languageCode: string, keyIds?: string[]) {
  let query = getSupabase()
    .from('i18n_keys')
    .select(`
      id,
      key,
      namespace,
      default_text,
      description,
      i18n_translations!left(translated_text, language_code)
    `);

  if (keyIds && keyIds.length > 0) {
    query = query.in('id', keyIds);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((row: any) => {
    const existing = (row.i18n_translations || []).find(
      (t: any) => t.language_code === languageCode
    );
    return {
      id: row.id,
      key: row.key,
      namespace: row.namespace,
      default_text: row.default_text,
      description: row.description,
      existing_translation: existing?.translated_text || null,
    };
  });
}

// ============================================
// IMPORT / EXPORT
// ============================================

export async function exportTranslations(languageCode: string) {
  return getTranslationBundle(languageCode);
}

export async function importTranslations(
  languageCode: string,
  translations: Record<string, string>,
  updatedBy?: string
) {
  // Get all keys first
  const { data: keys, error: keysError } = await getSupabase()
    .from('i18n_keys')
    .select('id, key');
  if (keysError) throw keysError;

  const keyMap = new Map((keys || []).map((k: any) => [k.key, k.id]));
  const records = [];

  for (const [key, text] of Object.entries(translations)) {
    const keyId = keyMap.get(key);
    if (keyId) {
      records.push({
        key_id: keyId,
        language_code: languageCode,
        translated_text: text,
        status: 'draft',
        updated_by: updatedBy || 'import',
        updated_at: new Date().toISOString(),
      });
    }
  }

  if (records.length > 0) {
    const { data, error } = await getSupabase()
      .from('i18n_translations')
      .upsert(records, { onConflict: 'key_id,language_code' })
      .select();
    if (error) throw error;
    return { imported: data?.length || 0, skipped: Object.keys(translations).length - records.length };
  }

  return { imported: 0, skipped: Object.keys(translations).length };
}
