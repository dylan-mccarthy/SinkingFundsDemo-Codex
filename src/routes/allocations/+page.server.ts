import type { Actions, PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';

const DEMO_USER_ID = 'demo-user';

/**
 * Load all funds and existing allocation rules for the management page.
 * This gives the user context on how their monthly deposit is currently divided.
 */
export const load: PageServerLoad = async () => {
  const [funds, rules] = await Promise.all([
    prisma.fund.findMany({
      where: { userId: DEMO_USER_ID, active: true },
      orderBy: { displayOrder: 'asc' }
    }),
    prisma.allocationRule.findMany({
      where: { userId: DEMO_USER_ID, active: true },
      include: { fund: true },
      orderBy: { priority: 'asc' }
    })
  ]);

  return { funds, rules };
};

/**
 * Form action to create a new allocation rule.
 * Accepts either a percentage or fixed amount and stores integer representations.
 */
export const actions: Actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    const fundId = formData.get('fundId');
    const mode = formData.get('mode');
    const percentStr = formData.get('percent');
    const fixedStr = formData.get('fixed');
    const priorityStr = formData.get('priority');

    if (typeof fundId !== 'string' || typeof mode !== 'string') {
      return { success: false, message: 'fundId and mode are required' };
    }

    let percentBp: number | null = null;
    let fixedCents: number | null = null;

    if (mode === 'PERCENT') {
      const percent = parseFloat(percentStr as string);
      if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
        return { success: false, message: 'percent must be between 0 and 100' };
      }
      percentBp = Math.round(percent * 100);
    } else if (mode === 'FIXED') {
      const fixed = parseFloat(fixedStr as string);
      if (!Number.isFinite(fixed) || fixed <= 0) {
        return { success: false, message: 'fixed must be a positive number' };
      }
      fixedCents = Math.round(fixed * 100);
    } else {
      return { success: false, message: 'mode must be PERCENT or FIXED' };
    }

    const priority = priorityStr ? parseInt(priorityStr.toString(), 10) : 0;

    await prisma.allocationRule.create({
      data: {
        userId: DEMO_USER_ID,
        fundId,
        mode,
        percentBp,
        fixedCents,
        priority
      }
    });

    return { success: true };
  }
};

