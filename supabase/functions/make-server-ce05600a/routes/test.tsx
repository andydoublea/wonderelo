/**
 * Test Routes
 * Health check and deployment test endpoints
 */

import { Hono } from 'npm:hono';

export function registerTestRoutes(app: Hono) {
  // Health check endpoint
  app.get('/make-server-ce05600a/test', async (c) => {
    return c.json({ 
      message: 'Backend is working!', 
      timestamp: new Date().toISOString(),
      version: '6.32.1-modular-refactor',
      resendDomain: 'delivered@resend.dev'
    });
  });

  // Deployment test endpoint
  app.get('/make-server-ce05600a/deployment-test', async (c) => {
    return c.json({ 
      message: 'Deployment test successful',
      timestamp: new Date().toISOString(),
      version: '6.32.1-modular-refactor'
    });
  });
}
