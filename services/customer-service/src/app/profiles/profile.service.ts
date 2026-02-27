import { ProfileRepository } from './profile.repository';
import { toProfileDto, toAddressDto } from './profile.mapper';
import { ProfileDto, AddressDto, CreateProfileInput, UpdateProfileInput, CreateAddressInput, UpdateAddressInput } from './profile.types';
import { NotFoundError, ConflictError, ValidationError } from '../../shared/errors';
import { publishEvent } from '../../infrastructure/messaging/event-producer';
import { CUSTOMER_TOPICS } from '../../infrastructure/messaging/event-topics';
import { createEventMetadata } from '../../infrastructure/messaging/event-metadata';
import { redisClient } from '../../infrastructure/cache/redis.client';
import { REDIS_KEYS, REDIS_TTL } from '../../infrastructure/cache/redis.keys';
import { PaginationOptions, PaginatedResult } from '../../shared/types';
import { buildPaginationMeta } from '../../shared/utils';
import { PROFILE_CONSTANTS } from './profile.constants';

export class ProfileService {
  constructor(private readonly profileRepo: ProfileRepository) {}

  async getProfileByUserId(userId: string): Promise<ProfileDto> {
    const cached = await redisClient.get(REDIS_KEYS.profile(userId));
    if (cached) return JSON.parse(cached) as ProfileDto;

    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Profile');

    const dto = toProfileDto(profile);
    await redisClient.setex(REDIS_KEYS.profile(userId), REDIS_TTL.profile, JSON.stringify(dto));
    return dto;
  }

  async getProfileById(id: string): Promise<ProfileDto> {
    const profile = await this.profileRepo.findById(id);
    if (!profile) throw new NotFoundError('Profile');
    return toProfileDto(profile);
  }

  async createProfile(input: CreateProfileInput): Promise<ProfileDto> {
    const existing = await this.profileRepo.findByEmail(input.email);
    if (existing) throw new ConflictError('Profile with this email already exists');

    const profile = await this.profileRepo.create(input);
    const dto = toProfileDto(profile);

    await publishEvent(CUSTOMER_TOPICS.PROFILE_UPDATED, profile.id, {
      ...createEventMetadata(CUSTOMER_TOPICS.PROFILE_UPDATED),
      profileId: profile.id,
      userId: profile.userId,
      action: 'created',
    });

    return dto;
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<ProfileDto> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Profile');

    const updated = await this.profileRepo.update(profile.id, input);
    const dto = toProfileDto(updated);

    await redisClient.del(REDIS_KEYS.profile(userId));

    await publishEvent(CUSTOMER_TOPICS.PROFILE_UPDATED, profile.id, {
      ...createEventMetadata(CUSTOMER_TOPICS.PROFILE_UPDATED),
      profileId: profile.id,
      userId,
      action: 'updated',
    });

    return dto;
  }

  async deleteProfile(userId: string): Promise<void> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Profile');

    await this.profileRepo.softDelete(profile.id);
    await redisClient.del(REDIS_KEYS.profile(userId));
  }

  async getAllProfiles(options: PaginationOptions): Promise<PaginatedResult<ProfileDto>> {
    const { profiles, total } = await this.profileRepo.findAll(options);
    return buildPaginationMeta(profiles.map(toProfileDto), total, options);
  }

  async getAddresses(userId: string): Promise<AddressDto[]> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Profile');

    const addresses = await this.profileRepo.findAddressesByProfileId(profile.id);
    return addresses.map(toAddressDto);
  }

  async addAddress(userId: string, input: CreateAddressInput): Promise<AddressDto> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Profile');

    const count = await this.profileRepo.countAddresses(profile.id);
    if (count >= PROFILE_CONSTANTS.MAX_ADDRESSES) {
      throw new ValidationError(`Maximum of ${PROFILE_CONSTANTS.MAX_ADDRESSES} addresses allowed`);
    }

    const address = await this.profileRepo.createAddress(profile.id, input);
    return toAddressDto(address);
  }

  async updateAddress(userId: string, addressId: string, input: UpdateAddressInput): Promise<AddressDto> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Profile');

    const existing = await this.profileRepo.findAddressById(addressId, profile.id);
    if (!existing) throw new NotFoundError('Address');

    const updated = await this.profileRepo.updateAddress(addressId, profile.id, input);
    return toAddressDto(updated);
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Profile');

    const existing = await this.profileRepo.findAddressById(addressId, profile.id);
    if (!existing) throw new NotFoundError('Address');

    await this.profileRepo.deleteAddress(addressId);
  }
}