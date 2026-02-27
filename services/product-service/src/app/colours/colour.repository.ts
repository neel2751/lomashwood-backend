import { PrismaClient } from '@prisma/client';
import {
  CreateColourDTO,
  UpdateColourDTO,
  ColourWithRelations,
  ColourRepositoryOptions,
} from './colour.types';
import { logger } from '../../config';

const DEFAULT_INCLUDE = {
  _count: {
    select: { products: true },
  },
} as const;

export class ColourRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private get colour() {

    return (this.prisma as any).color as PrismaClient['$transaction'] extends never
      ? never

      : any;
  }

  private get productColour() {
    return (this.prisma as any).productColor as any;
  }

  async create(data: CreateColourDTO): Promise<ColourWithRelations> {
    logger.info('Creating colour in database', { name: data.name });

    return await this.colour.create({
      data: {
        name: data.name,
        hexCode: data.hexCode,
        isActive: data.isActive ?? true,
      },
      include: DEFAULT_INCLUDE,
    });
  }

  async findById(
    id: string,
    options?: ColourRepositoryOptions
  ): Promise<ColourWithRelations | null> {
    logger.info('Finding colour by ID', { id });

    return await this.colour.findUnique({
      where: { id },
      include: options?.include ?? DEFAULT_INCLUDE,
    });
  }

  async findByName(name: string): Promise<ColourWithRelations | null> {
    logger.info('Finding colour by name', { name });

    return await this.colour.findUnique({
      where: { name },
      include: DEFAULT_INCLUDE,
    });
  }

  async findByHexCode(hexCode: string): Promise<ColourWithRelations | null> {
    logger.info('Finding colour by hex code', { hexCode });

    return await this.colour.findFirst({
      where: { hexCode },
      include: DEFAULT_INCLUDE,
    });
  }

  async findMany(options?: ColourRepositoryOptions): Promise<ColourWithRelations[]> {
    logger.info('Finding multiple colours', { options });

    return await this.colour.findMany({
      where: options?.where,
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy ?? { name: 'asc' },
      include: options?.include ?? DEFAULT_INCLUDE,
    });
  }

  async findAll(): Promise<ColourWithRelations[]> {
    logger.info('Finding all colours');

    return await this.colour.findMany({
      orderBy: { name: 'asc' },
      include: DEFAULT_INCLUDE,
    });
  }

  async update(id: string, data: UpdateColourDTO): Promise<ColourWithRelations> {
    logger.info('Updating colour', { id });

    return await this.colour.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.hexCode !== undefined && { hexCode: data.hexCode }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: DEFAULT_INCLUDE,
    });
  }

  async delete(id: string): Promise<void> {
    logger.info('Deleting colour', { id });

    await this.colour.delete({ where: { id } });
  }

  async count(options?: { where?: Record<string, unknown> }): Promise<number> {
    logger.info('Counting colours', { options });

    return await this.colour.count({ where: options?.where });
  }

  async exists(id: string): Promise<boolean> {
    logger.info('Checking if colour exists', { id });

    const n = await this.colour.count({ where: { id } });
    return n > 0;
  }

  async existsByName(name: string): Promise<boolean> {
    logger.info('Checking if colour exists by name', { name });

    const n = await this.colour.count({ where: { name } });
    return n > 0;
  }

  async findActive(): Promise<ColourWithRelations[]> {
    logger.info('Finding active colours');

    return await this.colour.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
      include: DEFAULT_INCLUDE,
    });
  }

  async findPopular(limit: number): Promise<ColourWithRelations[]> {
    logger.info('Finding popular colours', { limit });

    const colours: ColourWithRelations[] = await this.colour.findMany({
      where: { isActive: true, deletedAt: null },
      include: DEFAULT_INCLUDE,
    });

    return colours
      .sort(
        (a: ColourWithRelations, b: ColourWithRelations) =>
          (b._count?.products ?? 0) - (a._count?.products ?? 0)
      )
      .slice(0, limit);
  }

  async findProductsByColour(
    colourId: string,
    skip: number,
    take: number
  ): Promise<unknown[]> {
    logger.info('Finding products by colour', { colourId, skip, take });

    const productColours: Array<{ product: unknown }> =
      await this.productColour.findMany({
        where: {
          colourId,
          product: { deletedAt: null },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            include: {
              colours: {
                include: { colour: true },
              },
            },
          },
        },
      });

    return productColours.map((pc) => pc.product);
  }

  async countProductsByColour(colourId: string): Promise<number> {
    logger.info('Counting products by colour', { colourId });

    return await this.productColour.count({
      where: {
        colourId,
        product: { deletedAt: null },
      },
    });
  }

  async countColoursWithProducts(): Promise<number> {
    logger.info('Counting colours with products');

    const colours: ColourWithRelations[] = await this.colour.findMany({
      include: DEFAULT_INCLUDE,
    });

    return colours.filter((c: ColourWithRelations) => c._count.products > 0).length;
  }

  async search(query: string, limit?: number): Promise<ColourWithRelations[]> {
    logger.info('Searching colours', { query, limit });

    return await this.colour.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { hexCode: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
      include: DEFAULT_INCLUDE,
    });
  }

  async bulkDelete(ids: string[]): Promise<{ count: number }> {
    logger.info('Bulk deleting colours', { count: ids.length });

    return await this.colour.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async findByCategory(category: string): Promise<ColourWithRelations[]> {
    logger.info('Finding colours by category', { category });

    const productColours: Array<{ colour: ColourWithRelations }> =
      await this.productColour.findMany({
        where: {
          product: {
            deletedAt: null,
            category: category,
          },
        },
        include: {
          colour: {
            include: DEFAULT_INCLUDE,
          },
        },
      });

    const colourMap = new Map<string, ColourWithRelations>();

    productColours.forEach((pc) => {
      const colour = pc.colour;
      if (!colourMap.has(colour.id)) {
        colourMap.set(colour.id, colour);
      }
    });

    return Array.from(colourMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  async findColoursWithNoProducts(): Promise<ColourWithRelations[]> {
    logger.info('Finding colours with no products');

    const colours: ColourWithRelations[] = await this.colour.findMany({
      include: DEFAULT_INCLUDE,
    });

    return colours.filter((c: ColourWithRelations) => c._count.products === 0);
  }

  async toggleActive(id: string): Promise<ColourWithRelations> {
    logger.info('Toggling colour active status', { id });

    const colour = await this.findById(id);
    if (!colour) throw new Error('Colour not found');

    return await this.update(id, { isActive: !colour.isActive });
  }

  async softDelete(id: string): Promise<ColourWithRelations> {
    logger.info('Soft deleting colour', { id });

    return await this.colour.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
      include: DEFAULT_INCLUDE,
    });
  }

  async restore(id: string): Promise<ColourWithRelations> {
    logger.info('Restoring colour', { id });

    return await this.colour.update({
      where: { id },
      data: { isActive: true, deletedAt: null },
      include: DEFAULT_INCLUDE,
    });
  }

  async findWithProductCount(): Promise<ColourWithRelations[]> {
    logger.info('Finding colours with product count');

    return await this.colour.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      include: DEFAULT_INCLUDE,
    });
  }

  async findMostUsed(limit: number): Promise<ColourWithRelations[]> {
    return this.findPopular(limit);
  }

  async findLeastUsed(limit: number): Promise<ColourWithRelations[]> {
    logger.info('Finding least used colours', { limit });

    const colours: ColourWithRelations[] = await this.colour.findMany({
      where: { isActive: true, deletedAt: null },
      include: DEFAULT_INCLUDE,
    });

    return colours
      .sort(
        (a: ColourWithRelations, b: ColourWithRelations) =>
          (a._count?.products ?? 0) - (b._count?.products ?? 0)
      )
      .slice(0, limit);
  }

  async findUnused(): Promise<ColourWithRelations[]> {
    return this.findColoursWithNoProducts();
  }

  async getProductCountByColour(colourId: string): Promise<number> {
    return this.countProductsByColour(colourId);
  }

  async findByIds(ids: string[]): Promise<ColourWithRelations[]> {
    logger.info('Finding colours by IDs', { count: ids.length });

    return await this.colour.findMany({
      where: { id: { in: ids }, deletedAt: null },
      include: DEFAULT_INCLUDE,
    });
  }

  async validateHexCode(hexCode: string): Promise<boolean> {
    logger.info('Validating hex code', { hexCode });

    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hexCode);
  }
}