import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

const DEMO_USER_ID = 'demo-user';

/**
 * List all accounting periods for the demo user ordered by most recent first.
 */
export const GET: RequestHandler = async () => {
  const periods = await prisma.period.findMany({
    where: { userId: DEMO_USER_ID },
    orderBy: [{ year: 'desc' }, { month: 'desc' }]
  });
  return json(periods);
};
