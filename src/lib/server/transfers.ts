import prisma from '$lib/server/prisma';
import { randomUUID } from 'crypto';

/**
 * Create a transfer between two funds by inserting paired transactions.
 *
 * A single logical transfer results in two rows:
 *   - TRANSFER_OUT for the source fund
 *   - TRANSFER_IN for the destination fund
 * Both share the same `transferGroupId` to make reconciliation straightforward.
 *
 * @param userId owner of both funds
 * @param fromFundId identifier of the fund losing money
 * @param toFundId identifier of the fund gaining money
 * @param amountCents integer cents to move
 * @param date effective date of the transfer
 * @param note optional note applied to both entries
 * @returns the generated transfer group id for reference
 */
export async function createTransfer(
  userId: string,
  fromFundId: string,
  toFundId: string,
  amountCents: number,
  date: Date,
  note?: string
): Promise<string> {
  const transferGroupId = randomUUID();

  await prisma.transaction.createMany({
    data: [
      {
        userId,
        fundId: fromFundId,
        type: 'TRANSFER_OUT',
        amountCents,
        date,
        note: note ?? null,
        transferGroupId
      },
      {
        userId,
        fundId: toFundId,
        type: 'TRANSFER_IN',
        amountCents,
        date,
        note: note ?? null,
        transferGroupId
      }
    ]
  });

  return transferGroupId;
}

