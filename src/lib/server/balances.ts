import prisma from '$lib/server/prisma';
import type { TransactionType } from '@prisma/client';

/**
 * Compute the current balance for each fund belonging to a user.
 *
 * The balance is derived purely from transaction history and is intended for
 * lightweight display scenarios (e.g. the funds list).  It sums credits and
 * debits per fund based on the transaction type:
 *   - EXPENSE and TRANSFER_OUT decrease the balance
 *   - INCOME, ALLOCATION and TRANSFER_IN increase the balance
 * Transactions without a fund association are ignored.
 *
 * @param userId unique identifier for the owner of the funds
 * @returns mapping of fundId to balance in integer cents
 */
export async function computeFundBalances(userId: string): Promise<Record<string, number>> {
  const rows = await prisma.transaction.groupBy({
    by: ['fundId', 'type'],
    where: { userId, fundId: { not: null } },
    _sum: { amountCents: true }
  });

  const balances: Record<string, number> = {};
  const debitTypes: TransactionType[] = ['EXPENSE', 'TRANSFER_OUT'];

  for (const row of rows) {
    const fundId = row.fundId!; // filtered above so non-null
    const amount = row._sum.amountCents ?? 0;
    const sign = debitTypes.includes(row.type as TransactionType) ? -1 : 1;
    balances[fundId] = (balances[fundId] ?? 0) + sign * amount;
  }

  return balances;
}

