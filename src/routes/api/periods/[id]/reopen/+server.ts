import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { reopenPeriod } from '$lib/server/periods';

const DEMO_USER_ID = 'demo-user';

/**
 * Reopen a closed period for the demo user. The request body may include a
 * `reason` field describing why the period was reopened.
 */
export const POST: RequestHandler = async ({ params, request }) => {
  let reason = '';
  try {
    const data = await request.json();
    if (typeof data.reason === 'string') {
      reason = data.reason;
    }
  } catch {
    // ignore JSON parse errors and default to empty reason
  }
  try {
    const period = await reopenPeriod(DEMO_USER_ID, params.id, reason);
    return json(period);
  } catch (e) {
    throw error(404, 'period not found');
  }
};
