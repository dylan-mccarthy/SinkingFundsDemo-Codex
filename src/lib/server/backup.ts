import prisma from './prisma';

export interface BackupData {
  funds: unknown[];
  allocationRules: unknown[];
  transactions: unknown[];
  periods: unknown[];
}

/**
 * Collect all core records for a user so they can be serialized and
 * downloaded as a JSON backup. This enables the user to safeguard their
 * data or move it between devices without needing a server-side account.
 */
export async function exportBackup(userId: string): Promise<BackupData> {
  const [funds, allocationRules, transactions, periods] = await Promise.all([
    prisma.fund.findMany({ where: { userId } }),
    prisma.allocationRule.findMany({ where: { userId } }),
    prisma.transaction.findMany({ where: { userId } }),
    prisma.period.findMany({ where: { userId } })
  ]);
  return { funds, allocationRules, transactions, periods };
}

/**
 * Replace the user's existing funds, allocation rules, transactions and
 * periods with the records from a previously exported backup. All writes are
 * wrapped in a transaction so the database will remain consistent if an
 * error occurs partway through the restore process.
 */
export async function importBackup(userId: string, data: BackupData): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // remove existing data in dependency order to satisfy foreign keys
    await tx.allocationRule.deleteMany({ where: { userId } });
    await tx.transaction.deleteMany({ where: { userId } });
    await tx.fund.deleteMany({ where: { userId } });
    await tx.period.deleteMany({ where: { userId } });

    if (data.periods?.length) {
      await tx.period.createMany({
        data: data.periods.map((p: any) => ({ ...p, userId }))
      });
    }
    if (data.funds?.length) {
      await tx.fund.createMany({
        data: data.funds.map((f: any) => ({ ...f, userId }))
      });
    }
    if (data.allocationRules?.length) {
      await tx.allocationRule.createMany({
        data: data.allocationRules.map((r: any) => ({ ...r, userId }))
      });
    }
    if (data.transactions?.length) {
      await tx.transaction.createMany({
        data: data.transactions.map((t: any) => ({ ...t, userId }))
      });
    }
  });
}
