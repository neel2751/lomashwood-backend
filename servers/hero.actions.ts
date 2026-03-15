"use server";

import { Prisma, HeroSlideType } from "@generated/prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";

import { ActionError, calculatePagination, paginationQuerySchema } from "@servers/_shared";

const heroSlideCreateSchema = z.object({
  type: z.nativeEnum(HeroSlideType),
  src: z.string().trim().url(),
  title: z.string().trim().min(1),
  subtitle: z.string().trim().optional(),
  description: z.string().trim().optional(),
  ctaText: z.string().trim().optional(),
  ctaLink: z.string().trim().optional(),
  secondaryCtaText: z.string().trim().optional(),
  secondaryCtaLink: z.string().trim().optional(),
  overlayOpacity: z.number().min(0).max(1).default(0.4),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

const heroSlideUpdateSchema = heroSlideCreateSchema.partial();

const heroSlideQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  isActive: z.union([z.boolean(), z.string().transform((v) => v === "true")]).optional(),
});

function heroSlideWhereFromQuery(
  query: z.infer<typeof heroSlideQuerySchema>,
): Prisma.HeroSlideWhereInput {
  const where: Prisma.HeroSlideWhereInput = {};

  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { subtitle: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function listHeroSlides(rawQuery: Record<string, unknown>) {
  const query = heroSlideQuerySchema.parse(rawQuery);
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const where = heroSlideWhereFromQuery(query);

  const [total, data] = await Promise.all([
    prisma.heroSlide.count({ where }),
    prisma.heroSlide.findMany({
      where,
      orderBy: { order: "asc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    data,
    ...calculatePagination(total, page, limit),
  };
}

export async function getHeroSlideById(id: string) {
  const heroSlide = await prisma.heroSlide.findUnique({ where: { id } });
  if (!heroSlide) {
    throw new ActionError("Hero slide not found", 404);
  }
  return heroSlide;
}

export async function createHeroSlide(payload: unknown) {
  const data = heroSlideCreateSchema.parse(payload);

  // If no order specified, put at the end
  if (data.order === 0) {
    const lastSlide = await prisma.heroSlide.findFirst({
      orderBy: { order: "desc" },
    });
    data.order = (lastSlide?.order ?? 0) + 1;
  }

  return prisma.heroSlide.create({ data });
}

export async function updateHeroSlide(id: string, payload: unknown) {
  const data = heroSlideUpdateSchema.parse(payload);
  const existing = await prisma.heroSlide.findUnique({ where: { id } });
  if (!existing) {
    throw new ActionError("Hero slide not found", 404);
  }

  return prisma.heroSlide.update({
    where: { id },
    data,
  });
}

export async function deleteHeroSlide(id: string) {
  const existing = await prisma.heroSlide.findUnique({ where: { id } });
  if (!existing) {
    throw new ActionError("Hero slide not found", 404);
  }

  await prisma.heroSlide.delete({ where: { id } });
  return { message: "Hero slide deleted" };
}

export async function reorderHeroSlides(slideIds: string[]) {
  const updates = slideIds.map((id, index) =>
    prisma.heroSlide.update({
      where: { id },
      data: { order: index },
    }),
  );

  await prisma.$transaction(updates);
  return { message: "Hero slides reordered" };
}

// Public function for frontend - returns formatted slides
export async function getActiveHeroSlides() {
  const slides = await prisma.heroSlide.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return slides.map((slide) => ({
    id: slide.id,
    type: slide.type,
    src: slide.src,
    title: slide.title,
    subtitle: slide.subtitle ?? undefined,
    description: slide.description ?? undefined,
    ctaText: slide.ctaText ?? undefined,
    ctaLink: slide.ctaLink ?? undefined,
    secondaryCtaText: slide.secondaryCtaText ?? undefined,
    secondaryCtaLink: slide.secondaryCtaLink ?? undefined,
    overlayOpacity: slide.overlayOpacity,
  }));
}
