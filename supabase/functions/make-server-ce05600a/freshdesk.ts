/**
 * Freshdesk API Client
 * Handles email communication via Freshdesk
 */

import { getGlobalSupabaseClient } from './global-supabase.tsx';
import { errorLog, debugLog } from './debug.tsx';

interface FreshdeskConfig {
  api_key: string;
  domain: string; // e.g. "wonderelo" for wonderelo.freshdesk.com
}

async function getConfig(): Promise<FreshdeskConfig | null> {
  const { data } = await getGlobalSupabaseClient()
    .from('admin_settings')
    .select('value')
    .eq('key', 'freshdesk_config')
    .maybeSingle();
  return data?.value || null;
}

function getBaseUrl(config: FreshdeskConfig): string {
  return `https://${config.domain}.freshdesk.com/api/v2`;
}

function getHeaders(config: FreshdeskConfig): HeadersInit {
  const encoded = btoa(`${config.api_key}:X`);
  return {
    'Authorization': `Basic ${encoded}`,
    'Content-Type': 'application/json',
  };
}

// ============================================
// CONNECTION
// ============================================

export async function checkConnection(): Promise<{ connected: boolean; error?: string }> {
  const config = await getConfig();
  if (!config?.api_key || !config?.domain) {
    return { connected: false, error: 'Freshdesk not configured' };
  }

  try {
    const response = await fetch(`${getBaseUrl(config)}/agents/me`, {
      headers: getHeaders(config),
    });
    if (!response.ok) {
      return { connected: false, error: `HTTP ${response.status}` };
    }
    return { connected: true };
  } catch (err: any) {
    return { connected: false, error: err.message };
  }
}

export async function saveConfig(config: FreshdeskConfig) {
  const supabase = getGlobalSupabaseClient();
  const { error } = await supabase
    .from('admin_settings')
    .upsert({ key: 'freshdesk_config', value: config, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// ============================================
// TICKETS / EMAIL THREADS
// ============================================

export async function getTicketsByEmail(email: string): Promise<any[]> {
  const config = await getConfig();
  if (!config) return [];

  try {
    const response = await fetch(
      `${getBaseUrl(config)}/tickets?email=${encodeURIComponent(email)}&include=description`,
      { headers: getHeaders(config) }
    );
    if (!response.ok) {
      errorLog('Freshdesk getTickets error:', response.status);
      return [];
    }
    return await response.json();
  } catch (err) {
    errorLog('Freshdesk getTickets error:', err);
    return [];
  }
}

export async function getTicketConversations(ticketId: number): Promise<any[]> {
  const config = await getConfig();
  if (!config) return [];

  try {
    const response = await fetch(
      `${getBaseUrl(config)}/tickets/${ticketId}/conversations`,
      { headers: getHeaders(config) }
    );
    if (!response.ok) return [];
    return await response.json();
  } catch (err) {
    errorLog('Freshdesk getConversations error:', err);
    return [];
  }
}

// ============================================
// SEND EMAIL
// ============================================

export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
  contactName?: string;
}): Promise<{ success: boolean; ticketId?: number; error?: string }> {
  const config = await getConfig();
  if (!config) return { success: false, error: 'Freshdesk not configured' };

  try {
    // Create an outbound email ticket
    const response = await fetch(`${getBaseUrl(config)}/tickets`, {
      method: 'POST',
      headers: getHeaders(config),
      body: JSON.stringify({
        email: params.to,
        subject: params.subject,
        description: params.body,
        status: 2, // Open
        priority: 1, // Low
        type: 'Outbound Email',
        name: params.contactName,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      errorLog('Freshdesk sendEmail error:', response.status, errBody);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const ticket = await response.json();
    return { success: true, ticketId: ticket.id };
  } catch (err: any) {
    errorLog('Freshdesk sendEmail error:', err);
    return { success: false, error: err.message };
  }
}

// ============================================
// CONTACT SYNC
// ============================================

export async function syncContactToFreshdesk(contact: {
  email: string;
  name?: string;
  phone?: string;
  company_name?: string;
}): Promise<void> {
  const config = await getConfig();
  if (!config) return;

  try {
    // Check if contact exists
    const searchRes = await fetch(
      `${getBaseUrl(config)}/contacts?email=${encodeURIComponent(contact.email)}`,
      { headers: getHeaders(config) }
    );
    const existing = await searchRes.json();

    if (existing && existing.length > 0) {
      // Update existing contact
      await fetch(`${getBaseUrl(config)}/contacts/${existing[0].id}`, {
        method: 'PUT',
        headers: getHeaders(config),
        body: JSON.stringify({
          name: contact.name,
          phone: contact.phone,
        }),
      });
    } else {
      // Create new contact
      await fetch(`${getBaseUrl(config)}/contacts`, {
        method: 'POST',
        headers: getHeaders(config),
        body: JSON.stringify({
          email: contact.email,
          name: contact.name || contact.email,
          phone: contact.phone,
        }),
      });
    }
  } catch (err) {
    debugLog('Freshdesk contact sync error (non-fatal):', err);
  }
}

// ============================================
// TEMPLATE RENDERING
// ============================================

export function renderTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  }
  return result;
}
