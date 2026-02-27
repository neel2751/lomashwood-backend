import { Prisma } from '@prisma/client';
import {
  ProductPricingRecord,
  PricingWithRelations,
  PricingResponse,
  PricingDiscountResponse,
  PricingEstimateResult,
  PricingType,
  PricingStatus,
  PricingCurrency,
  DiscountType,
  PricingDiscount,
} from './pricing.types';

export class PricingMapper {
  static toResponse(pricing: PricingWithRelations): PricingResponse {
    return {
      id: pricing.id,
      productId: pricing.productId,
      sizeId: pricing.sizeId,
      pricingType: pricing.pricingType,
      basePrice: pricing.basePrice.toString(),
      minPrice: pricing.minPrice ? pricing.minPrice.toString() : null,
      maxPrice: pricing.maxPrice ? pricing.maxPrice.toString() : null,
      currency: pricing.currency,
      status: pricing.status,
      discount: pricing.discount ? PricingMapper.toDiscountResponse(pricing.discount) : null,
      effectiveFrom: pricing.effectiveFrom,
      effectiveUntil: pricing.effectiveUntil,
      createdAt: pricing.createdAt,
      updatedAt: pricing.updatedAt,
    };
  }

  static toResponseList(pricings: PricingWithRelations[]): PricingResponse[] {
    return pricings.map(PricingMapper.toResponse);
  }

  static toDiscountResponse(discount: PricingDiscount): PricingDiscountResponse {
    return {
      id: discount.id,
      type: discount.type,
      value: discount.value.toString(),
      label: discount.label,
      validFrom: discount.validFrom,
      validUntil: discount.validUntil,
      isActive: discount.isActive,
    };
  }

  static toEstimateResult(
    pricing: PricingWithRelations,
    quantity: number = 1,
  ): PricingEstimateResult {
    const basePrice = new Prisma.Decimal(pricing.basePrice);
    let finalPrice = basePrice.mul(quantity);
    let discountApplied = false;
    let discountAmount: Prisma.Decimal | null = null;
    let discountLabel: string | null = null;

    if (pricing.discount && pricing.discount.isActive) {
      const now = new Date();
      const validFrom = pricing.discount.validFrom;
      const validUntil = pricing.discount.validUntil;
      const isWithinRange =
        (!validFrom || now >= validFrom) && (!validUntil || now <= validUntil);

      if (isWithinRange) {
        if (pricing.discount.type === DiscountType.PERCENTAGE) {
          const pct = new Prisma.Decimal(pricing.discount.value).div(100);
          discountAmount = finalPrice.mul(pct);
          finalPrice = finalPrice.sub(discountAmount);
        } else if (pricing.discount.type === DiscountType.FIXED_AMOUNT) {
          discountAmount = new Prisma.Decimal(pricing.discount.value).mul(quantity);
          finalPrice = finalPrice.sub(discountAmount);
          if (finalPrice.lessThan(0)) {
            finalPrice = new Prisma.Decimal(0);
          }
        }
        discountApplied = true;
        discountLabel = pricing.discount.label;
      }
    }

    return {
      productId: pricing.productId,
      sizeId: pricing.sizeId,
      pricingType: pricing.pricingType,
      basePrice,
      finalPrice,
      minPrice: pricing.minPrice ? new Prisma.Decimal(pricing.minPrice) : null,
      maxPrice: pricing.maxPrice ? new Prisma.Decimal(pricing.maxPrice) : null,
      currency: pricing.currency,
      discountApplied,
      discountAmount,
      discountLabel,
      displayLabel: PricingMapper.buildDisplayLabel(pricing, finalPrice),
    };
  }

  static buildDisplayLabel(
    pricing: PricingWithRelations | ProductPricingRecord,
    finalPrice: Prisma.Decimal,
  ): string {
    const symbol = PricingMapper.getCurrencySymbol(pricing.currency);

    switch (pricing.pricingType) {
      case PricingType.FIXED:
        return `${symbol}${finalPrice.toFixed(2)}`;

      case PricingType.RANGE:
        if (pricing.minPrice && pricing.maxPrice) {
          return `${symbol}${new Prisma.Decimal(pricing.minPrice).toFixed(2)} – ${symbol}${new Prisma.Decimal(pricing.maxPrice).toFixed(2)}`;
        }
        return `${symbol}${finalPrice.toFixed(2)}`;

      case PricingType.STARTING_FROM:
        return `From ${symbol}${finalPrice.toFixed(2)}`;

      case PricingType.ESTIMATED:
        if (pricing.minPrice && pricing.maxPrice) {
          return `Est. ${symbol}${new Prisma.Decimal(pricing.minPrice).toFixed(2)} – ${symbol}${new Prisma.Decimal(pricing.maxPrice).toFixed(2)}`;
        }
        return `Est. ${symbol}${finalPrice.toFixed(2)}`;

      default:
        return `${symbol}${finalPrice.toFixed(2)}`;
    }
  }

  static getCurrencySymbol(currency: PricingCurrency): string {
    const symbols: Record<PricingCurrency, string> = {
      [PricingCurrency.GBP]: '£',
      [PricingCurrency.EUR]: '€',
      [PricingCurrency.USD]: '$',
    };
    return symbols[currency] ?? '£';
  }

  static isEffectiveAt(pricing: ProductPricingRecord, date: Date = new Date()): boolean {
    const afterStart = pricing.effectiveFrom <= date;
    const beforeEnd = !pricing.effectiveUntil || pricing.effectiveUntil >= date;
    return afterStart && beforeEnd && pricing.status === PricingStatus.ACTIVE;
  }

  static computeDiscountedPrice(
    basePrice: Prisma.Decimal,
    discount: PricingDiscount,
  ): Prisma.Decimal {
    if (discount.type === DiscountType.PERCENTAGE) {
      const pct = new Prisma.Decimal(discount.value).div(100);
      return basePrice.sub(basePrice.mul(pct));
    }
    const result = basePrice.sub(new Prisma.Decimal(discount.value));
    return result.lessThan(0) ? new Prisma.Decimal(0) : result;
  }

  static formatPrice(amount: Prisma.Decimal, currency: PricingCurrency): string {
    const symbol = PricingMapper.getCurrencySymbol(currency);
    return `${symbol}${amount.toFixed(2)}`;
  }

  static toPrismaCreateInput(data: {
    productId: string;
    sizeId?: string | null;
    pricingType: PricingType;
    basePrice: number;
    minPrice?: number | null;
    maxPrice?: number | null;
    currency: PricingCurrency;
    status: PricingStatus;
    effectiveFrom: Date;
    effectiveUntil?: Date | null;
  }) {
    return {
      productId: data.productId,
      sizeId: data.sizeId ?? null,
      pricingType: data.pricingType,
      basePrice: new Prisma.Decimal(data.basePrice),
      minPrice: data.minPrice != null ? new Prisma.Decimal(data.minPrice) : null,
      maxPrice: data.maxPrice != null ? new Prisma.Decimal(data.maxPrice) : null,
      currency: data.currency,
      status: data.status,
      effectiveFrom: data.effectiveFrom,
      effectiveUntil: data.effectiveUntil ?? null,
    };
  }

  static toPrismaUpdateInput(data: {
    pricingType?: PricingType;
    basePrice?: number;
    minPrice?: number | null;
    maxPrice?: number | null;
    currency?: PricingCurrency;
    status?: PricingStatus;
    effectiveFrom?: Date;
    effectiveUntil?: Date | null;
  }) {
    const update: Record<string, unknown> = {};

    if (data.pricingType !== undefined) update.pricingType = data.pricingType;
    if (data.basePrice !== undefined) update.basePrice = new Prisma.Decimal(data.basePrice);
    if (data.minPrice !== undefined) update.minPrice = data.minPrice != null ? new Prisma.Decimal(data.minPrice) : null;
    if (data.maxPrice !== undefined) update.maxPrice = data.maxPrice != null ? new Prisma.Decimal(data.maxPrice) : null;
    if (data.currency !== undefined) update.currency = data.currency;
    if (data.status !== undefined) update.status = data.status;
    if (data.effectiveFrom !== undefined) update.effectiveFrom = data.effectiveFrom;
    if (data.effectiveUntil !== undefined) update.effectiveUntil = data.effectiveUntil;

    return update;
  }
}