import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyAccount } from './entities/loyalty-account.entity';
import { LoyaltyTransaction } from './entities/loyalty-transaction.entity';
import { AdjustLoyaltyDto } from './dto/adjust-loyalty.dto';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyAccount)
    private loyaltyAccountRepository: Repository<LoyaltyAccount>,
    @InjectRepository(LoyaltyTransaction)
    private loyaltyTransactionRepository: Repository<LoyaltyTransaction>,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    tier?: string;
    status?: string;
  }): Promise<{ accounts: LoyaltyAccount[]; total: number; page: number; limit: number }> {
    const { page, limit, tier, status } = params;
    const skip = (page - 1) * limit;

    const query = this.loyaltyAccountRepository.createQueryBuilder('account')
      .leftJoinAndSelect('account.customer', 'customer');

    if (tier) {
      query.andWhere('account.tier = :tier', { tier });
    }

    if (status) {
      query.andWhere('account.status = :status', { status });
    }

    const [accounts, total] = await query
      .orderBy('account.points', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      accounts,
      total,
      page,
      limit,
    };
  }

  async findById(id: string, user?: any): Promise<LoyaltyAccount | null> {
    const query = this.loyaltyAccountRepository.createQueryBuilder('account')
      .leftJoinAndSelect('account.customer', 'customer')
      .where('account.id = :id', { id });

    // Apply user access control
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
      query.andWhere('account.customerId = :customerId', { customerId: user?.id });
    }

    return query.getOne();
  }

  async findByCustomer(customerId: string, user?: any): Promise<LoyaltyAccount | null> {
    // Apply user access control
    const targetCustomerId = (user?.role !== 'ADMIN' && user?.role !== 'STAFF') ? user?.id : customerId;

    return this.loyaltyAccountRepository.findOne({
      where: { customerId: targetCustomerId },
      relations: ['customer'],
    });
  }

  async getProfile(user?: any): Promise<any> {
    const account = await this.findByCustomer(user?.id, user);
    if (!account) {
      return null;
    }

    const recentTransactions = await this.loyaltyTransactionRepository.find({
      where: { accountId: account.id },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const tierProgress = await this.calculateTierProgress(account);

    return {
      account,
      recentTransactions,
      tierProgress,
      availableRewards: await this.getAvailableRewardsForTier(account.tier),
    };
  }

  async create(customerId: string, initialPoints: number = 0): Promise<LoyaltyAccount> {
    const account = this.loyaltyAccountRepository.create({
      customerId,
      points: initialPoints,
      tier: this.calculateTier(initialPoints),
      status: 'ACTIVE',
    });

    const savedAccount = await this.loyaltyAccountRepository.save(account);

    // Create initial transaction if points were added
    if (initialPoints > 0) {
      await this.createTransaction({
        accountId: savedAccount.id,
        type: 'EARNED',
        points: initialPoints,
        description: 'Welcome bonus',
        reference: 'WELCOME_BONUS',
      });
    }

    return savedAccount;
  }

  async adjustPoints(id: string, adjustLoyaltyDto: AdjustLoyaltyDto): Promise<LoyaltyAccount | null> {
    const account = await this.loyaltyAccountRepository.findOne({ where: { id } });
    if (!account) {
      return null;
    }

    const newPoints = account.points + adjustLoyaltyDto.points;
    const newTier = this.calculateTier(newPoints);

    await this.loyaltyAccountRepository.update(id, {
      points: newPoints,
      tier: newTier,
      updatedAt: new Date(),
    });

    // Create transaction record
    await this.createTransaction({
      accountId: id,
      type: adjustLoyaltyDto.points > 0 ? 'EARNED' : 'REDEEMED',
      points: Math.abs(adjustLoyaltyDto.points),
      description: adjustLoyaltyDto.reason,
      reference: 'MANUAL_ADJUSTMENT',
    });

    return this.findById(id);
  }

  async getTransactions(params: {
    page: number;
    limit: number;
    accountId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
  }, user?: any): Promise<{ transactions: LoyaltyTransaction[]; total: number; page: number; limit: number }> {
    const { page, limit, accountId, type, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const query = this.loyaltyTransactionRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('account.customer', 'customer');

    // Apply user access control
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
      query.andWhere('account.customerId = :customerId', { customerId: user?.id });
    } else if (accountId) {
      query.andWhere('transaction.accountId = :accountId', { accountId });
    }

    if (type) {
      query.andWhere('transaction.type = :type', { type });
    }

    if (startDate) {
      query.andWhere('transaction.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('transaction.createdAt <= :endDate', { endDate });
    }

    const [transactions, total] = await query
      .orderBy('transaction.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      transactions,
      total,
      page,
      limit,
    };
  }

  async getTransaction(id: string, user?: any): Promise<LoyaltyTransaction | null> {
    const query = this.loyaltyTransactionRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('account.customer', 'customer')
      .where('transaction.id = :id', { id });

    // Apply user access control
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
      query.andWhere('account.customerId = :customerId', { customerId: user?.id });
    }

    return query.getOne();
  }

  async redeemPoints(
    points: number,
    rewardId?: string,
    description?: string,
    user?: any
  ): Promise<any> {
    const account = await this.findByCustomer(user?.id, user);
    if (!account || account.points < points) {
      return null;
    }

    const newPoints = account.points - points;
    const newTier = this.calculateTier(newPoints);

    await this.loyaltyAccountRepository.update(account.id, {
      points: newPoints,
      tier: newTier,
      updatedAt: new Date(),
    });

    // Create redemption transaction
    const transaction = await this.createTransaction({
      accountId: account.id,
      type: 'REDEEMED',
      points,
      description: description || `Redeemed for reward ${rewardId}`,
      reference: rewardId || 'REDEMPTION',
    });

    return {
      account: await this.findById(account.id, user),
      transaction,
    };
  }

  async getRewards(tier?: string, category?: string): Promise<any[]> {
    // This would typically fetch from a rewards catalog
    // For now, return mock data
    return [
      {
        id: 'reward1',
        name: '10% Discount Coupon',
        description: 'Get 10% off your next purchase',
        pointsRequired: 100,
        tier: 'BRONZE',
        category: 'DISCOUNT',
        available: true,
      },
      {
        id: 'reward2',
        name: 'Free Shipping',
        description: 'Free shipping on your next order',
        pointsRequired: 50,
        tier: 'BRONZE',
        category: 'SHIPPING',
        available: true,
      },
      {
        id: 'reward3',
        name: '25% Discount Coupon',
        description: 'Get 25% off your next purchase',
        pointsRequired: 250,
        tier: 'SILVER',
        category: 'DISCOUNT',
        available: true,
      },
    ];
  }

  async getTiers(): Promise<any[]> {
    return [
      {
        name: 'BRONZE',
        minPoints: 0,
        maxPoints: 499,
        benefits: ['Basic rewards', '5% birthday bonus'],
      },
      {
        name: 'SILVER',
        minPoints: 500,
        maxPoints: 1499,
        benefits: ['Enhanced rewards', '10% birthday bonus', 'Early access to sales'],
      },
      {
        name: 'GOLD',
        minPoints: 1500,
        maxPoints: 4999,
        benefits: ['Premium rewards', '15% birthday bonus', 'Exclusive offers'],
      },
      {
        name: 'PLATINUM',
        minPoints: 5000,
        maxPoints: 9999,
        benefits: ['VIP rewards', '20% birthday bonus', 'Personalized service'],
      },
      {
        name: 'DIAMOND',
        minPoints: 10000,
        maxPoints: Infinity,
        benefits: ['Elite rewards', '25% birthday bonus', 'Concierge service'],
      },
    ];
  }

  async getStats(
    startDate?: Date,
    endDate?: Date,
    tier?: string
  ): Promise<{
    totalAccounts: number;
    totalPointsIssued: number;
    totalPointsRedeemed: number;
    activeAccounts: number;
    tierBreakdown: Record<string, number>;
    averagePointsPerAccount: number;
  }> {
    const query = this.loyaltyAccountRepository.createQueryBuilder('account');

    if (tier) {
      query.andWhere('account.tier = :tier', { tier });
    }

    const accounts = await query.getMany();

    const totalAccounts = accounts.length;
    const activeAccounts = accounts.filter(a => a.status === 'ACTIVE').length;
    const averagePointsPerAccount = totalAccounts > 0
      ? accounts.reduce((sum, account) => sum + account.points, 0) / totalAccounts
      : 0;

    const tierBreakdown = accounts.reduce((acc, account) => {
      acc[account.tier] = (acc[account.tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get transaction stats
    const transactionQuery = this.loyaltyTransactionRepository.createQueryBuilder('transaction');

    if (startDate) {
      transactionQuery.andWhere('transaction.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      transactionQuery.andWhere('transaction.createdAt <= :endDate', { endDate });
    }

    const transactions = await transactionQuery.getMany();

    const totalPointsIssued = transactions
      .filter(t => t.type === 'EARNED')
      .reduce((sum, t) => sum + t.points, 0);

    const totalPointsRedeemed = transactions
      .filter(t => t.type === 'REDEEMED')
      .reduce((sum, t) => sum + t.points, 0);

    return {
      totalAccounts,
      totalPointsIssued,
      totalPointsRedeemed,
      activeAccounts,
      tierBreakdown,
      averagePointsPerAccount,
    };
  }

  async bulkAdjust(adjustments: Array<{ accountId: string; points: number; reason: string }>): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const adjustment of adjustments) {
      const result = await this.adjustPoints(adjustment.accountId, {
        points: adjustment.points,
        reason: adjustment.reason,
      });
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  async getLeaderboard(limit: number = 10, tier?: string): Promise<any[]> {
    const query = this.loyaltyAccountRepository.createQueryBuilder('account')
      .leftJoinAndSelect('account.customer', 'customer')
      .where('account.status = :status', { status: 'ACTIVE' });

    if (tier) {
      query.andWhere('account.tier = :tier', { tier });
    }

    return query
      .orderBy('account.points', 'DESC')
      .take(limit)
      .getMany();
  }

  private async createTransaction(transactionData: {
    accountId: string;
    type: string;
    points: number;
    description: string;
    reference: string;
  }): Promise<LoyaltyTransaction> {
    const transaction = this.loyaltyTransactionRepository.create(transactionData);
    return this.loyaltyTransactionRepository.save(transaction);
  }

  private calculateTier(points: number): string {
    if (points >= 10000) return 'DIAMOND';
    if (points >= 5000) return 'PLATINUM';
    if (points >= 1500) return 'GOLD';
    if (points >= 500) return 'SILVER';
    return 'BRONZE';
  }

  private async calculateTierProgress(account: LoyaltyAccount): Promise<any> {
    const tiers = await this.getTiers();
    const currentTier = tiers.find(t => t.name === account.tier);
    const nextTier = tiers.find(t => t.minPoints > account.points);

    if (!nextTier) {
      return {
        currentTier,
        nextTier: null,
        progressToNext: 100,
        pointsToNext: 0,
      };
    }

    const currentTierMin = currentTier?.minPoints || 0;
    const pointsToNext = nextTier.minPoints - account.points;
    const totalPointsInCurrentTier = nextTier.minPoints - currentTierMin;
    const progressToNext = ((account.points - currentTierMin) / totalPointsInCurrentTier) * 100;

    return {
      currentTier,
      nextTier,
      progressToNext: Math.min(100, Math.max(0, progressToNext)),
      pointsToNext,
    };
  }

  private async getAvailableRewardsForTier(tier: string): Promise<any[]> {
    return this.getRewards(tier);
  }
}
