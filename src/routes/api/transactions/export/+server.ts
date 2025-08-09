import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

const DEMO_USER_ID = 'demo-user';

/**
 * Stream all transactions for the demo user as a CSV file.
 *
 * The client may optionally include a `fundId` query parameter to
 * limit the export to a single fund. This lightweight endpoint
 * enables the transactions page to offer a quick download of the
 * current history for offline analysis.
 */
export const GET: RequestHandler = async ({ url }) => {
  const fundId = url.searchParams.get('fundId');

  const where: { userId: string; fundId?: string } = { userId: DEMO_USER_ID };
  if (fundId) where.fundId = fundId;

  const transactions = await prisma.transaction.findMany({
    where,
    include: { fund: true },
    orderBy: { date: 'desc' }
  });

  const headers = ['Date', 'Fund', 'Type', 'Amount', 'Payee', 'Note'];
  const rows = transactions.map((tx) => [
    tx.date.toISOString(),
    tx.fund?.name ?? '',
    tx.type,
    (tx.amountCents / 100).toFixed(2),
    tx.payee ?? '',
    tx.note ?? ''
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="transactions.csv"'
    }
  });
};

