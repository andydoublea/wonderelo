/**
 * i18n Routes
 * All i18n/translation API endpoints
 */

import { Hono } from 'npm:hono';
import * as i18nDb from './db-i18n.ts';
import { errorLog, debugLog } from './debug.tsx';

const PREFIX = '/make-server-ce05600a';

export function registerI18nRoutes(app: Hono) {

  // ============================================
  // PUBLIC ENDPOINTS (no auth required)
  // ============================================

  /**
   * GET /i18n/languages - List active languages
   */
  app.get(`${PREFIX}/i18n/languages`, async (c) => {
    try {
      const languages = await i18nDb.listLanguages(false);
      return c.json(languages);
    } catch (error) {
      errorLog('i18n list languages error:', error);
      return c.json({ error: 'Failed to fetch languages' }, 500);
    }
  });

  /**
   * GET /i18n/translations/:lang - Get translation bundle for a language
   */
  app.get(`${PREFIX}/i18n/translations/:lang`, async (c) => {
    try {
      const lang = c.req.param('lang');
      const bundle = await i18nDb.getTranslationBundle(lang);
      return c.json(bundle);
    } catch (error) {
      errorLog('i18n get translations error:', error);
      return c.json({ error: 'Failed to fetch translations' }, 500);
    }
  });

  // ============================================
  // ADMIN ENDPOINTS (auth required)
  // ============================================

  // --- Languages ---

  /**
   * GET /admin/i18n/languages - List all languages (including inactive)
   */
  app.get(`${PREFIX}/admin/i18n/languages`, async (c) => {
    try {
      const languages = await i18nDb.listLanguages(true);
      return c.json(languages);
    } catch (error) {
      errorLog('admin i18n list languages error:', error);
      return c.json({ error: 'Failed to fetch languages' }, 500);
    }
  });

  /**
   * POST /admin/i18n/languages - Add a new language
   */
  app.post(`${PREFIX}/admin/i18n/languages`, async (c) => {
    try {
      const body = await c.req.json();
      const language = await i18nDb.createLanguage(body);
      return c.json(language, 201);
    } catch (error) {
      errorLog('admin i18n create language error:', error);
      return c.json({ error: 'Failed to create language' }, 500);
    }
  });

  /**
   * PUT /admin/i18n/languages/:code - Update a language
   */
  app.put(`${PREFIX}/admin/i18n/languages/:code`, async (c) => {
    try {
      const code = c.req.param('code');
      const body = await c.req.json();
      const language = await i18nDb.updateLanguage(code, body);
      return c.json(language);
    } catch (error) {
      errorLog('admin i18n update language error:', error);
      return c.json({ error: 'Failed to update language' }, 500);
    }
  });

  /**
   * DELETE /admin/i18n/languages/:code - Remove a language
   */
  app.delete(`${PREFIX}/admin/i18n/languages/:code`, async (c) => {
    try {
      const code = c.req.param('code');
      await i18nDb.deleteLanguage(code);
      return c.json({ success: true });
    } catch (error) {
      errorLog('admin i18n delete language error:', error);
      return c.json({ error: 'Failed to delete language' }, 500);
    }
  });

  // --- Keys ---

  /**
   * GET /admin/i18n/keys - List all keys
   */
  app.get(`${PREFIX}/admin/i18n/keys`, async (c) => {
    try {
      const { namespace, search, limit, offset } = c.req.query();
      const result = await i18nDb.listKeys({
        namespace,
        search,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });
      return c.json(result);
    } catch (error) {
      errorLog('admin i18n list keys error:', error);
      return c.json({ error: 'Failed to list keys' }, 500);
    }
  });

  /**
   * GET /admin/i18n/namespaces - List all namespaces
   */
  app.get(`${PREFIX}/admin/i18n/namespaces`, async (c) => {
    try {
      const namespaces = await i18nDb.getNamespaces();
      return c.json(namespaces);
    } catch (error) {
      errorLog('admin i18n list namespaces error:', error);
      return c.json({ error: 'Failed to list namespaces' }, 500);
    }
  });

  /**
   * POST /admin/i18n/keys - Create a new key
   */
  app.post(`${PREFIX}/admin/i18n/keys`, async (c) => {
    try {
      const body = await c.req.json();
      const key = await i18nDb.createKey(body);
      return c.json(key, 201);
    } catch (error) {
      errorLog('admin i18n create key error:', error);
      return c.json({ error: 'Failed to create key' }, 500);
    }
  });

  /**
   * PUT /admin/i18n/keys/:id - Update a key
   */
  app.put(`${PREFIX}/admin/i18n/keys/:id`, async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const key = await i18nDb.updateKey(id, body);
      return c.json(key);
    } catch (error) {
      errorLog('admin i18n update key error:', error);
      return c.json({ error: 'Failed to update key' }, 500);
    }
  });

  /**
   * DELETE /admin/i18n/keys/:id - Delete a key
   */
  app.delete(`${PREFIX}/admin/i18n/keys/:id`, async (c) => {
    try {
      const id = c.req.param('id');
      await i18nDb.deleteKey(id);
      return c.json({ success: true });
    } catch (error) {
      errorLog('admin i18n delete key error:', error);
      return c.json({ error: 'Failed to delete key' }, 500);
    }
  });

  // --- Translations ---

  /**
   * GET /admin/i18n/translations/:lang - All translations for a language (with details)
   */
  app.get(`${PREFIX}/admin/i18n/translations/:lang`, async (c) => {
    try {
      const lang = c.req.param('lang');
      const translations = await i18nDb.getTranslationsForLanguage(lang);
      return c.json(translations);
    } catch (error) {
      errorLog('admin i18n get translations error:', error);
      return c.json({ error: 'Failed to fetch translations' }, 500);
    }
  });

  /**
   * PUT /admin/i18n/translations - Upsert a single translation
   */
  app.put(`${PREFIX}/admin/i18n/translations`, async (c) => {
    try {
      const body = await c.req.json();
      const result = await i18nDb.upsertTranslation(body);
      return c.json(result);
    } catch (error) {
      errorLog('admin i18n upsert translation error:', error);
      return c.json({ error: 'Failed to save translation' }, 500);
    }
  });

  // --- AI Translation ---

  /**
   * POST /admin/i18n/translate-ai - Bulk AI translate
   * Body: { source_lang: string, target_lang: string, target_lang_name: string, key_ids?: string[] }
   */
  app.post(`${PREFIX}/admin/i18n/translate-ai`, async (c) => {
    try {
      const { source_lang, target_lang, target_lang_name, key_ids } = await c.req.json();

      // Get keys that need translation
      const keys = await i18nDb.getKeysForTranslation(target_lang, key_ids);

      if (keys.length === 0) {
        return c.json({ translated: 0, message: 'No keys to translate' });
      }

      // Get source translations (or defaults) for context
      const sourceBundle = await i18nDb.getTranslationBundle(source_lang);

      // Prepare batches (max 50 per request)
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < keys.length; i += batchSize) {
        batches.push(keys.slice(i, i + batchSize));
      }

      const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
      if (!ANTHROPIC_API_KEY) {
        return c.json({ error: 'ANTHROPIC_API_KEY not configured' }, 500);
      }

      let totalTranslated = 0;

      for (const batch of batches) {
        // Build prompt
        const keysForTranslation = batch.map(k => ({
          key: k.key,
          source_text: sourceBundle[k.key] || k.default_text,
          context: k.description || k.namespace,
        }));

        const prompt = `You are a professional translator. Translate the following UI strings from English to ${target_lang_name}.

RULES:
- Maintain the same tone and formality level
- Keep placeholders like {year}, {name} unchanged
- Keep brand names (Wonderelo) unchanged
- Keep technical terms if they are commonly used untranslated in ${target_lang_name}
- Return ONLY a valid JSON object mapping keys to translated strings
- No explanations, just the JSON

Input:
${JSON.stringify(keysForTranslation, null, 2)}

Return a JSON object like: { "key1": "translated text 1", "key2": "translated text 2" }`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages: [{
              role: 'user',
              content: prompt,
            }],
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          errorLog('Anthropic API error:', errText);
          continue;
        }

        const aiResponse = await response.json();
        const content = aiResponse.content?.[0]?.text || '';

        // Parse JSON from response (handle potential markdown code blocks)
        let translatedMap: Record<string, string>;
        try {
          const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          translatedMap = JSON.parse(jsonStr);
        } catch {
          errorLog('Failed to parse AI translation response:', content);
          continue;
        }

        // Save translations
        const translationsToSave = batch
          .filter(k => translatedMap[k.key])
          .map(k => ({
            key_id: k.id,
            language_code: target_lang,
            translated_text: translatedMap[k.key],
            status: 'ai_translated',
            updated_by: 'ai',
          }));

        if (translationsToSave.length > 0) {
          await i18nDb.bulkUpsertTranslations(translationsToSave);
          totalTranslated += translationsToSave.length;
        }
      }

      return c.json({ translated: totalTranslated, total: keys.length });
    } catch (error) {
      errorLog('admin i18n AI translate error:', error);
      return c.json({ error: 'Failed to perform AI translation' }, 500);
    }
  });

  // --- Import / Export ---

  /**
   * GET /admin/i18n/export/:lang - Export translations as JSON
   */
  app.get(`${PREFIX}/admin/i18n/export/:lang`, async (c) => {
    try {
      const lang = c.req.param('lang');
      const bundle = await i18nDb.exportTranslations(lang);
      return c.json(bundle);
    } catch (error) {
      errorLog('admin i18n export error:', error);
      return c.json({ error: 'Failed to export translations' }, 500);
    }
  });

  /**
   * POST /admin/i18n/import/:lang - Import translations from JSON
   */
  app.post(`${PREFIX}/admin/i18n/import/:lang`, async (c) => {
    try {
      const lang = c.req.param('lang');
      const body = await c.req.json();
      const result = await i18nDb.importTranslations(lang, body.translations, body.updated_by);
      return c.json(result);
    } catch (error) {
      errorLog('admin i18n import error:', error);
      return c.json({ error: 'Failed to import translations' }, 500);
    }
  });
}
