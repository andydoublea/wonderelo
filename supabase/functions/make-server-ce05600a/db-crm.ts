/**
 * CRM Database Operations
 * All CRM table queries and mutations
 */

import { getGlobalSupabaseClient } from './global-supabase.tsx';

function getSupabase() {
  return getGlobalSupabaseClient();
}

// ============================================
// CONTACTS
// ============================================

export async function listContacts(filters: {
  search?: string;
  type?: string;
  tags?: string[];
  lead_stage?: string;
  company_id?: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_dir?: string;
}) {
  let query = getSupabase()
    .from('crm_contacts')
    .select('*, crm_companies(id, name)', { count: 'exact' });

  if (filters.search) {
    query = query.or(
      `email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
    );
  }
  if (filters.type) {
    query = query.contains('contact_types', [filters.type]);
  }
  if (filters.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }
  if (filters.lead_stage) {
    query = query.eq('lead_stage', filters.lead_stage);
  }
  if (filters.company_id) {
    query = query.eq('company_id', filters.company_id);
  }

  const sortBy = filters.sort_by || 'created_at';
  const sortDir = filters.sort_dir === 'asc';
  query = query.order(sortBy, { ascending: sortDir });

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
}

export async function getContact(id: string) {
  const { data, error } = await getSupabase()
    .from('crm_contacts')
    .select('*, crm_companies(id, name, website, size)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getContactByEmail(email: string) {
  const { data, error } = await getSupabase()
    .from('crm_contacts')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createContact(contact: Record<string, any>) {
  const { data, error } = await getSupabase()
    .from('crm_contacts')
    .insert(contact)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateContact(id: string, updates: Record<string, any>) {
  const { data, error } = await getSupabase()
    .from('crm_contacts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteContact(id: string) {
  const { error } = await getSupabase()
    .from('crm_contacts')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function upsertContact(email: string, data: Record<string, any>) {
  // Try to find existing contact
  const existing = await getContactByEmail(email);
  if (existing) {
    // Merge contact_types
    if (data.contact_types) {
      const merged = [...new Set([...(existing.contact_types || []), ...data.contact_types])];
      data.contact_types = merged;
    }
    return updateContact(existing.id, data);
  }
  return createContact({ email, ...data });
}

export async function mergeContacts(sourceId: string, targetId: string) {
  const source = await getContact(sourceId);
  const target = await getContact(targetId);
  if (!source || !target) throw new Error('Contact not found');

  // Merge types
  const mergedTypes = [...new Set([...(target.contact_types || []), ...(source.contact_types || [])])];
  const mergedTags = [...new Set([...(target.tags || []), ...(source.tags || [])])];

  // Update target with merged data
  await updateContact(targetId, {
    contact_types: mergedTypes,
    tags: mergedTags,
    first_name: target.first_name || source.first_name,
    last_name: target.last_name || source.last_name,
    phone: target.phone || source.phone,
    company_id: target.company_id || source.company_id,
    organizer_id: target.organizer_id || source.organizer_id,
    participant_id: target.participant_id || source.participant_id,
    lead_source: target.lead_source || source.lead_source,
    discovery_source: target.discovery_source || source.discovery_source,
    event_type: target.event_type || source.event_type,
    company_size: target.company_size || source.company_size,
    linkedin_url: target.linkedin_url || source.linkedin_url,
  });

  // Move activities from source to target
  await getSupabase()
    .from('crm_activities')
    .update({ contact_id: targetId })
    .eq('contact_id', sourceId);

  // Move tasks from source to target
  await getSupabase()
    .from('crm_tasks')
    .update({ contact_id: targetId })
    .eq('contact_id', sourceId);

  // Move website visits from source to target
  await getSupabase()
    .from('crm_website_visits')
    .update({ contact_id: targetId })
    .eq('contact_id', sourceId);

  // Delete source
  await deleteContact(sourceId);
  return getContact(targetId);
}

export async function bulkUpdateContacts(ids: string[], updates: Record<string, any>) {
  const { data, error } = await getSupabase()
    .from('crm_contacts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .in('id', ids)
    .select();
  if (error) throw error;
  return data;
}

// ============================================
// COMPANIES
// ============================================

export async function listCompanies(filters: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  let query = getSupabase()
    .from('crm_companies')
    .select('*', { count: 'exact' });

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,website.ilike.%${filters.search}%`
    );
  }

  query = query.order('created_at', { ascending: false });

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
}

export async function getCompany(id: string) {
  const { data, error } = await getSupabase()
    .from('crm_companies')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getCompanyContacts(companyId: string) {
  const { data, error } = await getSupabase()
    .from('crm_contacts')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createCompany(company: Record<string, any>) {
  const { data, error } = await getSupabase()
    .from('crm_companies')
    .insert(company)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCompany(id: string, updates: Record<string, any>) {
  const { data, error } = await getSupabase()
    .from('crm_companies')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCompany(id: string) {
  const { error } = await getSupabase()
    .from('crm_companies')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============================================
// ACTIVITIES
// ============================================

export async function listActivities(filters: {
  contact_id?: string;
  company_id?: string;
  type?: string;
  limit?: number;
  offset?: number;
}) {
  let query = getSupabase()
    .from('crm_activities')
    .select('*, crm_contacts(id, email, first_name, last_name)', { count: 'exact' });

  if (filters.contact_id) {
    query = query.eq('contact_id', filters.contact_id);
  }
  if (filters.company_id) {
    query = query.eq('company_id', filters.company_id);
  }
  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  query = query.order('created_at', { ascending: false });

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
}

export async function createActivity(activity: {
  contact_id?: string;
  company_id?: string;
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  created_by?: string;
}) {
  const { data, error } = await getSupabase()
    .from('crm_activities')
    .insert(activity)
    .select()
    .single();
  if (error) throw error;

  // Update contact's last_activity_at
  if (activity.contact_id) {
    await getSupabase()
      .from('crm_contacts')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', activity.contact_id);
  }

  return data;
}

// ============================================
// TASKS
// ============================================

export async function listTasks(filters: {
  contact_id?: string;
  company_id?: string;
  status?: string; // 'open' | 'completed' | 'overdue'
  limit?: number;
  offset?: number;
}) {
  let query = getSupabase()
    .from('crm_tasks')
    .select('*, crm_contacts(id, email, first_name, last_name)', { count: 'exact' });

  if (filters.contact_id) {
    query = query.eq('contact_id', filters.contact_id);
  }
  if (filters.company_id) {
    query = query.eq('company_id', filters.company_id);
  }
  if (filters.status === 'open') {
    query = query.is('completed_at', null);
  } else if (filters.status === 'completed') {
    query = query.not('completed_at', 'is', null);
  } else if (filters.status === 'overdue') {
    query = query.is('completed_at', null).lt('due_date', new Date().toISOString());
  }

  query = query.order('due_date', { ascending: true, nullsFirst: false });

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
}

export async function createTask(task: Record<string, any>) {
  const { data, error } = await getSupabase()
    .from('crm_tasks')
    .insert(task)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(id: string, updates: Record<string, any>) {
  const { data, error } = await getSupabase()
    .from('crm_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id: string) {
  const { error } = await getSupabase()
    .from('crm_tasks')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function completeTask(id: string) {
  return updateTask(id, { completed_at: new Date().toISOString() });
}

// ============================================
// PIPELINE
// ============================================

export async function getPipelineStages() {
  const { data, error } = await getSupabase()
    .from('crm_pipeline_stages')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getPipelineView() {
  const stages = await getPipelineStages();
  const { data: contacts, error } = await getSupabase()
    .from('crm_contacts')
    .select('*')
    .not('lead_stage', 'is', null)
    .order('updated_at', { ascending: false });
  if (error) throw error;

  // Group contacts by stage
  const pipeline = stages.map(stage => ({
    ...stage,
    contacts: (contacts || []).filter(c => c.lead_stage === stage.name),
  }));
  return pipeline;
}

export async function moveContactToStage(contactId: string, stage: string) {
  const contact = await updateContact(contactId, { lead_stage: stage });
  await createActivity({
    contact_id: contactId,
    type: 'system',
    title: `Moved to ${stage}`,
    description: `Lead stage changed to ${stage}`,
    created_by: 'admin',
  });
  return contact;
}

export async function upsertPipelineStages(stages: Array<Record<string, any>>) {
  // Delete all existing and re-insert
  await getSupabase().from('crm_pipeline_stages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { data, error } = await getSupabase()
    .from('crm_pipeline_stages')
    .insert(stages)
    .select();
  if (error) throw error;
  return data;
}

// ============================================
// WEBSITE VISITS
// ============================================

export async function trackVisit(visit: {
  visitor_id: string;
  contact_id?: string;
  page_url: string;
  page_title?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  duration_seconds?: number;
  session_id?: string;
}) {
  const { data, error } = await getSupabase()
    .from('crm_website_visits')
    .insert(visit)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listVisitors(filters: { limit?: number; offset?: number }) {
  // Aggregate visitors with their visit counts and last visit
  const { data, error } = await getSupabase()
    .rpc('crm_list_visitors', {
      p_limit: filters.limit || 50,
      p_offset: filters.offset || 0,
    });

  // Fallback if RPC doesn't exist: basic query
  if (error) {
    const { data: visits, error: fallbackError } = await getSupabase()
      .from('crm_website_visits')
      .select('visitor_id, contact_id, page_url, created_at')
      .order('created_at', { ascending: false })
      .limit(filters.limit || 50);
    if (fallbackError) throw fallbackError;
    return visits;
  }
  return data;
}

export async function getVisitorJourney(visitorId: string) {
  const { data, error } = await getSupabase()
    .from('crm_website_visits')
    .select('*')
    .eq('visitor_id', visitorId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function linkVisitorToContact(visitorId: string, contactId: string) {
  const { error } = await getSupabase()
    .from('crm_website_visits')
    .update({ contact_id: contactId })
    .eq('visitor_id', visitorId);
  if (error) throw error;
}

// ============================================
// EMAIL TEMPLATES
// ============================================

export async function listEmailTemplates() {
  const { data, error } = await getSupabase()
    .from('crm_email_templates')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getEmailTemplate(id: string) {
  const { data, error } = await getSupabase()
    .from('crm_email_templates')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createEmailTemplate(template: Record<string, any>) {
  const { data, error } = await getSupabase()
    .from('crm_email_templates')
    .insert(template)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEmailTemplate(id: string, updates: Record<string, any>) {
  const { data, error } = await getSupabase()
    .from('crm_email_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEmailTemplate(id: string) {
  const { error } = await getSupabase()
    .from('crm_email_templates')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============================================
// SEGMENTS
// ============================================

export async function listSegments() {
  const { data, error } = await getSupabase()
    .from('crm_segments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getSegment(id: string) {
  const { data, error } = await getSupabase()
    .from('crm_segments')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getSegmentContacts(segment: Record<string, any>) {
  if (segment.type === 'static') {
    if (!segment.contact_ids?.length) return [];
    const { data, error } = await getSupabase()
      .from('crm_contacts')
      .select('*')
      .in('id', segment.contact_ids);
    if (error) throw error;
    return data;
  }

  // Dynamic segment: apply filters
  let query = getSupabase().from('crm_contacts').select('*');
  const f = segment.filters || {};

  if (f.contact_type) {
    query = query.contains('contact_types', [f.contact_type]);
  }
  if (f.tags?.length) {
    query = query.contains('tags', f.tags);
  }
  if (f.lead_stage) {
    query = query.eq('lead_stage', f.lead_stage);
  }
  if (f.company_size) {
    query = query.eq('company_size', f.company_size);
  }
  if (f.event_type) {
    query = query.eq('event_type', f.event_type);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createSegment(segment: Record<string, any>) {
  const { data, error } = await getSupabase()
    .from('crm_segments')
    .insert(segment)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSegment(id: string, updates: Record<string, any>) {
  const { data, error } = await getSupabase()
    .from('crm_segments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSegment(id: string) {
  const { error } = await getSupabase()
    .from('crm_segments')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============================================
// TAGS
// ============================================

export async function listTags() {
  const { data, error } = await getSupabase()
    .from('crm_tags')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createTag(tag: { name: string; color?: string }) {
  const { data, error } = await getSupabase()
    .from('crm_tags')
    .insert(tag)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTag(id: string) {
  const { error } = await getSupabase()
    .from('crm_tags')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============================================
// DASHBOARD STATS
// ============================================

export async function getDashboardStats() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Total contacts
  const { count: totalContacts } = await getSupabase()
    .from('crm_contacts')
    .select('*', { count: 'exact', head: true });

  // New this week
  const { count: newThisWeek } = await getSupabase()
    .from('crm_contacts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo.toISOString());

  // New this month
  const { count: newThisMonth } = await getSupabase()
    .from('crm_contacts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', monthAgo.toISOString());

  // Leads by stage
  const { data: leadsByStage } = await getSupabase()
    .from('crm_contacts')
    .select('lead_stage')
    .not('lead_stage', 'is', null);

  const stageCounts: Record<string, number> = {};
  (leadsByStage || []).forEach((c: any) => {
    stageCounts[c.lead_stage] = (stageCounts[c.lead_stage] || 0) + 1;
  });

  // Active subscriptions (MRR approximation)
  const { data: activeSubs } = await getSupabase()
    .from('subscriptions')
    .select('capacity_tier, plan')
    .eq('status', 'active');

  // Overdue tasks
  const { count: overdueTasks } = await getSupabase()
    .from('crm_tasks')
    .select('*', { count: 'exact', head: true })
    .is('completed_at', null)
    .lt('due_date', now.toISOString());

  // Recent activities
  const { data: recentActivities } = await getSupabase()
    .from('crm_activities')
    .select('*, crm_contacts(id, email, first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(20);

  return {
    totalContacts: totalContacts || 0,
    newThisWeek: newThisWeek || 0,
    newThisMonth: newThisMonth || 0,
    leadsByStage: stageCounts,
    activeSubscriptions: (activeSubs || []).length,
    overdueTasks: overdueTasks || 0,
    recentActivities: recentActivities || [],
  };
}

// ============================================
// REPORTS
// ============================================

export async function getRevenueReport() {
  const { data: subs } = await getSupabase()
    .from('subscriptions')
    .select('*')
    .eq('status', 'active');

  const { data: transactions } = await getSupabase()
    .from('credit_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  return { subscriptions: subs || [], transactions: transactions || [] };
}

export async function getLeadReport() {
  const { data: contacts } = await getSupabase()
    .from('crm_contacts')
    .select('lead_stage, lead_source, contact_types, created_at')
    .not('lead_stage', 'is', null);

  return contacts || [];
}

export async function getActivityReport() {
  const { data } = await getSupabase()
    .from('crm_activities')
    .select('type, created_at')
    .order('created_at', { ascending: false })
    .limit(1000);

  return data || [];
}

export async function getSourceReport() {
  const { data } = await getSupabase()
    .from('crm_contacts')
    .select('lead_source, lead_stage, contact_types, created_at')
    .not('lead_source', 'is', null);

  return data || [];
}
