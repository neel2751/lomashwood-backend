import type { UserRole, AccountStatus, AuthProvider } from './auth.types.js';

export type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';

export type AddressType = 'HOME' | 'WORK' | 'BILLING' | 'DELIVERY' | 'OTHER';

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';

export type SupportTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type LoyaltyTransactionType = 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'ADJUSTED' | 'BONUS';

export interface User {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string | null;
  readonly role: UserRole;
  readonly status: AccountStatus;
  readonly provider: AuthProvider;
  readonly emailVerified: boolean;
  readonly avatarUrl: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export interface UserProfile {
  readonly id: string;
  readonly userId: string;
  readonly dateOfBirth: Date | null;
  readonly gender: Gender | null;
  readonly bio: string | null;
  readonly preferredLanguage: string;
  readonly preferredCurrency: string;
  readonly timezone: string;
  readonly marketingConsent: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface Address {
  readonly id: string;
  readonly userId: string;
  readonly type: AddressType;
  readonly label: string | null;
  readonly line1: string;
  readonly line2: string | null;
  readonly city: string;
  readonly county: string | null;
  readonly postcode: string;
  readonly country: string;
  readonly isDefault: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface WishlistItem {
  readonly id: string;
  readonly userId: string;
  readonly productId: string;
  readonly productTitle: string;
  readonly productImageUrl: string | null;
  readonly addedAt: Date;
}

export interface Wishlist {
  readonly userId: string;
  readonly items: readonly WishlistItem[];
  readonly total: number;
}

export interface Review {
  readonly id: string;
  readonly userId: string;
  readonly productId: string;
  readonly orderId: string | null;
  readonly rating: number;
  readonly title: string | null;
  readonly content: string;
  readonly images: readonly string[];
  readonly isVerifiedPurchase: boolean;
  readonly isApproved: boolean;
  readonly helpfulVotes: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export interface SupportTicket {
  readonly id: string;
  readonly userId: string;
  readonly referenceNumber: string;
  readonly subject: string;
  readonly description: string;
  readonly status: SupportTicketStatus;
  readonly priority: SupportTicketPriority;
  readonly category: string;
  readonly assignedTo: string | null;
  readonly resolvedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface LoyaltyAccount {
  readonly userId: string;
  readonly pointsBalance: number;
  readonly lifetimePoints: number;
  readonly tier: string;
  readonly tierExpiresAt: Date | null;
  readonly updatedAt: Date;
}

export interface LoyaltyTransaction {
  readonly id: string;
  readonly userId: string;
  readonly type: LoyaltyTransactionType;
  readonly points: number;
  readonly balanceAfter: number;
  readonly description: string;
  readonly referenceId: string | null;
  readonly referenceType: string | null;
  readonly expiresAt: Date | null;
  readonly createdAt: Date;
}

export interface NotificationPreference {
  readonly userId: string;
  readonly emailMarketing: boolean;
  readonly emailTransactional: boolean;
  readonly emailAppointments: boolean;
  readonly emailOrderUpdates: boolean;
  readonly smsMarketing: boolean;
  readonly smsAppointments: boolean;
  readonly smsOrderUpdates: boolean;
  readonly pushMarketing: boolean;
  readonly pushAppointments: boolean;
  readonly pushOrderUpdates: boolean;
  readonly updatedAt: Date;
}

export interface UserPublicProfile {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly avatarUrl: string | null;
  readonly createdAt: Date;
}

export interface ProfileUpdatedEventPayload {
  readonly userId: string;
  readonly email: string;
  readonly updatedFields: readonly string[];
  readonly updatedAt: Date;
}

export interface ReviewCreatedEventPayload {
  readonly reviewId: string;
  readonly userId: string;
  readonly productId: string;
  readonly rating: number;
  readonly createdAt: Date;
}

export interface LoyaltyPointsEarnedEventPayload {
  readonly userId: string;
  readonly points: number;
  readonly balanceAfter: number;
  readonly referenceId: string;
  readonly referenceType: string;
  readonly earnedAt: Date;
}