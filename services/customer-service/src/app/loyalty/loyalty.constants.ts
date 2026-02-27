export const LOYALTY_TIERS = {
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM',
} as const;

export const LOYALTY_TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 1500,
  PLATINUM: 5000,
} as const;

export const LOYALTY_POINTS_RULES = {
  POINTS_PER_POUND: 1,
  REDEEM_RATE: 100,
  REFERRAL_REWARD: 100,
  REVIEW_REWARD: 25,
  FIRST_ORDER_BONUS: 50,
} as const;

export const LOYALTY_EXPIRY_DAYS = 365;

export const LOYALTY_ERRORS = {
  ACCOUNT_NOT_FOUND: 'Loyalty account not found',
  INSUFFICIENT_POINTS: 'Insufficient points balance',
  TRANSACTION_NOT_FOUND: 'Loyalty transaction not found',
  ACCOUNT_ALREADY_EXISTS: 'Loyalty account already exists',
} as const;