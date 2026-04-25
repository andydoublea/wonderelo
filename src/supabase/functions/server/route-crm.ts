/**
 * CRM Routes
 * All CRM API endpoints
 */

import { Hono } from 'npm:hono';
import * as crmDb from './db-crm.ts';
import * as freshdesk from './freshdesk.ts';
import { errorLog, debugLog } from './debug.tsx';
import { requireAdmin } from './auth-helpers.tsx';

const PREFIX = '/make-server-ce05600a';

/**
 * Cap the IDs accepted by bulk-update endpoints. Frontend pages 50-ish at a
 * time; 500 is generous headroom but stops a malicious caller from running
 * a 100k-id UPDATE against the table.
 */
const CRM_BULK_LIMIT = 500;

export function registerCrmRoutes(app: Hono) {
  // CRM is admin-only by frontend design (AdminRoute wrapper) and now enforced
  // server-side too. Pre-fix, every /crm/* endpoint was wide-open with the
  // public anon key — anyone could list every organizer's contacts. The
  // crm_contacts table has an organizer_id column but listContacts() ignored
  // it. Locking down to admins (the only role that legitimately sees the
  // global CRM view) closes the leak without needing per-row tenant filters.
  app.use(`${PREFIX}/crm/*`, requireAdmin);

  // ============================================
  // DASHBOARD
  // ============================================

  app.get(`${PREFIX}/crm/dashboard/stats`, async (c) => {
    try {
      const stats = await crmDb.getDashboardStats();
      return c.json(stats);
    } catch (error) {
      errorLog('CRM dashboard stats error:', error);
      return c.json({ error: 'Failed to fetch dashboard stats' }, 500);
    }
  });

  // ============================================
  // CONTACTS
  // ============================================

  app.get(`${PREFIX}/crm/contacts`, async (c) => {
    try {
      const { search, type, lead_stage, company_id, limit, offset, sort_by, sort_dir } = c.req.query();
      const tags = c.req.query('tags') ? c.req.query('tags')!.split(',') : undefined;
      const result = await crmDb.listContacts({
        search, type, tags, lead_stage, company_id,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
        sort_by, sort_dir,
      });
      return c.json(result);
    } catch (error) {
      errorLog('CRM list contacts error:', error);
      return c.json({ error: 'Failed to list contacts' }, 500);
    }
  });

  app.post(`${PREFIX}/crm/contacts`, async (c) => {
    try {
      const body = await c.req.json();
      const contact = await crmDb.createContact(body);
      // Log activity
      await crmDb.createActivity({
        contact_id: contact.id,
        type: 'system',
        title: 'Contact created',
        created_by: 'admin',
      });
      // Sync to Freshdesk (best-effort; don't block contact creation if it fails)
      freshdesk.syncContactToFreshdesk({
        email: contact.email,
        name: [contact.first_name, contact.last_name].filter(Boolean).join(' '),
        phone: contact.phone,
      }).catch(err => errorLog('Freshdesk sync failed for contact', contact.email, err));
      return c.json(contact, 201);
    } catch (error) {
      errorLog('CRM create contact error:', error);
      return c.json({ error: 'Failed to create contact' }, 500);
    }
  });

  app.get(`${PREFIX}/crm/contacts/:id`, async (c) => {
    try {
      const id = c.req.param('id');
      const contact = await crmDb.getContact(id);
      // Get related data
      const [activities, tasks] = await Promise.all([
        crmDb.listActivities({ contact_id: id, limit: 50 }),
        crmDb.listTasks({ contact_id: id }),
      ]);
      return c.json({ ...contact, activities: activities.data, tasks: tasks.data });
    } catch (error) {
      errorLog('CRM get contact error:', error);
      return c.json({ error: 'Failed to get contact' }, 500);
    }
  });

  app.put(`${PREFIX}/crm/contacts/:id`, async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const contact = await crmDb.updateContact(id, body);
      return c.json(contact);
    } catch (error) {
      errorLog('CRM update contact error:', error);
      return c.json({ error: 'Failed to update contact' }, 500);
    }
  });

  app.delete(`${PREFIX}/crm/contacts/:id`, async (c) => {
    try {
      const id = c.req.param('id');
      await crmDb.deleteContact(id);
      return c.json({ success: true });
    } catch (error) {
      errorLog('CRM delete contact error:', error);
      return c.json({ error: 'Failed to delete contact' }, 500);
    }
  });

  app.post(`${PREFIX}/crm/contacts/merge`, async (c) => {
    try {
      const { sourceId, targetId } = await c.req.json();
      const merged = await crmDb.mergeContacts(sourceId, targetId);
      return c.json(merged);
    } catch (error) {
      errorLog('CRM merge contacts error:', error);
      return c.json({ error: 'Failed to merge contacts' }, 500);
    }
  });

  app.post(`${PREFIX}/crm/contacts/bulk`, async (c) => {
    try {
      const { ids, updates } = await c.req.json();
      if (!Array.isArray(ids)) return c.json({ error: 'ids must be an array' }, 400);
      if (ids.length === 0) return c.json({ error: 'ids cannot be empty' }, 400);
      if (ids.length > CRM_BULK_LIMIT) {
        return c.json({ error: `bulk update capped at ${CRM_BULK_LIMIT} ids per request` }, 413);
      }
      const result = await crmDb.bulkUpdateContacts(ids, updates);
      return c.json(result);
    } catch (error) {
      errorLog('CRM bulk update error:', error);
      return c.json({ error: 'Failed to bulk update' }, 500);
    }
  });

  // ============================================
  // COMPANIES
  // ============================================

  app.get(`${PREFIX}/crm/companies`, async (c) => {
    try {
      const { search, limit, offset } = c.req.query();
      const result = await crmDb.listCompanies({
        search,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });
      return c.json(result);
    } catch (error) {
      errorLog('CRM list companies error:', error);
      return c.json({ error: 'Failed to list companies' }, 500);
    }
  });

  app.post(`${PREFIX}/crm/companies`, async (c) => {
    try {
      const body = await c.req.json();
      const company = await crmDb.createCompany(body);
      return c.json(company, 201);
    } catch (error) {
      errorLog('CRM create company error:', error);
      return c.json({ error: 'Failed to create company' }, 500);
    }
  });

  app.get(`${PREFIX}/crm/companies/:id`, async (c) => {
    try {
      const id = c.req.param('id');
      const [company, contacts] = await Promise.all([
        crmDb.getCompany(id),
        crmDb.getCompanyContacts(id),
      ]);
      const activities = await crmDb.listActivities({ company_id: id, limit: 50 });
      return c.json({ ...company, contacts, activities: activities.data });
    } catch (error) {
      errorLog('CRM get company error:', error);
      return c.json({ error: 'Failed to get company' }, 500);
    }
  });

  app.put(`${PREFIX}/crm/companies/:id`, async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const company = await crmDb.updateCompany(id, body);
      return c.json(company);
    } catch (error) {
      errorLog('CRM update company error:', error);
      return c.json({ error: 'Failed to update company' }, 500);
    }
  });

  app.delete(`${PREFIX}/crm/companies/:id`, async (c) => {
    try {
      const id = c.req.param('id');
      await crmDb.deleteCompany(id);
      return c.json({ success: true });
    } catch (error) {
      errorLog('CRM delete company error:', error);
      return c.json({ error: 'Failed to delete company' }, 500);
    }
  });

  // ============================================
  // PIPELINE
  // ============================================

  app.get(`${PREFIX}/crm/pipeline`, async (c) => {
    try {
      const pipeline = await crmDb.getPipelineView();
      return c.json(pipeline);
    } catch (error) {
      errorLog('CRM pipeline error:', error);
      return c.json({ error: 'Failed to get pipeline' }, 500);
    }
  });

  app.put(`${PREFIX}/crm/pipeline/move`, async (c) => {
    try {
      const { contactId, stage } = await c.req.json();
      const contact = await crmDb.moveContactToStage(contactId, stage);
      return c.json(contact);
    } catch (error) {
      errorLog('CRM move stage error:', error);
      return c.json({ error: 'Failed to move contact' }, 500);
    }
  });

  app.get(`${PREFIX}/crm/pipeline/stages`, async (c) => {
    try {
      const stages = await crmDb.getPipelineStages();
      return c.json(stages);
    } catch (error) {
      errorLog('CRM get stages error:', error);
      return c.json({ error: 'Failed to get stages' }, 500);
    }
  });

  app.post(`${PREFIX}/crm/pipeline/stages`, async (c) => {
    try {
      const { stages } = await c.req.json();
      const result = await crmDb.upsertPipelineStages(stages);
      return c.json(result);
    } catch (error) {
      errorLog('CRM upsert stages error:', error);
      return c.json({ error: 'Failed to update stages' }, 500);
    }
  });

  // ============================================
  // ACTIVITIES
  // ============================================

  app.get(`${PREFIX}/crm/activities`, async (c) => {
    try {
      const { contact_id, company_id, type, limit, offset } = c.req.query();
      const result = await crmDb.listActivities({
        contact_id, company_id, type,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });
      return c.json(result);
    } catch (error) {
      errorLog('CRM list activities error:', error);
      return c.json({ error: 'Failed to list activities' }, 500);
    }
  });

  app.post(`${PREFIX}/crm/activities`, async (c) => {
    try {
      const body = await c.req.json();
      const activity = await crmDb.createActivity({
        ...body,
        created_by: body.created_by || 'admin',
      });
      return c.json(activity, 201);
    } catch (error) {
      errorLog('CRM create activity error:', error);
      return c.json({ error: 'Failed to create activity' }, 500);
    }
  });

  // ============================================
  // TASKS
  // ============================================

  app.get(`${PREFIX}/crm/tasks`, async (c) => {
    try {
      const { contact_id, company_id, status, limit, offset } = c.req.query();
      const result = await crmDb.listTasks({
        contact_id, company_id, status,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });
      return c.json(result);
    } catch (error) {
      errorLog('CRM list tasks error:', error);
      return c.json({ error: 'Failed to list tasks' }, 500);
    }
  });

  app.post(`${PREFIX}/crm/tasks`, async (c) => {
    try {
      const body = await c.req.json();
      const task = await crmDb.createTask(body);
      // Log activity
      if (body.contact_id) {
        await crmDb.createActivity({
          contact_id: body.contact_id,
          type: 'task',
          title: `Task created: ${body.title}`,
          created_by: 'admin',
        });
      }
      return c.json(task, 201);
    } catch (error) {
      errorLog('CRM create task error:', error);
      return c.json({ error: 'Failed to create task' }, 500);
    }
  });

  app.put(`${PREFIX}/crm/tasks/:id`, async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const task = await crmDb.updateTask(id, body);
      return c.json(task);
    } catch (error) {
      errorLog('CRM update task error:', error);
      return c.json({ error: 'Failed to update task' }, 500);
    }
  });

  app.delete(`${PREFIX}/crm/tasks/:id`, async (c) => {
    try {
      const id = c.req.param('id');
      await crmDb.deleteTask(id);
      return c.json({ success: true });
    } catch (error) {
      errorLog('CRM delete task error:', error);
      return c.json({ error: 'Failed to delete task' }, 500);
    }
  });

  app.post(`${PREFIX}/crm/tasks/:id/complete`, async (c) => {
    try {
      const id = c.req.param('id');
      const task = await crmDb.completeTask(id);
      if (task.contact_id) {
        await crmDb.createActivity({
          contact_id: task.contact_id,
          type: 'task',
          title: `Task completed: ${task.title}`,
          created_by: 'admin',
        });
      }
      return c.json(task);
    } catch (error) {
      errorLog('CRM complete task error:', error);
      return c.json({ error: 'Failed to complete task' }, 500);
    }
  });

  // ============================================
  // EMAIL (FRESHDESK)
  // ============================================

  app.post(`${PREFIX}/crm/email/send`, async (c) => {
    try {
      const { contactId, subject, body, templateId } = await c.req.json();
      const contact = await crmDb.getContact(contactId);
      if (!contact) return c.json({ error: 'Contact not found' }, 404);

      let finalSubject = subject;
      let finalBody = body;

      // Apply template if specified
      if (templateId) {
        const template = await crmDb.getEmailTemplate(templateId);
        if (template) {
          const vars: Record<string, string> = {
            first_name: contact.first_name || '',
            last_name: contact.last_name || '',
            email: contact.email,
            company_name: contact.crm_companies?.name || '',
          };
          finalSubject = finalSubject || freshdesk.renderTemplate(template.subject || '', vars);
          finalBody = finalBody || freshdesk.renderTemplate(template.body || '', vars);
        }
      }

      const result = await freshdesk.sendEmail({
        to: contact.email,
        subject: finalSubject,
        body: finalBody,
        contactName: [contact.first_name, contact.last_name].filter(Boolean).join(' '),
      });

      if (result.success) {
        await crmDb.createActivity({
          contact_id: contactId,
          type: 'email_sent',
          title: `Email sent: ${finalSubject}`,
          description: finalBody?.substring(0, 500),
          metadata: { freshdesk_ticket_id: result.ticketId },
          created_by: 'admin',
        });
      }

      return c.json(result);
    } catch (error) {
      errorLog('CRM send email error:', error);
      return c.json({ error: 'Failed to send email' }, 500);
    }
  });

  app.get(`${PREFIX}/crm/email/threads/:contactId`, async (c) => {
    try {
      const contactId = c.req.param('contactId');
      const contact = await crmDb.getContact(contactId);
      if (!contact) return c.json({ error: 'Contact not found' }, 404);

      const tickets = await freshdesk.getTicketsByEmail(contact.email);
      // Get conversations for each ticket
      const threads = await Promise.all(
        tickets.slice(0, 10).map(async (ticket: any) => ({
          ...ticket,
          conversations: await freshdesk.getTicketConversations(ticket.id),
        }))
      );
      return c.json(threads);
    } catch (error) {
      errorLog('CRM get email threads error:', error);
      return c.json({ error: 'Failed to get email threads' }, 500);
    }
  });

  app.post(`${PREFIX}/crm/email/sync/:contactId`, async (c) => {
    try {
      const contactId = c.req.param('contactId');
      const contact = await crmDb.getContact(contactId);
      if (!contact) return c.json({ error: 'Contact not found' }, 404);

      const tickets = await freshdesk.getTicketsByEmail(contact.email);
      let synced = 0;
      for (const ticket of tickets) {
        await crmDb.createActivity({
          contact_id: contactId,
          type: ticket.type === 'Outbound Email' ? 'email_sent' : 'email_received',
          title: `Email: ${ticket.subject}`,
          description: ticket.description_text?.substring(0, 500),
          metadata: { freshdesk_ticket_id: ticket.id, freshdesk_status: ticket.status },
          created_by: 'freshdesk',
        });
        synced++;
      }
      return c.json({ synced });
    } catch (error) {
      errorLog('CRM sync email error:', error);
      return c.json({ error: 'Failed to sync emails' }, 500);
    }
  });

  app.post(`${PREFIX}/crm/email/bulk`, async (c) => {
    try {
      const { segmentId, subject, body, templateId } = await c.req.json();
      const segment = await crmDb.getSegment(segmentId);
      if (!segment) return c.json({ error: 'Segment not found' }, 404);

      const contacts = await crmDb.getSegmentContacts(segment);
      let sent = 0;
      let failed = 0;

      for (const contact of contacts) {
        let finalSubject = subject;
        let finalBody = body;

        if (templateId) {
          const template = await crmDb.getEmailTemplate(templateId);
          if (template) {
            const vars: Record<string, string> = {
              first_name: contact.first_name || '',
              last_name: contact.last_name || '',
              email: contact.email,
            };
            finalSubject = freshdesk.renderTemplate(template.subject || '', vars);
            finalBody = freshdesk.renderTemplate(template.body || '', vars);
          }
        }

        const result = await freshdesk.sendEmail({
          to: contact.email,
          subject: finalSubject,
          body: finalBody,
        });

        if (result.success) {
          sent++;
          await crmDb.createActivity({
            contact_id: contact.id,
            type: 'email_sent',
            title: `Bulk email: ${finalSubject}`,
            created_by: 'admin',
          });
        } else {
          failed++;
        }
      }

      return c.json({ sent, failed, total: contacts.length });
    } catch (error) {
      errorLog('CRM bulk email error:', error);
      return c.json({ error: 'Failed to send bulk email' }, 500);
    }
  });

  // Email templates
  app.get(`${PREFIX}/crm/email/templates`, async (c) => {
    try {
      const templates = await crmDb.listEmailTemplates();
      return c.json(templates);
    } catch (error) {
      errorLog('CRM list templates error:', error);
      return c.json({ error: 'Failed to list templates' }, 500);
    }
  });

  app.post(`${PREFIX}/crm/email/templates`, async (c) => {
    try {
      const body = await c.req.json();
      const template = await crmDb.createEmailTemplate(body);
      return c.json(template, 201);
    } catch (error) {
      errorLog('CRM create template error:', error);
      return c.json({ error: 'Failed to create template' }, 500);
    }
  });

  app.put(`${PREFIX}/crm/email/templates/:id`, async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const template = await crmDb.updateEmailTemplate(id, body);
      return c.json(template);
    } catch (error) {
      errorLog('CRM update template error:', error);
      return c.json({ error: 'Failed to update template' }, 500);
    }
  });

  app.delete(`${PREFIX}/crm/email/templates/:id`, async (c) => {
    try {
      const id = c.req.param('id');
      await crmDb.deleteEmailTemplate(id);
      return c.json({ success: true });
    } catch (error) {
      errorLog('CRM delete template error:', error);
      return c.json({ error: 'Failed to delete template' }, 500);
    }
  });

  // ============================================
  // WEBSITE VISITORS
  // ============================================

  app.post(`${PREFIX}/crm/track`, async (c) => {
    try {
      const body = await c.req.json();
      const visit = await crmDb.trackVisit(body);
      return c.json({ success: true, id: visit.id });
    } catch (error) {
      // Silent fail for tracking
      debugLog('CRM track error:', error);
      return c.json({ success: false });
    }
  });

  app.get(`${PREFIX}/crm/visitors`, async (c) => {
    try {
      const { limit, offset } = c.req.query();
      const visitors = await crmDb.listVisitors({
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });
      return c.json(visitors);
    } catch (error) {
      errorLog('CRM list visitors error:', error);
      return c.json({ error: 'Failed to list visitors' }, 500);
    }
  });

  app.get(`${PREFIX}/crm/visitors/:visitorId`, async (c) => {
    try {
      const visitorId = c.req.param('visitorId');
      const journey = await crmDb.getVisitorJourney(visitorId);
      return c.json(journey);
    } catch (error) {
      errorLog('CRM visitor journey error:', error);
      return c.json({ error: 'Failed to get visitor journey' }, 500);
    }
  });

  // ============================================
  // SEGMENTS
  // ============================================

  app.get(`${PREFIX}/crm/segments`, async (c) => {
    try {
      const segments = await crmDb.listSegments();
      return c.json(segments);
    } catch (error) {
      errorLog('CRM list segments error:', error);
      return c.json({ error: 'Failed to list segments' }, 500);
    }
  });

  app.post(`${PREFIX}/crm/segments`, async (c) => {
    try {
      const body = await c.req.json();
      const segment = await crmDb.createSegment(body);
      return c.json(segment, 201);
    } catch (error) {
      errorLog('CRM create segment error:', error);
      return c.json({ error: 'Failed to create segment' }, 500);
    }
  });

  app.get(`${PREFIX}/crm/segments/:id`, async (c) => {
    try {
      const id = c.req.param('id');
      const segment = await crmDb.getSegment(id);
      const contacts = await crmDb.getSegmentContacts(segment);
      return c.json({ ...segment, contacts });
    } catch (error) {
      errorLog('CRM get segment error:', error);
      return c.json({ error: 'Failed to get segment' }, 500);
    }
  });

  app.put(`${PREFIX}/crm/segments/:id`, async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const segment = await crmDb.updateSegment(id, body);
      return c.json(segment);
    } catch (error) {
      errorLog('CRM update segment error:', error);
      return c.json({ error: 'Failed to update segment' }, 500);
    }
  });

  app.delete(`${PREFIX}/crm/segments/:id`, async (c) => {
    try {
      const id = c.req.param('id');
      await crmDb.deleteSegment(id);
      return c.json({ success: true });
    } catch (error) {
      errorLog('CRM delete segment error:', error);
      return c.json({ error: 'Failed to delete segment' }, 500);
    }
  });

  // ============================================
  // REPORTS
  // ============================================

  app.get(`${PREFIX}/crm/reports/revenue`, async (c) => {
    try {
      const report = await crmDb.getRevenueReport();
      return c.json(report);
    } catch (error) {
      errorLog('CRM revenue report error:', error);
      return c.json({ error: 'Failed to get revenue report' }, 500);
    }
  });

  app.get(`${PREFIX}/crm/reports/leads`, async (c) => {
    try {
      const report = await crmDb.getLeadReport();
      return c.json(report);
    } catch (error) {
      errorLog('CRM lead report error:', error);
      return c.json({ error: 'Failed to get lead report' }, 500);
    }
  });

  app.get(`${PREFIX}/crm/reports/activity`, async (c) => {
    try {
      const report = await crmDb.getActivityReport();
      return c.json(report);
    } catch (error) {
      errorLog('CRM activity report error:', error);
      return c.json({ error: 'Failed to get activity report' }, 500);
    }
  });

  app.get(`${PREFIX}/crm/reports/sources`, async (c) => {
    try {
      const report = await crmDb.getSourceReport();
      return c.json(report);
    } catch (error) {
      errorLog('CRM source report error:', error);
      return c.json({ error: 'Failed to get source report' }, 500);
    }
  });

  // ============================================
  // SETTINGS
  // ============================================

  app.put(`${PREFIX}/crm/settings/freshdesk`, async (c) => {
    try {
      const body = await c.req.json();
      await freshdesk.saveConfig(body);
      return c.json({ success: true });
    } catch (error) {
      errorLog('CRM save freshdesk config error:', error);
      return c.json({ error: 'Failed to save config' }, 500);
    }
  });

  app.get(`${PREFIX}/crm/settings/freshdesk/status`, async (c) => {
    try {
      const status = await freshdesk.checkConnection();
      return c.json(status);
    } catch (error) {
      errorLog('CRM freshdesk status error:', error);
      return c.json({ connected: false, error: 'Check failed' });
    }
  });

  // Tags
  app.get(`${PREFIX}/crm/tags`, async (c) => {
    try {
      const tags = await crmDb.listTags();
      return c.json(tags);
    } catch (error) {
      errorLog('CRM list tags error:', error);
      return c.json({ error: 'Failed to list tags' }, 500);
    }
  });

  app.post(`${PREFIX}/crm/tags`, async (c) => {
    try {
      const body = await c.req.json();
      const tag = await crmDb.createTag(body);
      return c.json(tag, 201);
    } catch (error) {
      errorLog('CRM create tag error:', error);
      return c.json({ error: 'Failed to create tag' }, 500);
    }
  });

  app.delete(`${PREFIX}/crm/tags/:id`, async (c) => {
    try {
      const id = c.req.param('id');
      await crmDb.deleteTag(id);
      return c.json({ success: true });
    } catch (error) {
      errorLog('CRM delete tag error:', error);
      return c.json({ error: 'Failed to delete tag' }, 500);
    }
  });
}
