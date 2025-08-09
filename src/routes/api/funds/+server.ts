import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { computeFundBalances } from '$lib/server/balances';

const DEMO_USER_ID = 'demo-user';

/**
 * Handle retrieval of all active funds for the demo user.
 * In the future, user identity will be resolved from auth context.
 */
export const GET: RequestHandler = async () => {
  const funds = await prisma.fund.findMany({
    where: { userId: DEMO_USER_ID, active: true },
    orderBy: { displayOrder: 'asc' }
  });
  return json(funds);
};

/**
 * Create a new fund owned by the demo user.
 * Expects a JSON body with `name` and optional presentation fields.
 */
export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  if (!data.name || typeof data.name !== 'string') {
    throw error(400, 'name is required');
  }

  const fund = await prisma.fund.create({
    data: {
      userId: DEMO_USER_ID,
      name: data.name,
      description: data.description ?? null,
      color: data.color ?? null,
      icon: data.icon ?? null
    }
  });

  return json(fund, { status: 201 });
};

/**
 * Update mutable fund attributes or archive the fund.
 */
export const PATCH: RequestHandler = async ({ request }) => {
  const data = await request.json();
  if (!data.id || typeof data.id !== 'string') {
    throw error(400, 'id is required');
  }

  // When archiving a fund we must ensure its balance is zero to prevent
  // funds from disappearing with money still allocated to them.  The
  // balance is derived from transaction history via `computeFundBalances`.
  if (data.active === false) {
    const balances = await computeFundBalances(DEMO_USER_ID);
    if ((balances[data.id] ?? 0) !== 0) {
      throw error(400, 'cannot archive fund with non-zero balance');
    }
  }

  const fund = await prisma.fund.update({
    where: { id: data.id, userId: DEMO_USER_ID },
    data: {
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      active: data.active
    }
  });

  return json(fund);
};

