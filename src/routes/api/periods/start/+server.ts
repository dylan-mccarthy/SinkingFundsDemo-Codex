import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { startPeriod } from '$lib/server/periods';

const DEMO_USER_ID = 'demo-user';

/**
 * Trigger the start-of-month workflow for the demo user.
 * Returns the created period and allocation breakdown.
 */
export const POST: RequestHandler = async () => {
  const result = await startPeriod(DEMO_USER_ID);
  return json(result, { status: 201 });
};
