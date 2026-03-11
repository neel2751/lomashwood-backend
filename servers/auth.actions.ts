"use server";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import prisma from "@/lib/prisma";

import { ActionError } from "@servers/_shared";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, encodedHash: string): boolean {
  const [salt, hash] = encodedHash.split(":");
  if (!salt || !hash) return false;

  const hashBuffer = Buffer.from(hash, "hex");
  const suppliedHashBuffer = scryptSync(password, salt, 64);

  if (hashBuffer.length !== suppliedHashBuffer.length) return false;
  return timingSafeEqual(hashBuffer, suppliedHashBuffer);
}

function toBase64Url(value: string): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function issueAccessToken(payload: { sub: string; email: string; role: string }): string {
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = toBase64Url(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    })
  );
  const signature = toBase64Url(randomBytes(24).toString("hex"));
  return `${header}.${body}.${signature}`;
}

function toUserDto(user: {
  id: string;
  name: string;
  email: string;
  roleId: string | null;
  roleName: string;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roleId: user.roleId ?? undefined,
    roleName: user.roleName,
    status: user.status,
    lastLoginAt: user.lastLoginAt?.toISOString(),
    createdAt: user.createdAt.toISOString(),
    activeSessionCount: 1,
  };
}

export async function registerAdmin(payload: unknown) {
  const data = registerSchema.parse(payload);

  const existing = await prisma.adminUser.findUnique({
    where: { email: data.email.toLowerCase() },
    select: { id: true },
  });

  if (existing) {
    throw new ActionError("Admin with this email already exists", 409);
  }

  const created = await prisma.adminUser.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: hashPassword(data.password),
      roleName: "admin",
      status: "active",
    },
    select: {
      id: true,
      name: true,
      email: true,
      roleId: true,
      roleName: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  const user = toUserDto(created);
  const token = issueAccessToken({ sub: created.id, email: created.email, role: created.roleName });

  return { user, token };
}

export async function loginAdmin(payload: unknown) {
  const data = loginSchema.parse(payload);

  const user = await prisma.adminUser.findUnique({
    where: { email: data.email.toLowerCase() },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      roleId: true,
      roleName: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!user || !verifyPassword(data.password, user.passwordHash)) {
    throw new ActionError("Invalid credentials", 401);
  }

  if (user.status !== "active") {
    throw new ActionError("User account is inactive", 403);
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const safeUser = toUserDto({ ...user, lastLoginAt: new Date() });
  const token = issueAccessToken({ sub: user.id, email: user.email, role: user.roleName });

  return { user: safeUser, token };
}

export async function getAdminFromAccessToken(token: string) {
  const parts = token.split(".");
  if (parts.length < 2 || !parts[1]) {
    throw new ActionError("Invalid access token", 401);
  }

  let payload: { sub?: string };
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf-8");
    payload = JSON.parse(json) as { sub?: string };
  } catch {
    throw new ActionError("Invalid access token", 401);
  }

  if (!payload.sub) {
    throw new ActionError("Invalid access token", 401);
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      name: true,
      email: true,
      roleId: true,
      roleName: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new ActionError("User not found", 404);
  }

  return toUserDto(user);
}
