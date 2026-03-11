"use server";

import { z } from "zod";

import prisma from "@/lib/prisma";

import { ActionError } from "@servers/_shared";

const DEFAULT_WEEKLY_SCHEDULE = {
  0: { enabled: false, start: "10:00", end: "14:00", duration: 90 },
  1: { enabled: true, start: "09:00", end: "17:00", duration: 60 },
  2: { enabled: true, start: "09:00", end: "17:00", duration: 60 },
  3: { enabled: true, start: "09:00", end: "17:00", duration: 60 },
  4: { enabled: true, start: "09:00", end: "17:00", duration: 60 },
  5: { enabled: true, start: "09:00", end: "16:00", duration: 60 },
  6: { enabled: true, start: "10:00", end: "16:00", duration: 90 },
} as const;

const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

const setAvailabilitySchema = z.object({
  consultantId: z.string().trim().optional(),
  date: dateSchema,
  slots: z.array(z.string().regex(/^\d{2}:\d{2}$/)).default([]),
  isBlocked: z.boolean().optional(),
});

const availabilityQuerySchema = z.object({
  consultantId: z.string().trim().optional(),
  date: dateSchema.optional(),
  includeBlocked: z.coerce.boolean().optional(),
});

const slotLookupSchema = z.object({
  consultantId: z.string().trim().optional(),
  date: dateSchema,
});

const weeklyPatternEntrySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  isEnabled: z.boolean(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotDuration: z.number().int().min(15).max(240),
});

const weeklyPatternQuerySchema = z.object({
  consultantId: z.string().trim().optional(),
});

const weeklyPatternUpsertSchema = z.object({
  consultantId: z.string().trim().optional(),
  patterns: z.array(weeklyPatternEntrySchema).min(1).max(7),
});

type WeeklyScheduleConfig = {
  enabled: boolean;
  start: string;
  end: string;
  duration: number;
};

type WeeklyScheduleMap = Record<number, WeeklyScheduleConfig>;

function normalizeConsultantId(value?: string | null) {
  return value?.trim() || "global";
}

function dateKeyToUtcDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function getDateRange(dateKey: string) {
  const start = dateKeyToUtcDate(dateKey);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function timeToMinutes(time: string) {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function buildDefaultSlots(dateKey: string, weeklyPattern: WeeklyScheduleMap) {
  const weekday = dateKeyToUtcDate(dateKey).getUTCDay();
  const config = weeklyPattern[weekday];
  if (!config?.enabled) return [];

  const slots: string[] = [];
  for (
    let current = timeToMinutes(config.start);
    current + config.duration <= timeToMinutes(config.end);
    current += config.duration
  ) {
    slots.push(minutesToTime(current));
  }

  return slots;
}

function getDefaultWeeklySchedule(): WeeklyScheduleMap {
  const map: WeeklyScheduleMap = {};
  for (const [weekday, config] of Object.entries(DEFAULT_WEEKLY_SCHEDULE)) {
    map[Number(weekday)] = {
      enabled: config.enabled,
      start: config.start,
      end: config.end,
      duration: config.duration,
    };
  }

  return map;
}

function extractTimeFromDate(value: Date) {
  return `${value.getUTCHours().toString().padStart(2, "0")}:${value
    .getUTCMinutes()
    .toString()
    .padStart(2, "0")}`;
}

function parseSlotInput(slot: string) {
  const dateMatch = slot.match(/^(\d{4}-\d{2}-\d{2})/);
  const timeMatch = slot.match(/T(\d{2}:\d{2})/);

  const slotDate = new Date(slot);
  if (Number.isNaN(slotDate.getTime())) {
    throw new ActionError("Invalid appointment slot", 400);
  }

  return {
    slotDate,
    dateKey: dateMatch?.[1] ?? slotDate.toISOString().slice(0, 10),
    timeKey: timeMatch?.[1] ?? extractTimeFromDate(slotDate),
  };
}

function mapAvailability(record: {
  id: string;
  consultantId: string;
  date: Date;
  slots: string[];
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...record,
    consultantId: record.consultantId === "global" ? undefined : record.consultantId,
    date: record.date.toISOString().slice(0, 10),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapWeeklyPattern(record: {
  id: string;
  consultantId: string;
  weekday: number;
  isEnabled: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...record,
    consultantId: record.consultantId === "global" ? undefined : record.consultantId,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function getWeeklyPatternMap(consultantId: string): Promise<WeeklyScheduleMap> {
  const base = getDefaultWeeklySchedule();
  const consultantIds = consultantId === "global" ? ["global"] : ["global", consultantId];

  const records = await prisma.availabilityWeeklyPattern.findMany({
    where: { consultantId: { in: consultantIds } },
    orderBy: [{ consultantId: "asc" }, { weekday: "asc" }],
  });

  const merged: WeeklyScheduleMap = { ...base };
  for (const record of records) {
    merged[record.weekday] = {
      enabled: record.isEnabled,
      start: record.startTime,
      end: record.endTime,
      duration: record.slotDuration,
    };
  }

  return merged;
}

export async function listWeeklyPattern(rawQuery: Record<string, unknown>) {
  const query = weeklyPatternQuerySchema.parse(rawQuery);
  const consultantId = normalizeConsultantId(query.consultantId);
  const map = await getWeeklyPatternMap(consultantId);

  const data = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    consultantId: consultantId === "global" ? undefined : consultantId,
    isEnabled: map[weekday]?.enabled ?? false,
    startTime: map[weekday]?.start ?? "09:00",
    endTime: map[weekday]?.end ?? "17:00",
    slotDuration: map[weekday]?.duration ?? 60,
  }));

  return { data };
}

export async function upsertWeeklyPattern(payload: unknown) {
  const input = weeklyPatternUpsertSchema.parse(payload);
  const consultantId = normalizeConsultantId(input.consultantId);
  const uniquePatterns = Array.from(new Map(input.patterns.map((item) => [item.weekday, item])).values());

  if (uniquePatterns.length !== 7) {
    throw new ActionError("Weekly pattern must include exactly 7 weekdays", 400);
  }

  const data = await prisma.$transaction(
    uniquePatterns.map((pattern) =>
      prisma.availabilityWeeklyPattern.upsert({
        where: {
          consultantId_weekday: {
            consultantId,
            weekday: pattern.weekday,
          },
        },
        update: {
          isEnabled: pattern.isEnabled,
          startTime: pattern.startTime,
          endTime: pattern.endTime,
          slotDuration: pattern.slotDuration,
        },
        create: {
          consultantId,
          weekday: pattern.weekday,
          isEnabled: pattern.isEnabled,
          startTime: pattern.startTime,
          endTime: pattern.endTime,
          slotDuration: pattern.slotDuration,
        },
      })
    )
  );

  return {
    data: data.sort((a, b) => a.weekday - b.weekday).map(mapWeeklyPattern),
  };
}

export async function listAvailability(rawQuery: Record<string, unknown>) {
  const query = availabilityQuerySchema.parse(rawQuery);
  const consultantId = normalizeConsultantId(query.consultantId);

  const where: Record<string, unknown> = {
    consultantId,
  };

  if (query.date) {
    where.date = dateKeyToUtcDate(query.date);
  }

  if (!query.includeBlocked) {
    where.isBlocked = false;
  }

  const items = await prisma.availability.findMany({
    where,
    orderBy: { date: "asc" },
  });

  return {
    data: items.map(mapAvailability),
  };
}

export async function getAvailabilityById(id: string) {
  const item = await prisma.availability.findUnique({ where: { id } });
  if (!item) {
    throw new ActionError("Availability not found", 404);
  }
  return mapAvailability(item);
}

export async function upsertAvailability(payload: unknown) {
  const data = setAvailabilitySchema.parse(payload);
  const consultantId = normalizeConsultantId(data.consultantId);
  const date = dateKeyToUtcDate(data.date);

  const item = await prisma.availability.upsert({
    where: {
      consultantId_date: {
        consultantId,
        date,
      },
    },
    update: {
      slots: [...new Set(data.slots)].sort(),
      isBlocked: data.isBlocked ?? false,
    },
    create: {
      consultantId,
      date,
      slots: [...new Set(data.slots)].sort(),
      isBlocked: data.isBlocked ?? false,
    },
  });

  return mapAvailability(item);
}

export async function deleteAvailability(id: string) {
  const existing = await prisma.availability.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new ActionError("Availability not found", 404);
  }

  await prisma.availability.delete({ where: { id } });
  return { message: "Availability deleted" };
}

export async function getAvailableSlots(rawQuery: Record<string, unknown>) {
  const query = slotLookupSchema.parse(rawQuery);
  const consultantId = normalizeConsultantId(query.consultantId);
  const weeklyPattern = await getWeeklyPatternMap(consultantId);
  const availability = await prisma.availability.findUnique({
    where: {
      consultantId_date: {
        consultantId,
        date: dateKeyToUtcDate(query.date),
      },
    },
  });

  if (availability?.isBlocked) {
    return [];
  }

  const baseSlots = availability?.slots?.length
    ? availability.slots
    : buildDefaultSlots(query.date, weeklyPattern);
  const { start, end } = getDateRange(query.date);
  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      slot: {
        gte: start,
        lt: end,
      },
      status: {
        not: "cancelled",
      },
      ...(consultantId === "global" ? {} : { consultantId }),
    },
    select: { slot: true },
  });

  const bookedTimes = new Set(bookedAppointments.map((appointment) => extractTimeFromDate(appointment.slot)));

  return baseSlots.map((time: string) => ({
    id: `${consultantId}:${query.date}:${time}`,
    date: query.date,
    time,
    consultantId: consultantId === "global" ? undefined : consultantId,
    available: !bookedTimes.has(time),
  }));
}

export async function assertSlotIsAvailable(input: { slot: string; consultantId?: string; excludeAppointmentId?: string }) {
  const { slotDate, dateKey, timeKey } = parseSlotInput(input.slot);
  const consultantId = normalizeConsultantId(input.consultantId);
  const slots = await getAvailableSlots({ date: dateKey, consultantId: input.consultantId });
  const matchingSlot = slots.find((item: { time: string; available: boolean }) => item.time === timeKey);

  if (!matchingSlot || !matchingSlot.available) {
    throw new ActionError("This appointment slot is not available", 400);
  }

  const conflicting = await prisma.appointment.findFirst({
    where: {
      id: input.excludeAppointmentId ? { not: input.excludeAppointmentId } : undefined,
      slot: slotDate,
      status: {
        not: "cancelled",
      },
      ...(consultantId === "global" ? {} : { consultantId }),
    },
    select: { id: true },
  });

  if (conflicting) {
    throw new ActionError("This appointment slot has already been booked", 400);
  }
}