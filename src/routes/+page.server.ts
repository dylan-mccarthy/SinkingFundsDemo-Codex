import type { PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';
import { computeFundBalances } from '$lib/server/balances';

const DEMO_USER_ID = 'demo-user';

/**
 * Load summary data for the dashboard landing page.
 *
 * The dashboard provides a quick overview of the user's finances including the
 * total balance across all active funds, the largest funds by balance and the
 * most recent transactions. In a production system the user ID would come from
 * authentication context rather than being hard coded.
 */
export const load: PageServerLoad = async () => {
  const [funds, balances, transactions] = await Promise.all([
    prisma.fund.findMany({ where: { userId: DEMO_USER_ID, active: true } }),
    computeFundBalances(DEMO_USER_ID),
    prisma.transaction.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { date: 'desc' },
      take: 5,
      include: { fund: true }
    })
  ]);

  const enrichedFunds = funds
    .map((f) => ({ ...f, balanceCents: balances[f.id] ?? 0 }))
    .sort((a, b) => b.balanceCents - a.balanceCents);

  const totalBalanceCents = Object.values(balances).reduce(
    (sum, v) => sum + v,
    0
  );

  return {
    totalBalanceCents,
    topFunds: enrichedFunds.slice(0, 3),
    recentTransactions: transactions
  };
};
