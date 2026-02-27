import { PrismaClient } from '@prisma/client';
import { Size, CreateSizeDTO, UpdateSizeDTO, SizeFilters } from './size.types';

export class SizeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Size | null> {
    return await this.prisma.size.findUnique({
      where: { id, deletedAt: null }
    }) as Size | null;
  }

  async findByName(name: string): Promise<Size | null> {
    return await this.prisma.size.findFirst({
      where: { 
        name: {
          equals: name,
          mode: 'insensitive'
        },
        deletedAt: null 
      }
    }) as Size | null;
  }

  async findMany(filters: SizeFilters, skip: number, take: number): Promise<Size[]> {
    const where: any = {
      deletedAt: null
    };

    if (filters.q) {
      where.OR = [
        { name: { contains: filters.q, mode: 'insensitive' } },
        { title: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } }
      ];
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const orderBy: any = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'asc';
    }

    return await this.prisma.size.findMany({
      where,
      skip,
      take,
      orderBy
    }) as Size[];
  }

  async count(filters: SizeFilters): Promise<number> {
    const where: any = {
      deletedAt: null
    };

    if (filters.q) {
      where.OR = [
        { name: { contains: filters.q, mode: 'insensitive' } },
        { title: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } }
      ];
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return await this.prisma.size.count({ where });
  }

  async create(data: CreateSizeDTO): Promise<Size> {
    return await this.prisma.size.create({
      data: {
        name: data.name,
        title: data.title,
        description: data.description,
        image: data.image,
        width: data.width,
        height: data.height,
        depth: data.depth,
        unit: data.unit,
        category: data.category || 'BOTH',
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
        metadata: data.metadata || {}
      }
    }) as Size;
  }

  async update(id: string, data: UpdateSizeDTO): Promise<Size | null> {
    return await this.prisma.size.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.width !== undefined && { width: data.width }),
        ...(data.height !== undefined && { height: data.height }),
        ...(data.depth !== undefined && { depth: data.depth }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
        updatedAt: new Date()
      }
    }) as Size | null;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.size.update({
        where: { id },
        data: {
          deletedAt: new Date()
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async hardDelete(id: string): Promise<boolean> {
    try {
      await this.prisma.size.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async findProductsBySize(sizeId: string): Promise<Array<{
    id: string;
    title: string;
    category: string;
  }>> {
    const productSizes = await this.prisma.productSize.findMany({
      where: { sizeId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            category: true
          }
        }
      }
    });

    return productSizes.map(ps => ps.product);
  }

  async countProductsBySize(sizeId: string): Promise<number> {
    return await this.prisma.productSize.count({
      where: { sizeId }
    });
  }

  async findByDimensions(
    width?: number,
    height?: number,
    depth?: number,
    tolerance: number = 0
  ): Promise<Size[]> {
    const where: any = {
      deletedAt: null
    };

    if (width !== undefined) {
      where.width = {
        gte: width - tolerance,
        lte: width + tolerance
      };
    }

    if (height !== undefined) {
      where.height = {
        gte: height - tolerance,
        lte: height + tolerance
      };
    }

    if (depth !== undefined) {
      where.depth = {
        gte: depth - tolerance,
        lte: depth + tolerance
      };
    }

    return await this.prisma.size.findMany({
      where
    }) as Size[];
  }

  async findMostUsed(limit: number = 10): Promise<Size[]> {
    const sizeUsage = await this.prisma.productSize.groupBy({
      by: ['sizeId'],
      _count: {
        sizeId: true
      },
      orderBy: {
        _count: {
          sizeId: 'desc'
        }
      },
      take: limit
    });

    const sizeIds = sizeUsage.map(su => su.sizeId);

    return await this.prisma.size.findMany({
      where: {
        id: { in: sizeIds },
        deletedAt: null
      }
    }) as Size[];
  }

  async findRecent(limit: number = 10): Promise<Size[]> {
    return await this.prisma.size.findMany({
      where: {
        deletedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    }) as Size[];
  }

  async bulkCreate(sizes: CreateSizeDTO[]): Promise<Size[]> {
    const created = await this.prisma.$transaction(
      sizes.map(size => 
        this.prisma.size.create({
          data: {
            name: size.name,
            title: size.title,
            description: size.description,
            image: size.image,
            width: size.width,
            height: size.height,
            depth: size.depth,
            unit: size.unit,
            category: size.category || 'BOTH',
            isActive: size.isActive ?? true,
            sortOrder: size.sortOrder ?? 0,
            metadata: size.metadata || {}
          }
        })
      )
    );

    return created as Size[];
  }

  async bulkUpdate(updates: Array<{ id: string; data: UpdateSizeDTO }>): Promise<Size[]> {
    const updated = await this.prisma.$transaction(
      updates.map(({ id, data }) =>
        this.prisma.size.update({
          where: { id },
          data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.title !== undefined && { title: data.title }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.image !== undefined && { image: data.image }),
            ...(data.width !== undefined && { width: data.width }),
            ...(data.height !== undefined && { height: data.height }),
            ...(data.depth !== undefined && { depth: data.depth }),
            ...(data.unit !== undefined && { unit: data.unit }),
            ...(data.category !== undefined && { category: data.category }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
            ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
            ...(data.metadata !== undefined && { metadata: data.metadata }),
            updatedAt: new Date()
          }
        })
      )
    );

    return updated as Size[];
  }

  async bulkDelete(ids: string[]): Promise<number> {
    const result = await this.prisma.size.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        deletedAt: new Date()
      }
    });

    return result.count;
  }

  async restore(id: string): Promise<Size | null> {
    return await this.prisma.size.update({
      where: { id },
      data: {
        deletedAt: null
      }
    }) as Size | null;
  }

  async findDeleted(skip: number = 0, take: number = 20): Promise<Size[]> {
    return await this.prisma.size.findMany({
      where: {
        deletedAt: { not: null }
      },
      skip,
      take,
      orderBy: {
        deletedAt: 'desc'
      }
    }) as Size[];
  }
}