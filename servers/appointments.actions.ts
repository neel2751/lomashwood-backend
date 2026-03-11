"use server";

import { Prisma } from "@generated/prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";

import { ActionError, calculatePagination, paginationQuerySchema, parseBoolean, parseDate } from "@servers/_shared";
import { assertSlotIsAvailable } from "@servers/availability.actions";
import { sendSystemEmail } from "@servers/_email";

const appointmentTypeSchema = z.enum(["home", "online", "showroom"]);
const appointmentStatusSchema = z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]);
const appointmentEmailTypeSchema = z.enum(["confirmation", "reminder", "missed"]);

const createAppointmentSchema = z.object({
  type: appointmentTypeSchema,
  forKitchen: z.boolean().default(false),
  forBedroom: z.boolean().default(false),
  customerId: z.string().optional(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(1),
  postcode: z.string().min(1),
  address: z.string().min(1),
  slot: z.string().datetime().or(z.string().min(1)),
  status: appointmentStatusSchema.optional(),
  consultantId: z.string().optional(),
  consultantName: z.string().optional(),
  showroomId: z.string().optional(),
  showroomName: z.string().optional(),
  notes: z.string().optional(),
});

const updateAppointmentSchema = createAppointmentSchema.partial();

const querySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  type: appointmentTypeSchema.optional(),
  status: appointmentStatusSchema.optional(),
  consultantId: z.string().optional(),
  forKitchen: z.string().optional(),
  forBedroom: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

function appointmentWhereFromQuery(query: z.infer<typeof querySchema>): Prisma.AppointmentWhereInput {
  const where: Prisma.AppointmentWhereInput = {
    type: query.type,
    status: query.status,
    consultantId: query.consultantId,
  };

  const forKitchen = parseBoolean(query.forKitchen);
  if (forKitchen !== undefined) {
    where.forKitchen = forKitchen;
  }

  const forBedroom = parseBoolean(query.forBedroom);
  if (forBedroom !== undefined) {
    where.forBedroom = forBedroom;
  }

  if (query.search) {
    where.OR = [
      { customerName: { contains: query.search, mode: "insensitive" } },
      { customerEmail: { contains: query.search, mode: "insensitive" } },
      { customerPhone: { contains: query.search, mode: "insensitive" } },
      { postcode: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const startDate = parseDate(query.startDate);
  const endDate = parseDate(query.endDate);
  if (startDate || endDate) {
    where.slot = {
      gte: startDate,
      lte: endDate,
    };
  }

  return where;
}

function formatAppointmentDate(slot: Date) {
  return slot.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildEmailCopy(
  appointment: {
    customerName: string;
    type: "home" | "online" | "showroom";
    slot: Date;
  },
  emailType: "confirmation" | "reminder" | "missed"
) {
  const dateTime = formatAppointmentDate(appointment.slot);
  const typeLabel = appointment.type === "home" ? "Home Visit" : appointment.type === "online" ? "Online Consultation" : "Showroom Visit";

  if (emailType === "confirmation") {
    return {
      subject: "Your appointment is confirmed - Lomash Wood",
      title: "Appointment Confirmed",
      body: `Hi ${appointment.customerName}, your ${typeLabel} appointment is confirmed for ${dateTime}.`,
    };
  }

  if (emailType === "reminder") {
    return {
      subject: "Appointment reminder - Lomash Wood",
      title: "Appointment Reminder",
      body: `Hi ${appointment.customerName}, this is a reminder for your ${typeLabel} appointment on ${dateTime}.`,
    };
  }

  return {
    subject: "We missed you - Lomash Wood",
    title: "We Missed You",
    body: `Hi ${appointment.customerName}, we noticed your ${typeLabel} appointment at ${dateTime} was missed. Please contact us to reschedule.`,
  };
}

export async function sendAppointmentEmail(id: string, rawType: unknown) {
  const emailType = appointmentEmailTypeSchema.parse(rawType);
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      customerName: true,
      customerEmail: true,
      type: true,
      slot: true,
    },
  });

  if (!appointment) {
    throw new ActionError("Appointment not found", 404);
  }

  const copy = buildEmailCopy(appointment, emailType);
  const emailResult = await sendSystemEmail({
    to: appointment.customerEmail,
    subject: copy.subject,
    text: copy.body,
    html: `<p>${copy.body}</p>`,
  });

  if (emailResult.sent) {
    const sentAt = new Date();
    await prisma.appointment.update({
      where: { id },
      data:
        emailType === "confirmation"
          ? { confirmationEmailSentAt: sentAt }
          : emailType === "reminder"
            ? { reminderEmailSentAt: sentAt }
            : { missedEmailSentAt: sentAt },
    });
  }

  return {
    message: `${copy.title} email processed`,
    type: emailType,
    sent: emailResult.sent,
  };
}

export async function listAppointments(rawQuery: Record<string, unknown>) {
  const query = querySchema.parse(rawQuery);
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const where = appointmentWhereFromQuery(query);

  const [total, data] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      orderBy: { slot: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    data,
    ...calculatePagination(total, page, limit),
  };
}

export async function getAppointmentById(id: string) {
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) {
    throw new ActionError("Appointment not found", 404);
  }
  return appointment;
}

export async function createAppointment(payload: unknown) {
  const data = createAppointmentSchema.parse(payload);

  if (!data.forKitchen && !data.forBedroom) {
    throw new ActionError("At least one of forKitchen or forBedroom must be true", 400);
  }

  const customer = data.customerId
    ? await prisma.customer.findUnique({ where: { id: data.customerId }, select: { id: true } })
    : null;

  if (data.customerId && !customer) {
    throw new ActionError("Customer not found", 404);
  }

  await assertSlotIsAvailable({
    slot: data.slot,
    consultantId: data.consultantId,
  });

  const appointment = await prisma.$transaction(async (tx) => {
    const created = await tx.appointment.create({
      data: {
        ...data,
        slot: new Date(data.slot),
      },
    });

    if (data.customerId) {
      await tx.customer.update({
        where: { id: data.customerId },
        data: { appointmentCount: { increment: 1 } },
      });
    }

    return created;
  });

  // Do not fail appointment creation if SMTP is unavailable.
  try {
    await sendAppointmentEmail(appointment.id, "confirmation");
  } catch (error) {
    console.error("Failed to send appointment confirmation email", {
      appointmentId: appointment.id,
      error,
    });
  }

  return appointment;
}

export async function updateAppointment(id: string, payload: unknown) {
  const data = updateAppointmentSchema.parse(payload);

  const existing = await prisma.appointment.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new ActionError("Appointment not found", 404);
  }

  if (data.forKitchen === false && data.forBedroom === false) {
    throw new ActionError("At least one of forKitchen or forBedroom must be true", 400);
  }

  const slotToValidate = data.slot;
  const consultantIdToValidate = data.consultantId;

  if (slotToValidate) {
    await assertSlotIsAvailable({
      slot: slotToValidate,
      consultantId: consultantIdToValidate,
      excludeAppointmentId: id,
    });
  }

  const updateData: Prisma.AppointmentUpdateInput = {
    ...data,
  };

  if (data.slot) {
    updateData.slot = new Date(data.slot);
  }

  return prisma.appointment.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteAppointment(id: string) {
  const existing = await prisma.appointment.findUnique({
    where: { id },
    select: { id: true, customerId: true },
  });

  if (!existing) {
    throw new ActionError("Appointment not found", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.appointment.delete({ where: { id } });

    if (existing.customerId) {
      await tx.customer.update({
        where: { id: existing.customerId },
        data: { appointmentCount: { decrement: 1 } },
      });
    }
  });

  return { message: "Appointment deleted" };
}
