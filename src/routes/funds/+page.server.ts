import type { Actions, PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';
import { computeFundBalances } from '$lib/server/balances';

const DEMO_USER_ID = 'demo-user';

/**
 * Load all funds for display on the funds management page.
 * In a future multi-user setup, the user ID will come from the session.
 */
export const load: PageServerLoad = async () => {
  const [funds, balances] = await Promise.all([
    prisma.fund.findMany({
      where: { userId: DEMO_USER_ID, active: true },
      orderBy: { displayOrder: 'asc' }
    }),
    computeFundBalances(DEMO_USER_ID)
  ]);

  return {
    funds: funds.map((f) => ({ ...f, balanceCents: balances[f.id] ?? 0 }))
  };
};

/**
 * Form actions for creating a new fund.
 */
export const actions: Actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get('name');
    if (!name || typeof name !== 'string') {
      return { success: false, message: 'Name is required' };
    }

    await prisma.fund.create({
      data: {
        userId: DEMO_USER_ID,
        name,
        description: (formData.get('description') as string) || null,
        color: (formData.get('color') as string) || null,
        icon: (formData.get('icon') as string) || null
      }
    });

    return { success: true };
  }
};

