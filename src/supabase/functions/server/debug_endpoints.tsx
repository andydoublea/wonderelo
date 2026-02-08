/**
 * Debug endpoints for server logs viewing
 */
import type { Context } from 'npm:hono';
import { getRecentLogs, clearLogs } from './debug.tsx';
import { errorLog } from './debug.tsx';

// GET recent server logs
export async function getServerLogs(c: Context) {
  try {
    const limit = parseInt(c.req.query('limit') || '100', 10);
    const logs = getRecentLogs(limit);
    
    return c.json({
      success: true,
      logs,
      count: logs.length
    });
  } catch (error) {
    errorLog('Get server logs error:', error);
    return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
}

// POST clear server logs
export async function clearServerLogs(c: Context) {
  try {
    clearLogs();
    
    return c.json({
      success: true,
      message: 'Server logs cleared'
    });
  } catch (error) {
    errorLog('Clear logs error:', error);
    return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
}
