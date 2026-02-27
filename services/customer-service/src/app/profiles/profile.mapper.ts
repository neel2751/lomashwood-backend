import { CustomerProfile, Address } from '@prisma/client';
import { ProfileDto, AddressDto } from './profile.types';

export function toProfileDto(profile: CustomerProfile): ProfileDto {
  return {
    id: profile.id,
    userId: profile.userId,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    avatarUrl: profile.avatarUrl,
    dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString() : null,
    preferredLocale: profile.preferredLocale,
    isVerified: profile.isVerified,
    isActive: profile.isActive,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export function toAddressDto(address: Address): AddressDto {
  return {
    id: address.id,
    profileId: address.profileId,
    label: address.label,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    county: address.county,
    postcode: address.postcode,
    country: address.country,
    isDefault: address.isDefault,
    createdAt: address.createdAt.toISOString(),
    updatedAt: address.updatedAt.toISOString(),
  };
}