import type { Actions, PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';

const DEMO_USER_ID = 'demo-user';

/**
 * Load the current settings for display on the settings page. If no settings
 * exist yet, create a default row so the form has values to populate.
 */
export const load: PageServerLoad = async () => {
  let settings = await prisma.setting.findUnique({ where: { userId: DEMO_USER_ID } });
  if (!settings) {
    settings = await prisma.setting.create({
      data: { userId: DEMO_USER_ID, monthlyDepositCents: 0, overspendPrevention: false }
    });
  }
  return { settings };
};

/**
 * Persist updated settings posted from the settings form.
 */
export const actions: Actions = {
  update: async ({ request }) => {
    const formData = await request.formData();
    const deposit = formData.get('monthlyDeposit');
    const overspend = formData.get('overspend') === 'on';

    if (!deposit || typeof deposit !== 'string') {
      return { success: false, message: 'Deposit is required' };
    }
    const depositNum = Number(deposit);
    if (isNaN(depositNum) || depositNum < 0) {
      return { success: false, message: 'Deposit must be a non-negative number' };
    }

    await prisma.setting.upsert({
      where: { userId: DEMO_USER_ID },
      update: {
        monthlyDepositCents: Math.round(depositNum * 100),
        overspendPrevention: overspend
      },
      create: {
        userId: DEMO_USER_ID,
        monthlyDepositCents: Math.round(depositNum * 100),
        overspendPrevention: overspend
      }
    });

    return { success: true };
  }
};
