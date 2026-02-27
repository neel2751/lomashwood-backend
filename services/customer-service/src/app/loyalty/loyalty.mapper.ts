import { LoyaltyAccount, LoyaltyTransaction } from '@prisma/client';
import { LoyaltyAccountDto, LoyaltyTransactionDto, LoyaltyTier } from './loyalty.types';

export class LoyaltyMapper {
  static toAccountDto(account: LoyaltyAccount): LoyaltyAccountDto {
    return {
      id: account.id,
      customerId: account.customerId,
      pointsBalance: account.pointsBalance,
      pointsEarned: account.pointsEarned,
      pointsRedeemed: account.pointsRedeemed,
      tier: account.tier as LoyaltyTier,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  static toTransactionDto(transaction: LoyaltyTransaction): LoyaltyTransactionDto {
    return {
      id: transaction.id,
      accountId: transaction.accountId,
      type: transaction.type,
      points: transaction.points,
      description: transaction.description,
      reference: transaction.reference,
      expiresAt: transaction.expiresAt,
      createdAt: transaction.createdAt,
    };
  }

  static toTransactionDtoList(transactions: LoyaltyTransaction[]): LoyaltyTransactionDto[] {
    return transactions.map((t) => LoyaltyMapper.toTransactionDto(t));
  }
}