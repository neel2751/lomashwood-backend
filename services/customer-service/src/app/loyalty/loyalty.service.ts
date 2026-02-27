import { LoyaltyRepository } from './loyalty.repository';
import { LoyaltyMapper } from './loyalty.mapper';
import {
  LoyaltyAccountDto,
  LoyaltyTransactionDto,
  PaginatedLoyaltyTransactions,
  LoyaltyTransactionQueryInput,
} from './loyalty.types';
import { EarnPointsInput, RedeemPointsInput, AdjustPointsInput } from './loyalty.schemas';
import { LOYALTY_ERRORS } from './loyalty.constants';
import { AppError } from '../../shared/errors';
import { HttpStatus } from '../../shared/constants';

export class LoyaltyService {
  constructor(private readonly loyaltyRepository: LoyaltyRepository) {}

  async getOrCreateAccount(customerId: string): Promise<LoyaltyAccountDto> {
    let account = await this.loyaltyRepository.findAccountByCustomerId(customerId);
    if (!account) {
      account = await this.loyaltyRepository.createAccount(customerId);
    }
    return LoyaltyMapper.toAccountDto(account);
  }

  async getAccount(customerId: string): Promise<LoyaltyAccountDto> {
    const account = await this.loyaltyRepository.findAccountByCustomerId(customerId);
    if (!account) {
      throw new AppError(LOYALTY_ERRORS.ACCOUNT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return LoyaltyMapper.toAccountDto(account);
  }

  async earnPoints(input: EarnPointsInput): Promise<{ account: LoyaltyAccountDto; transaction: LoyaltyTransactionDto }> {
    let account = await this.loyaltyRepository.findAccountByCustomerId(input.customerId);
    if (!account) {
      account = await this.loyaltyRepository.createAccount(input.customerId);
    }

    const result = await this.loyaltyRepository.earnPoints(
      account.id,
      input.points,
      input.description,
      input.reference,
      input.expiresAt,
    );

    return {
      account: LoyaltyMapper.toAccountDto(result.account),
      transaction: LoyaltyMapper.toTransactionDto(result.transaction),
    };
  }

  async redeemPoints(
    customerId: string,
    input: RedeemPointsInput,
  ): Promise<{ account: LoyaltyAccountDto; transaction: LoyaltyTransactionDto }> {
    const account = await this.loyaltyRepository.findAccountByCustomerId(customerId);
    if (!account) {
      throw new AppError(LOYALTY_ERRORS.ACCOUNT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (account.pointsBalance < input.points) {
      throw new AppError(LOYALTY_ERRORS.INSUFFICIENT_POINTS, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const result = await this.loyaltyRepository.redeemPoints(
      account.id,
      input.points,
      input.description,
      input.reference,
    );

    return {
      account: LoyaltyMapper.toAccountDto(result.account),
      transaction: LoyaltyMapper.toTransactionDto(result.transaction),
    };
  }

  async adjustPoints(input: AdjustPointsInput): Promise<{ account: LoyaltyAccountDto; transaction: LoyaltyTransactionDto }> {
    let account = await this.loyaltyRepository.findAccountByCustomerId(input.customerId);
    if (!account) {
      account = await this.loyaltyRepository.createAccount(input.customerId);
    }

    const result = await this.loyaltyRepository.adjustPoints(
      account.id,
      input.points,
      input.description,
      input.reference,
    );

    return {
      account: LoyaltyMapper.toAccountDto(result.account),
      transaction: LoyaltyMapper.toTransactionDto(result.transaction),
    };
  }

  async getTransactions(
    customerId: string,
    query: LoyaltyTransactionQueryInput,
  ): Promise<PaginatedLoyaltyTransactions> {
    const account = await this.loyaltyRepository.findAccountByCustomerId(customerId);
    if (!account) {
      throw new AppError(LOYALTY_ERRORS.ACCOUNT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const { page = 1, limit = 20 } = query;
    const { data, total } = await this.loyaltyRepository.findTransactions(account.id, query);

    return {
      data: LoyaltyMapper.toTransactionDtoList(data),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async expirePoints(customerId: string): Promise<void> {
    const account = await this.loyaltyRepository.findAccountByCustomerId(customerId);
    if (!account) return;

    const expiring = await this.loyaltyRepository.findExpiringTransactions(new Date());
    const accountTransactions = expiring.filter((t) => t.accountId === account.id);

    for (const transaction of accountTransactions) {
      const pointsToExpire = Math.abs(transaction.points);
      if (account.pointsBalance >= pointsToExpire) {
        await this.loyaltyRepository.expirePoints(
          account.id,
          pointsToExpire,
          `Points expired from transaction ${transaction.id}`,
        );
      }
    }
  }
}