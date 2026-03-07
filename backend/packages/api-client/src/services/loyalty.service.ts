import { HttpClient } from '../utils/http';
import { PaginatedResponse } from '../types/api.types';

// ── Missing types (move to api.types.ts and re-export from there if preferred) ──

export interface LoyaltyProgram {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  pointsName?: string;
  currency?: string;
  earnRules?: Array<{
    type: string;
    value: number;
    description: string;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateLoyaltyProgramRequest {
  name: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  pointsName?: string;
  currency?: string;
  earnRules?: Array<{
    type: string;
    value: number;
    description: string;
  }>;
  isActive?: boolean;
}

export interface UpdateLoyaltyProgramRequest {
  name?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  pointsName?: string;
  currency?: string;
  earnRules?: Array<{
    type: string;
    value: number;
    description: string;
  }>;
  isActive?: boolean;
}

export interface LoyaltyProgramFilters {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class LoyaltyService {
  constructor(private HttpClient: HttpClient) {}

  // ── Loyalty Program Management ───────────────────────────────────────────────

  async getLoyaltyPrograms(params?: LoyaltyProgramFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<LoyaltyProgram[]>> {
    return this.HttpClient.get<PaginatedResponse<LoyaltyProgram[]>>('/loyalty/programs', { params });
  }

  async getLoyaltyProgram(programId: string): Promise<LoyaltyProgram> {
    return this.HttpClient.get<LoyaltyProgram>(`/loyalty/programs/${programId}`);
  }

  async createLoyaltyProgram(programData: CreateLoyaltyProgramRequest): Promise<LoyaltyProgram> {
    return this.HttpClient.post<LoyaltyProgram>('/loyalty/programs', programData);
  }

  async updateLoyaltyProgram(programId: string, updateData: UpdateLoyaltyProgramRequest): Promise<LoyaltyProgram> {
    return this.HttpClient.put<LoyaltyProgram>(`/loyalty/programs/${programId}`, updateData);
  }

  async deleteLoyaltyProgram(programId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/loyalty/programs/${programId}`);
  }

  // ── Customer Loyalty ─────────────────────────────────────────────────────────

  async getCustomerLoyalty(customerId: string): Promise<{
    customerId: string;
    programId: string;
    programName: string;
    tier: {
      id: string;
      name: string;
      level: number;
      benefits: string[];
      nextTier?: {
        id: string;
        name: string;
        pointsNeeded: number;
        benefits: string[];
      };
    };
    points: {
      current: number;
      earned: number;
      redeemed: number;
      expired: number;
      pending: number;
    };
    rewards: {
      available: Array<{
        id: string;
        name: string;
        description: string;
        pointsRequired: number;
        category: string;
        expiryDate?: string;
      }>;
      redeemed: Array<{
        id: string;
        name: string;
        pointsUsed: number;
        redeemedAt: string;
        expiresAt?: string;
        status: 'ACTIVE' | 'USED' | 'EXPIRED';
      }>;
    };
    activity: Array<{
      id: string;
      type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'ADJUSTED';
      points: number;
      description: string;
      referenceId?: string;
      referenceType?: string;
      createdAt: string;
      expiresAt?: string;
    }>;
    statistics: {
      totalEarned: number;
      totalRedeemed: number;
      totalExpired: number;
      averagePointsPerMonth: number;
      membershipDuration: number;
      nextRewardEligibility?: string;
    };
  }> {
    return this.HttpClient.get<any>(`/loyalty/customer/${customerId}`);
  }

  async enrollCustomerInLoyalty(customerId: string, enrollmentData: {
    programId: string;
    referralCode?: string;
    initialPoints?: number;
    notes?: string;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/loyalty/customer/${customerId}/enroll`, enrollmentData);
  }

  async updateCustomerLoyalty(customerId: string, updateData: {
    tierId?: string;
    pointsAdjustment?: number;
    reason?: string;
    notes?: string;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/loyalty/customer/${customerId}`, updateData);
  }

  // ── Points Management ────────────────────────────────────────────────────────

  async earnPoints(customerId: string, pointsData: {
    points: number;
    reason: string;
    referenceId?: string;
    referenceType?: string;
    expiresAt?: string;
    metadata?: any;
  }): Promise<{
    customerId: string;
    pointsEarned: number;
    currentBalance: number;
    transactionId: string;
    expiresAt?: string;
  }> {
    return this.HttpClient.post<any>(`/loyalty/customer/${customerId}/earn`, pointsData);
  }

  async redeemPoints(customerId: string, redemptionData: {
    points: number;
    rewardId?: string;
    reason: string;
    referenceId?: string;
    referenceType?: string;
  }): Promise<{
    customerId: string;
    pointsRedeemed: number;
    currentBalance: number;
    transactionId: string;
    reward?: {
      id: string;
      name: string;
      status: 'ACTIVE' | 'USED';
      expiresAt?: string;
    };
  }> {
    return this.HttpClient.post<any>(`/loyalty/customer/${customerId}/redeem`, redemptionData);
  }

  async getPointsTransactions(customerId: string, params?: {
    page?: number;
    limit?: number;
    type?: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'ADJUSTED';
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'ADJUSTED';
    points: number;
    description: string;
    referenceId?: string;
    referenceType?: string;
    createdAt: string;
    expiresAt?: string;
    metadata?: any;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>(`/loyalty/customer/${customerId}/transactions`, { params });
  }

  // ── Rewards Management ───────────────────────────────────────────────────────

  async getRewards(params?: {
    page?: number;
    limit?: number;
    programId?: string;
    category?: string;
    isActive?: boolean;
    pointsRange?: { min?: number; max?: number };
  }): Promise<PaginatedResponse<Array<{
    id: string;
    programId: string;
    name: string;
    description: string;
    category: string;
    pointsRequired: number;
    type: 'DISCOUNT' | 'PRODUCT' | 'SERVICE' | 'EXPERIENCE' | 'GIFT_CARD';
    value: any;
    restrictions: {
      usageLimit?: number;
      expiryPeriod?: number;
      minPurchaseAmount?: number;
      applicableProducts?: string[];
      applicableCategories?: string[];
    };
    isActive: boolean;
    inventory?: { total: number; available: number; reserved: number };
    imageUrl?: string;
    terms?: string;
    createdAt: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/loyalty/rewards', { params });
  }

  async getReward(rewardId: string): Promise<{
    id: string;
    programId: string;
    name: string;
    description: string;
    category: string;
    pointsRequired: number;
    type: 'DISCOUNT' | 'PRODUCT' | 'SERVICE' | 'EXPERIENCE' | 'GIFT_CARD';
    value: any;
    restrictions: {
      usageLimit?: number;
      expiryPeriod?: number;
      minPurchaseAmount?: number;
      applicableProducts?: string[];
      applicableCategories?: string[];
    };
    isActive: boolean;
    inventory?: { total: number; available: number; reserved: number };
    imageUrl?: string;
    terms?: string;
    createdAt: string;
    updatedAt: string;
  }> {
    return this.HttpClient.get<any>(`/loyalty/rewards/${rewardId}`);
  }

  async createReward(rewardData: {
    programId: string;
    name: string;
    description: string;
    category: string;
    pointsRequired: number;
    type: 'DISCOUNT' | 'PRODUCT' | 'SERVICE' | 'EXPERIENCE' | 'GIFT_CARD';
    value: any;
    restrictions?: {
      usageLimit?: number;
      expiryPeriod?: number;
      minPurchaseAmount?: number;
      applicableProducts?: string[];
      applicableCategories?: string[];
    };
    isActive?: boolean;
    inventory?: { total: number };
    imageUrl?: string;
    terms?: string;
  }): Promise<any> {
    return this.HttpClient.post<any>('/loyalty/rewards', rewardData);
  }

  async updateReward(rewardId: string, updateData: {
    name?: string;
    description?: string;
    category?: string;
    pointsRequired?: number;
    value?: any;
    restrictions?: {
      usageLimit?: number;
      expiryPeriod?: number;
      minPurchaseAmount?: number;
      applicableProducts?: string[];
      applicableCategories?: string[];
    };
    isActive?: boolean;
    inventory?: { total?: number };
    imageUrl?: string;
    terms?: string;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/loyalty/rewards/${rewardId}`, updateData);
  }

  async deleteReward(rewardId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/loyalty/rewards/${rewardId}`);
  }

  // ── Reward Redemption ────────────────────────────────────────────────────────

  async redeemReward(customerId: string, redemptionData: {
    rewardId: string;
    pointsToUse: number;
    deliveryInfo?: any;
    notes?: string;
  }): Promise<{
    redemptionId: string;
    rewardId: string;
    customerId: string;
    pointsUsed: number;
    status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    estimatedDelivery?: string;
    trackingNumber?: string;
    createdAt: string;
  }> {
    return this.HttpClient.post<any>(`/loyalty/customer/${customerId}/redeem-reward`, redemptionData);
  }

  async getCustomerRedemptions(customerId: string, params?: {
    page?: number;
    limit?: number;
    status?: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  }): Promise<PaginatedResponse<Array<{
    id: string;
    rewardId: string;
    rewardName: string;
    pointsUsed: number;
    status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    createdAt: string;
    confirmedAt?: string;
    shippedAt?: string;
    deliveredAt?: string;
    trackingNumber?: string;
    deliveryInfo?: any;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>(`/loyalty/customer/${customerId}/redemptions`, { params });
  }

  // ── Tiers Management ─────────────────────────────────────────────────────────

  async getTiers(programId: string): Promise<Array<{
    id: string;
    programId: string;
    name: string;
    level: number;
    minPoints: number;
    benefits: string[];
    perks: Array<{
      type: 'DISCOUNT' | 'POINTS_MULTIPLIER' | 'FREE_SHIPPING' | 'EXCLUSIVE_ACCESS';
      value: any;
      description: string;
    }>;
    isActive: boolean;
    memberCount: number;
    createdAt: string;
  }>> {
    return this.HttpClient.get<any[]>(`/loyalty/programs/${programId}/tiers`);
  }

  async createTier(programId: string, tierData: {
    name: string;
    level: number;
    minPoints: number;
    benefits: string[];
    perks: Array<{
      type: 'DISCOUNT' | 'POINTS_MULTIPLIER' | 'FREE_SHIPPING' | 'EXCLUSIVE_ACCESS';
      value: any;
      description: string;
    }>;
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/loyalty/programs/${programId}/tiers`, tierData);
  }

  async updateTier(tierId: string, updateData: {
    name?: string;
    level?: number;
    minPoints?: number;
    benefits?: string[];
    perks?: Array<{
      type: 'DISCOUNT' | 'POINTS_MULTIPLIER' | 'FREE_SHIPPING' | 'EXCLUSIVE_ACCESS';
      value: any;
      description: string;
    }>;
    isActive?: boolean;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/loyalty/tiers/${tierId}`, updateData);
  }

  async deleteTier(tierId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/loyalty/tiers/${tierId}`);
  }

  async checkTierEligibility(customerId: string): Promise<{
    customerId: string;
    currentTier: { id: string; name: string; level: number };
    nextTier?: {
      id: string;
      name: string;
      level: number;
      pointsNeeded: number;
      estimatedDate?: string;
    };
    tierProgress: {
      currentPoints: number;
      nextTierPoints: number;
      progressPercentage: number;
    };
  }> {
    return this.HttpClient.get<any>(`/loyalty/customer/${customerId}/tier-eligibility`);
  }

  // ── Referrals ────────────────────────────────────────────────────────────────

  async getReferralCode(customerId: string): Promise<{
    customerId: string;
    referralCode: string;
    referralUrl: string;
    programId: string;
    rewards: {
      referrer: { points: number; description: string };
      referred: { points: number; description: string; discount?: any };
    };
    statistics: {
      totalReferrals: number;
      successfulReferrals: number;
      pendingReferrals: number;
      totalPointsEarned: number;
    };
  }> {
    return this.HttpClient.get<any>(`/loyalty/customer/${customerId}/referral`);
  }

  async createReferralCode(customerId: string, codeData?: {
    customCode?: string;
  }): Promise<any> {
    return this.HttpClient.post<any>(`/loyalty/customer/${customerId}/referral`, codeData);
  }

  async getReferrals(customerId: string, params?: {
    page?: number;
    limit?: number;
    status?: 'PENDING' | 'COMPLETED' | 'EXPIRED';
  }): Promise<PaginatedResponse<Array<{
    id: string;
    referrerId: string;
    referredEmail: string;
    referredName?: string;
    status: 'PENDING' | 'COMPLETED' | 'EXPIRED';
    createdAt: string;
    completedAt?: string;
    pointsAwarded?: number;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>(`/loyalty/customer/${customerId}/referrals`, { params });
  }

  async validateReferralCode(code: string): Promise<{
    valid: boolean;
    referrerId?: string;
    referrerName?: string;
    programId?: string;
    rewards?: { referrer: any; referred: any };
    error?: string;
  }> {
    return this.HttpClient.get<any>(`/loyalty/referral/${code}/validate`);
  }

  async applyReferralCode(customerId: string, code: string): Promise<{
    referralId: string;
    status: 'APPLIED' | 'INVALID' | 'EXPIRED';
    pointsAwarded?: number;
    discountApplied?: any;
    error?: string;
  }> {
    return this.HttpClient.post<any>(`/loyalty/customer/${customerId}/apply-referral`, { code });
  }

  // ── Loyalty Analytics ────────────────────────────────────────────────────────

  async getLoyaltyAnalytics(params?: {
    programId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    overview: {
      totalMembers: number;
      activeMembers: number;
      totalPointsIssued: number;
      totalPointsRedeemed: number;
      totalRewardsRedeemed: number;
      averagePointsPerMember: number;
      memberRetentionRate: number;
    };
    programPerformance: Array<{
      programId: string;
      programName: string;
      members: number;
      pointsIssued: number;
      pointsRedeemed: number;
      rewardsRedeemed: number;
      redemptionRate: number;
    }>;
    tierDistribution: Array<{
      tierId: string;
      tierName: string;
      memberCount: number;
      percentage: number;
    }>;
    popularRewards: Array<{
      rewardId: string;
      rewardName: string;
      category: string;
      redemptions: number;
      pointsUsed: number;
    }>;
    engagementMetrics: {
      dailyActiveMembers: Array<{ date: string; members: number }>;
      pointsActivity: Array<{ date: string; earned: number; redeemed: number }>;
      rewardRedemptions: Array<{ date: string; count: number }>;
    };
    referralStats: {
      totalReferrals: number;
      successfulReferrals: number;
      conversionRate: number;
      pointsFromReferrals: number;
    };
  }> {
    return this.HttpClient.get<any>('/loyalty/analytics', { params });
  }

  async getCustomerLoyaltyAnalytics(customerId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    customerId: string;
    membershipStats: {
      joinDate: string;
      totalDays: number;
      currentTier: string;
      tierProgress: number;
    };
    pointsStats: {
      totalEarned: number;
      totalRedeemed: number;
      currentBalance: number;
      averageEarnedPerMonth: number;
      averageRedeemedPerMonth: number;
    };
    activityBreakdown: {
      earningActivity: Array<{ type: string; count: number; points: number }>;
      redemptionActivity: Array<{ category: string; count: number; points: number }>;
    };
    engagementMetrics: {
      loginFrequency: number;
      redemptionFrequency: number;
      averageTimeToRedeem: number;
      preferredRewardCategories: Array<{ category: string; count: number }>;
    };
    trends: Array<{
      date: string;
      pointsEarned: number;
      pointsRedeemed: number;
      balance: number;
    }>;
  }> {
    return this.HttpClient.get<any>(`/loyalty/analytics/customer/${customerId}`, { params });
  }

  // ── Loyalty Settings ─────────────────────────────────────────────────────────

  async getLoyaltySettings(): Promise<{
    general: {
      defaultProgramId?: string;
      allowMultiplePrograms: boolean;
      autoEnrollCustomers: boolean;
      pointsExpiryDays: number;
      minimumRedemptionPoints: number;
    };
    notifications: {
      pointsEarnedNotification: boolean;
      pointsExpiringNotification: boolean;
      tierUpgradeNotification: boolean;
      rewardAvailableNotification: boolean;
    };
    display: {
      showPointsBalance: boolean;
      showTierProgress: boolean;
      showAvailableRewards: boolean;
      showReferralCode: boolean;
    };
    integration: {
      ecommerceIntegration: boolean;
      emailMarketingIntegration: boolean;
      crmIntegration: boolean;
    };
  }> {
    return this.HttpClient.get<any>('/loyalty/settings');
  }

  async updateLoyaltySettings(settings: {
    general?: {
      defaultProgramId?: string;
      allowMultiplePrograms?: boolean;
      autoEnrollCustomers?: boolean;
      pointsExpiryDays?: number;
      minimumRedemptionPoints?: number;
    };
    notifications?: {
      pointsEarnedNotification?: boolean;
      pointsExpiringNotification?: boolean;
      tierUpgradeNotification?: boolean;
      rewardAvailableNotification?: boolean;
    };
    display?: {
      showPointsBalance?: boolean;
      showTierProgress?: boolean;
      showAvailableRewards?: boolean;
      showReferralCode?: boolean;
    };
    integration?: {
      ecommerceIntegration?: boolean;
      emailMarketingIntegration?: boolean;
      crmIntegration?: boolean;
    };
  }): Promise<any> {
    return this.HttpClient.put<any>('/loyalty/settings', settings);
  }

  // ── Loyalty Import / Export ──────────────────────────────────────────────────

  async exportLoyaltyData(params?: {
    format?: 'csv' | 'excel' | 'json';
    programId?: string;
    data?: 'CUSTOMERS' | 'TRANSACTIONS' | 'REWARDS' | 'REFERRALS';
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    return this.HttpClient.get<Blob>('/loyalty/export', {
      params,
      responseType: 'blob',
    });
  }

  async importLoyaltyData(file: File, options?: {
    type?: 'CUSTOMERS' | 'TRANSACTIONS' | 'REWARDS';
    overwrite?: boolean;
    createMissing?: boolean;
    validatePrograms?: boolean;
    validateCustomers?: boolean;
  }): Promise<{
    imported: number;
    updated: number;
    skipped: number;
    errors: Array<{ row: number; error: string; data: any }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }

    // Content-Type set automatically when passing FormData
    return this.HttpClient.post<any>('/loyalty/import', formData);
  }
}