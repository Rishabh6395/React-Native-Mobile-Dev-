import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { auth } from './auth.js';

const app = new Hono();

app.use('*', logger());
app.use('*', cors({
  origin: '*', // Adjust for production
  credentials: true,
}));

// Mount Better Auth
app.all('/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

// Routes stub
const v1 = new Hono();

v1.post('/usage/sync', (c) => c.json({ success: true }));
v1.get('/usage/summary', (c) => c.json({}));

import { reportsRouter } from './routes/reports.js';

// ... other imports

v1.route('/reports', reportsRouter);

v1.get('/chat/threads', (c) => c.json([]));
v1.post('/chat/threads', (c) => c.json({ id: 'thread_1' }));
v1.get('/chat/threads/:id/messages', (c) => c.json([]));
v1.post('/chat/threads/:id/messages', (c) => c.text('streaming...', 200)); // SSE stream stub

v1.get('/content-log', (c) => c.json([]));
v1.post('/content-log', (c) => c.json({ success: true }));
v1.delete('/content-log/:id', (c) => c.json({ success: true }));

v1.get('/goals', (c) => c.json([]));
v1.post('/goals', (c) => c.json({ success: true }));

v1.post('/devices', (c) => c.json({ success: true }));

v1.get('/me', (c) => c.json({ id: 'user_1' }));
v1.delete('/me', (c) => c.json({ success: true }));
v1.get('/me/export', (c) => c.json({ data: 'exported' }));

v1.post('/webhooks/revenuecat', (c) => c.json({ success: true }));

app.route('/v1', v1);

app.get('/', (c) => c.text('API is running.'));

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
