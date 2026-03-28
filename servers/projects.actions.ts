"use server";

import { Prisma, ProjectCategory } from "@generated/prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";

import {
  ActionError,
  calculatePagination,
  paginationQuerySchema,
  parseBoolean,
} from "@servers/_shared";

const projectDetailSchema = z.object({
  label: z.string().trim().min(1),
  value: z.string().trim().min(1),
});

const categorySchema = z.enum(["kitchen", "bedroom", "media_wall"]);
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9-]+$/);

const projectCreateSchema = z.object({
  title: z.string().trim().min(1),
  slug: slugSchema.optional(),
  category: categorySchema,
  location: z.string().trim().min(1),
  completedAt: z.coerce.date(),
  description: z.string().trim().min(1),
  images: z.array(z.string().trim().url()).default([]),
  style: z.string().trim().optional(),
  finish: z.string().trim().optional(),
  layout: z.string().trim().optional(),
  duration: z.string().trim().optional(),
  details: z.array(projectDetailSchema).default([]),
  isPublished: z.boolean().optional(),
});

const projectUpdateSchema = projectCreateSchema.partial();

const projectQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  slug: z.string().trim().optional(),
  category: categorySchema.optional(),
  isPublished: z.string().optional(),
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

async function createUniqueProjectSlug(base: string, excludeId?: string) {
  const seed = slugify(base) || `project-${Date.now()}`;

  for (let index = 0; index < 1000; index += 1) {
    const candidate = index === 0 ? seed : `${seed}-${index + 1}`;
    const existing = await prisma.project.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new ActionError("Unable to generate a unique project slug", 409);
}

function buildProjectWhere(query: z.infer<typeof projectQuerySchema>): Prisma.ProjectWhereInput {
  const where: Prisma.ProjectWhereInput = {
    category: query.category,
    ...(query.slug ? { slug: query.slug } : {}),
  };

  const published = parseBoolean(query.isPublished);
  if (published !== undefined) {
    where.isPublished = published;
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { slug: { contains: query.search, mode: "insensitive" } },
      { location: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
      { style: { contains: query.search, mode: "insensitive" } },
      { finish: { contains: query.search, mode: "insensitive" } },
      { layout: { contains: query.search, mode: "insensitive" } },
      { duration: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
}

function normalizeDetails(input: Array<{ label: string; value: string }> | undefined) {
  if (!input) {
    return undefined;
  }

  return input.map((entry) => ({
    label: entry.label.trim(),
    value: entry.value.trim(),
  }));
}

export async function listProjects(rawQuery: Record<string, unknown>) {
  const query = projectQuerySchema.parse(rawQuery);
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const where = buildProjectWhere(query);

  const [total, data] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
  ]);

  return {
    data,
    ...calculatePagination(total, page, limit),
  };
}

export async function getProjectById(id: string) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    throw new ActionError("Project not found", 404);
  }

  return project;
}

export async function getProjectByIdOrSlug(identifier: string) {
  const projectById = await prisma.project.findUnique({ where: { id: identifier } });
  if (projectById) {
    return projectById;
  }

  const projectBySlug = await prisma.project.findUnique({ where: { slug: identifier } });
  if (!projectBySlug) {
    throw new ActionError("Project not found", 404);
  }

  return projectBySlug;
}

export async function createProject(payload: unknown) {
  const data = projectCreateSchema.parse(payload);
  const slug = await createUniqueProjectSlug(data.slug || data.title);

  return prisma.project.create({
    data: {
      title: data.title,
      slug,
      category: data.category,
      location: data.location,
      completedAt: data.completedAt,
      description: data.description,
      images: data.images,
      style: data.style || null,
      finish: data.finish || null,
      layout: data.layout || null,
      duration: data.duration || null,
      details: normalizeDetails(data.details) ?? [],
      isPublished: data.isPublished ?? true,
    },
  });
}

export async function updateProject(id: string, payload: unknown) {
  const data = projectUpdateSchema.parse(payload);
  const existing = await prisma.project.findUnique({
    where: { id },
    select: { id: true, title: true, slug: true },
  });

  if (!existing) {
    throw new ActionError("Project not found", 404);
  }

  const nextSlug =
    data.slug !== undefined
      ? await createUniqueProjectSlug(data.slug, id)
      : data.title !== undefined
        ? await createUniqueProjectSlug(existing.slug || data.title, id)
        : undefined;

  return prisma.project.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
      ...(data.category !== undefined ? { category: data.category as ProjectCategory } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
      ...(data.completedAt !== undefined ? { completedAt: data.completedAt } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.images !== undefined ? { images: data.images } : {}),
      ...(data.style !== undefined ? { style: data.style || null } : {}),
      ...(data.finish !== undefined ? { finish: data.finish || null } : {}),
      ...(data.layout !== undefined ? { layout: data.layout || null } : {}),
      ...(data.duration !== undefined ? { duration: data.duration || null } : {}),
      ...(data.details !== undefined ? { details: normalizeDetails(data.details) ?? [] } : {}),
      ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
    },
  });
}

export async function deleteProject(id: string) {
  const existing = await prisma.project.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new ActionError("Project not found", 404);
  }

  await prisma.project.delete({ where: { id } });
  return { message: "Project deleted" };
}

export async function listPublicProjects(rawQuery: Record<string, unknown>) {
  return listProjects({ ...rawQuery, isPublished: "true" });
}
