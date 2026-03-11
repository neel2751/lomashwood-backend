"use server";

import { MediaStatus, Prisma, ProductCategory } from "@generated/prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";

import { ActionError, calculatePagination, paginationQuerySchema } from "@servers/_shared";

const showroomTeamMemberSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
});

const showroomDisplayProductSchema = z.object({
  productId: z.string().trim().min(1),
  isPrimary: z.boolean().optional(),
});

const showroomOpeningHourSchema = z.object({
  day: z.string().min(1),
  date: z.string().optional(),
  hours: z.string().min(1),
});

const showroomBaseSchema = z.object({
  slug: z.string().trim().min(1).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1),
  city: z.string().trim().min(1),
  address: z.string().trim().min(1),
  postcode: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  email: z.string().trim().email(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  image: z.string().url().optional(),
  imageMediaId: z.string().trim().optional(),
  openToday: z.string().trim().optional(),
  facilities: z.array(z.string().trim().min(1)).default([]),
  team: z.array(showroomTeamMemberSchema).default([]),
  displayProducts: z.array(showroomDisplayProductSchema).default([]),
  openingHours: z.array(showroomOpeningHourSchema).default([]),
  nearbyStores: z.array(z.string().trim().min(1)).default([]),
});

const createShowroomSchema = showroomBaseSchema.transform((value) => {
  const latitude = value.coordinates?.lat ?? value.latitude;
  const longitude = value.coordinates?.lng ?? value.longitude;

  if (latitude === undefined || longitude === undefined) {
    throw new ActionError("Coordinates are required", 400);
  }

  return {
    slug: value.slug,
    name: value.name,
    city: value.city,
    address: value.address,
    postcode: value.postcode,
    phone: value.phone,
    email: value.email,
    latitude,
    longitude,
    image: value.image,
    imageMediaId: value.imageMediaId,
    openToday: value.openToday,
    facilities: value.facilities,
    team: value.team,
    displayProducts: value.displayProducts,
    openingHours: value.openingHours,
    nearbyStores: value.nearbyStores,
  };
});

const updateShowroomSchema = showroomBaseSchema.partial();

const querySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  city: z.string().optional(),
});

const showroomInclude = {
  imageMedia: true,
  displayProducts: {
    include: {
      product: {
        select: {
          id: true,
          title: true,
          category: true,
          style: true,
          styleRef: {
            select: {
              name: true,
            },
          },
          images: true,
        },
      },
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  },
} satisfies Prisma.ShowroomInclude;

function showroomWhereFromQuery(query: z.infer<typeof querySchema>): Prisma.ShowroomWhereInput {
  const where: Prisma.ShowroomWhereInput = {};

  if (query.city) {
    where.city = { contains: query.city, mode: "insensitive" };
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { city: { contains: query.search, mode: "insensitive" } },
      { address: { contains: query.search, mode: "insensitive" } },
      { postcode: { contains: query.search, mode: "insensitive" } },
      { slug: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
}

function normalizeDisplayProducts(input: Array<{ productId: string; isPrimary?: boolean }>) {
  const unique = new Map<string, { productId: string; isPrimary: boolean }>();

  for (const item of input) {
    const productId = item.productId.trim();
    if (!productId) {
      continue;
    }

    const existing = unique.get(productId);
    unique.set(productId, {
      productId,
      isPrimary: Boolean(existing?.isPrimary || item.isPrimary),
    });
  }

  const normalized = [...unique.values()];
  const primaryCount = normalized.filter((item) => item.isPrimary).length;

  if (primaryCount > 1) {
    throw new ActionError("Only one primary display product is allowed", 400);
  }

  return normalized;
}

async function assertDisplayProductsExist(displayProducts: Array<{ productId: string; isPrimary: boolean }>) {
  if (displayProducts.length === 0) {
    return;
  }

  const ids = displayProducts.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: ids },
      category: { in: [ProductCategory.kitchen, ProductCategory.bedroom] },
    },
    select: { id: true },
  });

  const existingIds = new Set(products.map((item) => item.id));
  const invalidIds = ids.filter((id) => !existingIds.has(id));

  if (invalidIds.length > 0) {
    throw new ActionError("One or more display products are invalid", 400);
  }
}

function toShowroomDto(showroom: Prisma.ShowroomGetPayload<{ include: typeof showroomInclude }>) {
  return {
    ...showroom,
    image: showroom.imageMedia?.url ?? showroom.image,
    displayProducts: showroom.displayProducts.map((entry) => ({
      id: entry.id,
      productId: entry.productId,
      isPrimary: entry.isPrimary,
      product: {
        id: entry.product.id,
        title: entry.product.title,
        category: entry.product.category,
        style: entry.product.styleRef?.name ?? entry.product.style,
        image: entry.product.images[0] ?? null,
      },
    })),
  };
}

export async function listShowrooms(rawQuery: Record<string, unknown>) {
  const query = querySchema.parse(rawQuery);
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const where = showroomWhereFromQuery(query);

  const [total, data] = await Promise.all([
    prisma.showroom.count({ where }),
    prisma.showroom.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: showroomInclude,
    }),
  ]);

  return {
    data: data.map(toShowroomDto),
    ...calculatePagination(total, page, limit),
  };
}

export async function getShowroomById(id: string) {
  const showroom = await prisma.showroom.findUnique({ where: { id }, include: showroomInclude });
  if (!showroom) {
    throw new ActionError("Showroom not found", 404);
  }

  return toShowroomDto(showroom);
}

export async function createShowroom(payload: unknown) {
  const data = createShowroomSchema.parse(payload);

  const existing = await prisma.showroom.findUnique({ where: { slug: data.slug } });
  if (existing) {
    throw new ActionError("Showroom slug already exists", 409);
  }

  if (data.imageMediaId) {
    const media = await prisma.media.findFirst({ where: { id: data.imageMediaId, deletedAt: null } });
    if (!media) {
      throw new ActionError("Selected media does not exist", 400);
    }
  }

  const displayProducts = normalizeDisplayProducts(data.displayProducts);
  await assertDisplayProductsExist(displayProducts);

  const showroom = await prisma.showroom.create({
    data: {
      slug: data.slug,
      name: data.name,
      city: data.city,
      address: data.address,
      postcode: data.postcode,
      phone: data.phone,
      email: data.email,
      latitude: data.latitude,
      longitude: data.longitude,
      image: data.image,
      imageMediaId: data.imageMediaId,
      openToday: data.openToday,
      facilities: data.facilities,
      team: data.team,
      openingHours: data.openingHours,
      nearbyStores: data.nearbyStores,
      displayProducts: {
        create: displayProducts.map((item) => ({
          productId: item.productId,
          isPrimary: item.isPrimary,
        })),
      },
    },
    include: showroomInclude,
  });

  if (data.imageMediaId) {
    await prisma.media.update({
      where: { id: data.imageMediaId },
      data: { status: MediaStatus.in_use },
    });
  }

  return toShowroomDto(showroom);
}

export async function updateShowroom(id: string, payload: unknown) {
  const data = updateShowroomSchema.parse(payload);

  const existing = await prisma.showroom.findUnique({ where: { id }, include: { displayProducts: true } });
  if (!existing) {
    throw new ActionError("Showroom not found", 404);
  }

  if (data.imageMediaId) {
    const media = await prisma.media.findFirst({ where: { id: data.imageMediaId, deletedAt: null } });
    if (!media) {
      throw new ActionError("Selected media does not exist", 400);
    }
  }

  let displayProducts: Array<{ productId: string; isPrimary: boolean }> | undefined;
  if (data.displayProducts !== undefined) {
    displayProducts = normalizeDisplayProducts(data.displayProducts);
    await assertDisplayProductsExist(displayProducts);
  }

  const latitude = data.coordinates?.lat ?? data.latitude;
  const longitude = data.coordinates?.lng ?? data.longitude;

  const updateData: Prisma.ShowroomUpdateInput = {
    slug: data.slug,
    name: data.name,
    city: data.city,
    address: data.address,
    postcode: data.postcode,
    phone: data.phone,
    email: data.email,
    image: data.image,
    imageMedia: data.imageMediaId ? { connect: { id: data.imageMediaId } } : undefined,
    openToday: data.openToday,
    facilities: data.facilities,
    team: data.team,
    openingHours: data.openingHours,
    nearbyStores: data.nearbyStores,
  };

  if (displayProducts !== undefined) {
    updateData.displayProducts = {
      deleteMany: {},
      create: displayProducts.map((item) => ({ productId: item.productId, isPrimary: item.isPrimary })),
    };
  }

  if (latitude !== undefined) {
    updateData.latitude = latitude;
  }
  if (longitude !== undefined) {
    updateData.longitude = longitude;
  }

  const updated = await prisma.showroom.update({
    where: { id },
    data: updateData,
    include: showroomInclude,
  });

  if (data.imageMediaId && data.imageMediaId !== existing.imageMediaId) {
    await prisma.media.update({
      where: { id: data.imageMediaId },
      data: { status: MediaStatus.in_use },
    });
  }

  if (existing.imageMediaId && existing.imageMediaId !== data.imageMediaId) {
    const stillInUse = await prisma.showroom.count({ where: { imageMediaId: existing.imageMediaId } });
    if (stillInUse === 0) {
      await prisma.media.update({
        where: { id: existing.imageMediaId },
        data: { status: MediaStatus.unused },
      });
    }
  }

  return toShowroomDto(updated);
}

export async function deleteShowroom(id: string) {
  const existing = await prisma.showroom.findUnique({ where: { id } });
  if (!existing) {
    throw new ActionError("Showroom not found", 404);
  }

  await prisma.showroom.delete({ where: { id } });

  return { message: "Showroom deleted" };
}
