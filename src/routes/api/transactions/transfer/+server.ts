import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { createTransfer } from '$lib/server/transfers';

const DEMO_USER_ID = 'demo-user';

/**
 * API endpoint to create a transfer between two funds.
 * The request body should provide `fromFundId`, `toFundId` and `amount` in dollars.
 */
export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  const { fromFundId, toFundId, amount, date, note } = data as {
    fromFundId: string;
    toFundId: string;
    amount: number;
    date?: string;
    note?: string;
  };

  if (!fromFundId || !toFundId || fromFundId === toFundId) {
    throw error(400, 'fromFundId and toFundId must be provided and different');
  }
  if (typeof amount !== 'number' || !isFinite(amount) || amount <= 0) {
    throw error(400, 'amount must be a positive number');
  }

  const [fromFund, toFund] = await Promise.all([
    prisma.fund.findFirst({ where: { id: fromFundId, userId: DEMO_USER_ID } }),
    prisma.fund.findFirst({ where: { id: toFundId, userId: DEMO_USER_ID } })
  ]);
  if (!fromFund || !toFund) {
    throw error(404, 'fund not found');
  }

  const groupId = await createTransfer(
    DEMO_USER_ID,
    fromFundId,
    toFundId,
    Math.round(amount * 100),
    date ? new Date(date) : new Date(),
    note
  );

  return json({ transferGroupId: groupId }, { status: 201 });
};

