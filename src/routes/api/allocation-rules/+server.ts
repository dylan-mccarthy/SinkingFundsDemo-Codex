import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

const DEMO_USER_ID = 'demo-user';

/**
 * Return all active allocation rules configured for the demo user.
 * Each rule describes how part of the monthly deposit is assigned to a fund.
 */
export const GET: RequestHandler = async () => {
  const rules = await prisma.allocationRule.findMany({
    where: { userId: DEMO_USER_ID, active: true },
    include: { fund: true },
    orderBy: { priority: 'asc' }
  });
  return json(rules);
};

/**
 * Create a new allocation rule for a fund.
 * The client sends JSON with `fundId`, `mode` (PERCENT or FIXED),
 * a `percent` or `fixed` value depending on the mode, and an optional `priority`.
 */
export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  const { fundId, mode, percent, fixed, priority } = data as {
    fundId: string;
    mode: string;
    percent?: number;
    fixed?: number;
    priority?: number;
  };

  if (!fundId || typeof fundId !== 'string') {
    throw error(400, 'fundId is required');
  }
  if (mode !== 'PERCENT' && mode !== 'FIXED') {
    throw error(400, 'mode must be PERCENT or FIXED');
  }

  const fund = await prisma.fund.findFirst({
    where: { id: fundId, userId: DEMO_USER_ID }
  });
  if (!fund) {
    throw error(404, 'fund not found');
  }

  let percentBp: number | null = null;
  let fixedCents: number | null = null;

  if (mode === 'PERCENT') {
    if (typeof percent !== 'number' || !isFinite(percent) || percent <= 0 || percent > 100) {
      throw error(400, 'percent must be between 0 and 100');
    }
    percentBp = Math.round(percent * 100);
  } else {
    if (typeof fixed !== 'number' || !isFinite(fixed) || fixed <= 0) {
      throw error(400, 'fixed must be a positive number');
    }
    fixedCents = Math.round(fixed * 100);
  }

  const rule = await prisma.allocationRule.create({
    data: {
      userId: DEMO_USER_ID,
      fundId,
      mode,
      percentBp,
      fixedCents,
      priority: typeof priority === 'number' ? priority : 0
    },
    include: { fund: true }
  });

  return json(rule, { status: 201 });
};

