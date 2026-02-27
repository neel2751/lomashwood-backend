import { CustomerProfile, Address, Prisma } from '@prisma/client';
import { prismaClient } from '../../infrastructure/db/prisma.client';
import { CreateProfileInput, UpdateProfileInput, CreateAddressInput, UpdateAddressInput } from './profile.types';
import { PaginationOptions } from '../../shared/types';
import { getPrismaSkipTake } from '../../shared/pagination';

export class ProfileRepository {
  async findByUserId(userId: string): Promise<CustomerProfile | null> {
    return prismaClient.customerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
  }

  async findById(id: string): Promise<CustomerProfile | null> {
    return prismaClient.customerProfile.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByEmail(email: string): Promise<CustomerProfile | null> {
    return prismaClient.customerProfile.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async create(input: CreateProfileInput): Promise<CustomerProfile> {
    return prismaClient.customerProfile.create({
      data: {
        userId: input.userId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
      },
    });
  }

  async update(id: string, input: UpdateProfileInput): Promise<CustomerProfile> {
    return prismaClient.customerProfile.update({
      where: { id },
      data: {
        ...input,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await prismaClient.customerProfile.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async findAll(options: PaginationOptions): Promise<{ profiles: CustomerProfile[]; total: number }> {
    const where: Prisma.CustomerProfileWhereInput = { deletedAt: null };
    const [profiles, total] = await prismaClient.$transaction([
      prismaClient.customerProfile.findMany({
        where,
        ...getPrismaSkipTake(options),
        orderBy: { createdAt: 'desc' },
      }),
      prismaClient.customerProfile.count({ where }),
    ]);
    return { profiles, total };
  }

  async createAddress(profileId: string, input: CreateAddressInput): Promise<Address> {
    if (input.isDefault) {
      await prismaClient.address.updateMany({
        where: { profileId },
        data: { isDefault: false },
      });
    }
    return prismaClient.address.create({
      data: { profileId, ...input },
    });
  }

  async updateAddress(id: string, profileId: string, input: UpdateAddressInput): Promise<Address> {
    if (input.isDefault) {
      await prismaClient.address.updateMany({
        where: { profileId },
        data: { isDefault: false },
      });
    }
    return prismaClient.address.update({
      where: { id },
      data: input,
    });
  }

  async findAddressesByProfileId(profileId: string): Promise<Address[]> {
    return prismaClient.address.findMany({
      where: { profileId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findAddressById(id: string, profileId: string): Promise<Address | null> {
    return prismaClient.address.findFirst({ where: { id, profileId } });
  }

  async deleteAddress(id: string): Promise<void> {
    await prismaClient.address.delete({ where: { id } });
  }

  async countAddresses(profileId: string): Promise<number> {
    return prismaClient.address.count({ where: { profileId } });
  }
}