import prisma from '$lib/server/prisma';

/**
 * Start a new accounting period for a user and distribute the monthly deposit
 * defined in their settings.
 *
 * This demo implementation handles fixed and percentage allocation rules in a
 * simplistic way and does not yet deal with rollover balances or reruns. The
 * deposit amount is looked up from the `Setting` table and assumed to be an
 * integer number of cents.
*/
export async function startPeriod(userId: string) {
  const settings = await prisma.setting.findUnique({ where: { userId } });
  const depositCents = settings?.monthlyDepositCents ?? 0;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JS months are zero-based

  // Ensure we have a period record for the current month.
  let period = await prisma.period.findUnique({
    where: { userId_year_month: { userId, year, month } }
  });
  if (!period) {
    period = await prisma.period.create({
      data: { userId, year, month, startedAt: now }
    });
  }

  // Retrieve all active allocation rules ordered by priority so that fixed
  // amounts (priority waterfall) run before percentages consume the remainder.
  const rules = await prisma.allocationRule.findMany({
    where: { userId, active: true },
    include: { fund: true },
    orderBy: { priority: 'asc' }
  });

  let remaining = depositCents;
  const allocations: { fundId: string; amountCents: number }[] = [];

  // Apply fixed rules first.
  for (const rule of rules.filter((r) => r.mode === 'FIXED' && r.fixedCents)) {
    const amount = Math.min(rule.fixedCents!, remaining);
    if (amount > 0) {
      allocations.push({ fundId: rule.fundId, amountCents: amount });
      remaining -= amount;
    }
  }

  // Distribute remaining deposit by percentages.
  const percentRules = rules.filter((r) => r.mode === 'PERCENT' && r.percentBp);
  for (const rule of percentRules) {
    const amount = Math.round((remaining * rule.percentBp!) / 10000);
    if (amount > 0) {
      allocations.push({ fundId: rule.fundId, amountCents: amount });
    }
  }

  // Push any rounding remainder to the first fund to keep totals balanced.
  const totalAllocated = allocations.reduce((sum, a) => sum + a.amountCents, 0);
  if (depositCents > totalAllocated && allocations.length) {
    allocations[0].amountCents += depositCents - totalAllocated;
  }

  // Record the allocation run and resulting lines.
  const run = await prisma.allocationRun.create({
    data: {
      userId,
      periodId: period.id,
      depositCents,
      hash: `${year}-${month}-${depositCents}`
    }
  });

  if (allocations.length) {
    await prisma.allocationLine.createMany({
      data: allocations.map((a) => ({
        allocationRunId: run.id,
        fundId: a.fundId,
        amountCents: a.amountCents
      }))
    });

    // Mirror allocations as ALLOCATION transactions for fund balance tracking.
    await prisma.transaction.createMany({
      data: allocations.map((a) => ({
        userId,
        periodId: period.id,
        fundId: a.fundId,
        type: 'ALLOCATION',
        amountCents: a.amountCents,
        date: now
      }))
    });
  }

  return { period, allocations };
}

/**
 * Close an open accounting period and record an audit log entry.
 * The period is identified by `periodId` and must belong to the provided user.
 */
export async function closePeriod(userId: string, periodId: string) {
  const period = await prisma.period.findFirst({
    where: { id: periodId, userId }
  });
  if (!period) {
    throw new Error('Period not found');
  }
  if (period.status === 'CLOSED') return period;

  const updated = await prisma.period.update({
    where: { id: periodId },
    data: { status: 'CLOSED', closedAt: new Date() }
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'PERIOD_CLOSED',
      context: periodId
    }
  });

  return updated;
}

/**
 * Reopen a previously closed period. A reason is required and stored in the
 * audit log for accountability. The closedAt timestamp is cleared.
 */
export async function reopenPeriod(userId: string, periodId: string, reason: string) {
  const period = await prisma.period.findFirst({
    where: { id: periodId, userId }
  });
  if (!period) {
    throw new Error('Period not found');
  }
  if (period.status === 'OPEN') return period;

  const updated = await prisma.period.update({
    where: { id: periodId },
    data: { status: 'OPEN', closedAt: null }
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'PERIOD_REOPENED',
      context: JSON.stringify({ periodId, reason })
    }
  });

  return updated;
}

