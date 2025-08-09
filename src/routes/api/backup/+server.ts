import { json, type RequestHandler } from '@sveltejs/kit';
import { exportBackup, importBackup } from '$lib/server/backup';

const DEMO_USER_ID = 'demo-user';

/**
 * GET /api/backup
 *
 * Returns a JSON object containing all of the demo user's core data so it can be
 * downloaded and stored as an offline backup. The response includes a
 * Content-Disposition header so browsers will offer it as a file download.
 */
export const GET: RequestHandler = async () => {
  const data = await exportBackup(DEMO_USER_ID);
  return json(data, {
    headers: {
      'Content-Disposition': 'attachment; filename="backup.json"'
    }
  });
};

/**
 * POST /api/backup
 *
 * Accepts a JSON payload produced by the GET endpoint and replaces the demo
 * user's existing data with it. This allows quick restoration of a previous
 * backup or migration to a new device.
 */
export const POST: RequestHandler = async ({ request }) => {
  const payload = await request.json();
  await importBackup(DEMO_USER_ID, payload);
  return json({ success: true });
};
