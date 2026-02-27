import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../infrastructure/db/prisma.client';
import { z } from 'zod';

const bannerSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().optional(),
  linkText: z.string().optional(),
  position: z.enum(['hero', 'sidebar', 'footer']),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  sortOrder: z.number().default(0),
});

const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    sortOrder: z.number(),
  })).min(1),
});

export async function getBanners(req: Request, res: Response) {
  try {
    const { position } = req.query;
    const now = new Date();

    const where: any = {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    };

    if (position) {
      if (!['hero', 'sidebar', 'footer'].includes(position as string)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid position' });
      }
      where.position = position;
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ data: banners });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
}

export async function getBannersAdmin(req: Request, res: Response) {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    const total = await prisma.banner.count();

    res.json({
      data: banners,
      meta: { total },
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
}

export async function getBannerById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const banner = await prisma.banner.findUnique({
      where: { id },
    });

    if (!banner) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'Banner not found' });
    }

    res.json({ data: banner });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
}

export async function createBanner(req: Request, res: Response) {
  try {
    const data = bannerSchema.parse(req.body);
    const banner = await prisma.banner.create({
      data: {
        ...data,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
      },
    });

    res.status(StatusCodes.CREATED).json({ data: banner });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error.errors });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
}

export async function updateBanner(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = bannerSchema.partial().parse(req.body);

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        ...data,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
      },
    });

    res.json({ data: banner });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error.errors });
    }
    if (error.code === 'P2025') {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'Banner not found' });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
}

export async function reorderBanners(req: Request, res: Response) {
  try {
    const { items } = reorderSchema.parse(req.body);

    await prisma.$transaction(
      items.map(item =>
        prisma.banner.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    res.status(StatusCodes.OK).json({ message: 'Banners reordered successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error.errors });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
}

export async function deleteBanner(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.banner.findUnique({ where: { id } }); // Check exists

    await prisma.banner.delete({
      where: { id },
    });

    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'Banner not found' });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
}