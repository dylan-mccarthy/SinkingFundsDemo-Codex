import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

const DEMO_USER_ID = 'demo-user';

/**
 * Retrieve or create the settings row for the demo user.
 * Settings are stored separately from authentication data so they can be
 * extended without impacting login flows in future iterations.
 */
export const GET: RequestHandler = async () => {
  let settings = await prisma.setting.findUnique({ where: { userId: DEMO_USER_ID } });
  if (!settings) {
    settings = await prisma.setting.create({
      data: { userId: DEMO_USER_ID, monthlyDepositCents: 0, overspendPrevention: false }
    });
  }
  return json(settings);
};

/**
 * Update settings for the demo user. The payload expects `monthlyDeposit` in
 * dollars and an optional boolean `overspendPrevention` flag.
 */
export const PATCH: RequestHandler = async ({ request }) => {
  const data = await request.json();
  if (typeof data.monthlyDeposit !== 'number' || !isFinite(data.monthlyDeposit) || data.monthlyDeposit < 0) {
    throw error(400, 'monthlyDeposit must be a non-negative number');
  }

  const settings = await prisma.setting.upsert({
    where: { userId: DEMO_USER_ID },
    update: {
      monthlyDepositCents: Math.round(data.monthlyDeposit * 100),
      overspendPrevention: Boolean(data.overspendPrevention)
    },
    create: {
      userId: DEMO_USER_ID,
      monthlyDepositCents: Math.round(data.monthlyDeposit * 100),
      overspendPrevention: Boolean(data.overspendPrevention)
    }
  });

  return json(settings);
};
