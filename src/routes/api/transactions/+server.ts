import type { RequestHandler } from './$types';
import type { TransactionType } from '@prisma/client';
import { json, error } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

const DEMO_USER_ID = 'demo-user';

/**
 * Retrieve recent transactions for the demo user.
 *
 * The optional `fundId` query parameter narrows results to a
 * single fund which allows the client to show per-fund histories
 * without downloading the entire transaction set.
 */
export const GET: RequestHandler = async ({ url }) => {
  const fundId = url.searchParams.get('fundId');

  const where: { userId: string; fundId?: string } = { userId: DEMO_USER_ID };
  if (fundId) where.fundId = fundId;

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { fund: true },
    take: 50 // limit for demo purposes
  });

  return json(transactions);
};

/**
 * Record a new expense or income transaction for a fund.
 * The client supplies a JSON payload with `fundId`, `type` and `amount` (in dollars).
 * Future iterations will attach the transaction to a period and support transfers.
 */
export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  const { fundId, type, amount, date, payee, note } = data as {
    fundId: string;
    type: TransactionType;
    amount: number;
    date?: string;
    payee?: string;
    note?: string;
  };

  if (!fundId || typeof fundId !== 'string') {
    throw error(400, 'fundId is required');
  }
  if (type !== 'EXPENSE' && type !== 'INCOME') {
    throw error(400, 'type must be EXPENSE or INCOME');
  }
  if (typeof amount !== 'number' || !isFinite(amount) || amount <= 0) {
    throw error(400, 'amount must be a positive number');
  }

  const fund = await prisma.fund.findFirst({
    where: { id: fundId, userId: DEMO_USER_ID }
  });
  if (!fund) {
    throw error(404, 'fund not found');
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId: DEMO_USER_ID,
      fundId,
      type,
      amountCents: Math.round(amount * 100),
      date: date ? new Date(date) : new Date(),
      payee: payee ?? null,
      note: note ?? null
    },
    include: { fund: true }
  });

  return json(transaction, { status: 201 });
};

