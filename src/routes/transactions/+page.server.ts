import type { Actions, PageServerLoad } from './$types';
import type { TransactionType } from '@prisma/client';
import prisma from '$lib/server/prisma';
import { createTransfer } from '$lib/server/transfers';

const DEMO_USER_ID = 'demo-user';

/**
 * Load recent transactions and available funds for the demo user.
 * Later this will be scoped to the selected period.
 */
export const load: PageServerLoad = async () => {
  const [funds, transactions] = await Promise.all([
    prisma.fund.findMany({
      where: { userId: DEMO_USER_ID, active: true },
      orderBy: { displayOrder: 'asc' }
    }),
    prisma.transaction.findMany({
      where: { userId: DEMO_USER_ID },
      include: { fund: true },
      orderBy: { date: 'desc' },
      take: 50
    })
  ]);

  return { funds, transactions };
};

/**
 * Create action used by the new transaction form.
 * Accepts amount in dollars and converts to integer cents for storage.
 */
export const actions: Actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    const fundId = formData.get('fundId');
    const type = formData.get('type');
    const amountStr = formData.get('amount');
    const payee = formData.get('payee');
    const note = formData.get('note');
    const dateStr = formData.get('date');

    if (typeof fundId !== 'string' || typeof type !== 'string' || typeof amountStr !== 'string') {
      return { success: false, message: 'fundId, type and amount are required' };
    }

    if (type !== 'EXPENSE' && type !== 'INCOME') {
      return { success: false, message: 'type must be EXPENSE or INCOME' };
    }

    const amount = parseFloat(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, message: 'Amount must be a positive number' };
    }

    await prisma.transaction.create({
      data: {
        userId: DEMO_USER_ID,
        fundId,
        type: type as TransactionType,
        amountCents: Math.round(amount * 100),
        date: dateStr ? new Date(dateStr as string) : new Date(),
        payee: typeof payee === 'string' && payee !== '' ? payee : null,
        note: typeof note === 'string' && note !== '' ? note : null
      }
    });

    return { success: true };
  },

  transfer: async ({ request }) => {
    const formData = await request.formData();
    const fromFundId = formData.get('fromFundId');
    const toFundId = formData.get('toFundId');
    const amountStr = formData.get('amount');
    const note = formData.get('note');
    const dateStr = formData.get('date');

    if (
      typeof fromFundId !== 'string' ||
      typeof toFundId !== 'string' ||
      typeof amountStr !== 'string'
    ) {
      return { success: false, message: 'from, to and amount are required' };
    }
    if (fromFundId === toFundId) {
      return { success: false, message: 'Funds must be different' };
    }

    const amount = parseFloat(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, message: 'Amount must be a positive number' };
    }

    await createTransfer(
      DEMO_USER_ID,
      fromFundId,
      toFundId,
      Math.round(amount * 100),
      dateStr ? new Date(dateStr as string) : new Date(),
      typeof note === 'string' && note !== '' ? (note as string) : undefined
    );

    return { success: true };
  }
};

