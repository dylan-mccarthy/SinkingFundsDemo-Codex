import type { Actions, PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { computeFundBalances } from '$lib/server/balances';

const DEMO_USER_ID = 'demo-user';

/**
 * Load a single fund with its current balance and recent transactions.
 *
 * This server load handler is used by the fund detail view to present
 * transaction history without exposing the entire dataset.
 */
export const load: PageServerLoad = async ({ params }) => {
  const fundId = params.id;

  // Verify the fund exists for the demo user
  const fund = await prisma.fund.findFirst({
    where: { id: fundId, userId: DEMO_USER_ID }
  });
  if (!fund) throw error(404, 'Fund not found');

  // Fetch current balance and recent transactions concurrently
  const [balances, transactions] = await Promise.all([
    computeFundBalances(DEMO_USER_ID),
    prisma.transaction.findMany({
      where: { userId: DEMO_USER_ID, fundId },
      orderBy: { date: 'desc' },
      take: 50
    })
  ]);

  return {
    fund: { ...fund, balanceCents: balances[fundId] ?? 0 },
    transactions
  };
};

/**
 * Form actions available on the fund detail page.  Currently only provides
 * an `archive` action which deactivates the fund after verifying it has a
 * zero balance to guard against accidental loss of money.
 */
export const actions: Actions = {
  archive: async ({ params }) => {
    const fundId = params.id;

    const balances = await computeFundBalances(DEMO_USER_ID);
    if ((balances[fundId] ?? 0) !== 0) {
      return { success: false, message: 'Fund balance must be zero to archive' };
    }

    await prisma.fund.update({
      where: { id: fundId, userId: DEMO_USER_ID },
      data: { active: false }
    });

    throw redirect(303, '/funds');
  }
};
