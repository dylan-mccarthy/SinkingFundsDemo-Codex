import type { Actions, PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';
import { startPeriod, closePeriod, reopenPeriod } from '$lib/server/periods';

const DEMO_USER_ID = 'demo-user';
const DEMO_DEPOSIT_CENTS = 100_000;

/**
 * Load existing periods so the UI can display history and status.
 */
export const load: PageServerLoad = async () => {
  const periods = await prisma.period.findMany({
    where: { userId: DEMO_USER_ID },
    orderBy: [{ year: 'desc' }, { month: 'desc' }]
  });
  return { periods };
};

/**
 * Form action to kick off the start-of-month process.
 */
export const actions: Actions = {
  start: async () => {
    await startPeriod(DEMO_USER_ID, DEMO_DEPOSIT_CENTS);
    return { success: true };
  },
  close: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id');
    if (typeof id !== 'string') {
      return { success: false };
    }
    await closePeriod(DEMO_USER_ID, id);
    return { success: true };
  },
  reopen: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id');
    const reason = form.get('reason');
    if (typeof id !== 'string') {
      return { success: false };
    }
    await reopenPeriod(DEMO_USER_ID, id, typeof reason === 'string' ? reason : '');
    return { success: true };
  }
};
