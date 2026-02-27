import { PrismaClient, LoyaltyAccount, LoyaltyTransaction, LoyaltyTransactionType, Prisma } from '@prisma/client';
import { LoyaltyTransactionQueryInput } from './loyalty.types';
import { LOYALTY_TIER_THRESHOLDS } from './loyalty.constants';

export class LoyaltyRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAccountByCustomerId(customerId: string): Promise<LoyaltyAccount | null> {
    return this.db.loyaltyAccount.findUnique({ where: { customerId } });
  }

  async findAccountById(id: string): Promise<LoyaltyAccount | null> {
    return this.db.loyaltyAccount.findUnique({ where: { id } });
  }

  async createAccount(customerId: string): Promise<LoyaltyAccount> {
    return this.db.loyaltyAccount.create({
      data: { customerId },
    });
  }

  async earnPoints(
    accountId: string,
    points: number,
    description: string,
    reference?: string,
    expiresAt?: Date,
  ): Promise<{ account: LoyaltyAccount; transaction: LoyaltyTransaction }> {
    return this.db.$transaction(async (tx) => {
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          accountId,
          type: LoyaltyTransactionType.EARN,
          points,
          description,
          reference: reference ?? null,
          expiresAt: expiresAt ?? null,
        },
      });

      const account = await tx.loyaltyAccount.update({
        where: { id: accountId },
        data: {
          pointsBalance: { increment: points },
          pointsEarned: { increment: points },
        },
      });

      const updatedAccount = await this.updateTier(tx, account);
      return { account: updatedAccount, transaction };
    });
  }

  async redeemPoints(
    accountId: string,
    points: number,
    description: string,
    reference?: string,
  ): Promise<{ account: LoyaltyAccount; transaction: LoyaltyTransaction }> {
    return this.db.$transaction(async (tx) => {
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          accountId,
          type: LoyaltyTransactionType.REDEEM,
          points: -points,
          description,
          reference: reference ?? null,
        },
      });

      const account = await tx.loyaltyAccount.update({
        where: { id: accountId },
        data: {
          pointsBalance: { decrement: points },
          pointsRedeemed: { increment: points },
        },
      });

      return { account, transaction };
    });
  }

  async adjustPoints(
    accountId: string,
    points: number,
    description: string,
    reference?: string,
  ): Promise<{ account: LoyaltyAccount; transaction: LoyaltyTransaction }> {
    return this.db.$transaction(async (tx) => {
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          accountId,
          type: LoyaltyTransactionType.ADJUST,
          points,
          description,
          reference: reference ?? null,
        },
      });

      const account = await tx.loyaltyAccount.update({
        where: { id: accountId },
        data: {
          pointsBalance: { increment: points },
        },
      });

      const updatedAccount = await this.updateTier(tx, account);
      return { account: updatedAccount, transaction };
    });
  }

  async expirePoints(
    accountId: string,
    points: number,
    description: string,
  ): Promise<{ account: LoyaltyAccount; transaction: LoyaltyTransaction }> {
    return this.db.$transaction(async (tx) => {
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          accountId,
          type: LoyaltyTransactionType.EXPIRE,
          points: -points,
          description,
        },
      });

      const account = await tx.loyaltyAccount.update({
        where: { id: accountId },
        data: {
          pointsBalance: { decrement: points },
        },
      });

      return { account, transaction };
    });
  }

  async findTransactions(
    accountId: string,
    query: LoyaltyTransactionQueryInput,
  ): Promise<{ data: LoyaltyTransaction[]; total: number }> {
    const { page = 1, limit = 20, type, from, to } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LoyaltyTransactionWhereInput = {
      accountId,
      ...(type && { type }),
      ...(from || to
        ? {
            createdAt: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    };

    const [data, total] = await this.db.$transaction([
      this.db.loyaltyTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.db.loyaltyTransaction.count({ where }),
    ]);

    return { data, total };
  }

  async findExpiringTransactions(before: Date): Promise<LoyaltyTransaction[]> {
    return this.db.loyaltyTransaction.findMany({
      where: {
        type: LoyaltyTransactionType.EARN,
        expiresAt: { lte: before },
      },
    });
  }

  private async updateTier(
    tx: Prisma.TransactionClient,
    account: LoyaltyAccount,
  ): Promise<LoyaltyAccount> {
    const earned = account.pointsEarned;
    let tier = 'BRONZE';

    if (earned >= LOYALTY_TIER_THRESHOLDS.PLATINUM) {
      tier = 'PLATINUM';
    } else if (earned >= LOYALTY_TIER_THRESHOLDS.GOLD) {
      tier = 'GOLD';
    } else if (earned >= LOYALTY_TIER_THRESHOLDS.SILVER) {
      tier = 'SILVER';
    }

    if (tier === account.tier) return account;

    return tx.loyaltyAccount.update({
      where: { id: account.id },
      data: { tier },
    });
  }
}