import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { closePeriod } from '$lib/server/periods';

const DEMO_USER_ID = 'demo-user';

/**
 * Mark an open period as closed for the demo user.
 */
export const POST: RequestHandler = async ({ params }) => {
  try {
    const period = await closePeriod(DEMO_USER_ID, params.id);
    return json(period);
  } catch (e) {
    throw error(404, 'period not found');
  }
};
