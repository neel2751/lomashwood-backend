"use server";

import { Prisma } from "@generated/prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";

import { ActionError, calculatePagination, paginationQuerySchema } from "@servers/_shared";
import { sendSystemEmail } from "@servers/_email";

const reminderTypeSchema = z.enum(["email", "sms"]);
const reminderStatusSchema = z.enum(["pending", "sent", "failed"]);

const createReminderSchema = z.object({
  appointmentId: z.string().min(1),
  type: reminderTypeSchema,
  scheduledAt: z.string().datetime().or(z.string().min(1)),
  status: reminderStatusSchema.optional(),
});

const updateReminderSchema = createReminderSchema.partial();

const querySchema = paginationQuerySchema.extend({
  appointmentId: z.string().optional(),
  type: reminderTypeSchema.optional(),
  status: reminderStatusSchema.optional(),
});

function reminderWhereFromQuery(query: z.infer<typeof querySchema>): Prisma.ReminderWhereInput {
  const where: Prisma.ReminderWhereInput = {
    type: query.type,
    status: query.status,
    appointmentId: query.appointmentId,
  };

  return where;
}

export async function listReminders(rawQuery: Record<string, unknown>) {
  const query = querySchema.parse(rawQuery);
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const where = reminderWhereFromQuery(query);

  const [total, data] = await Promise.all([
    prisma.reminder.count({ where }),
    prisma.reminder.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      skip,
      take: limit,
      include: {
        appointment: {
          select: {
            id: true,
            customerName: true,
            customerEmail: true,
            type: true,
            slot: true,
          },
        },
      },
    }),
  ]);

  return {
    data,
    ...calculatePagination(total, page, limit),
  };
}

export async function getReminderById(id: string) {
  const reminder = await prisma.reminder.findUnique({
    where: { id },
    include: {
      appointment: {
        select: {
          id: true,
          customerName: true,
          customerEmail: true,
          type: true,
          slot: true,
        },
      },
    },
  });
  if (!reminder) {
    throw new ActionError("Reminder not found", 404);
  }
  return reminder;
}

export async function getRemindersByAppointment(appointmentId: string, rawQuery: Record<string, unknown>) {
  const query = querySchema.parse(rawQuery);
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const [total, data] = await Promise.all([
    prisma.reminder.count({ where: { appointmentId } }),
    prisma.reminder.findMany({
      where: { appointmentId },
      orderBy: { scheduledAt: "asc" },
      skip,
      take: limit,
      include: {
        appointment: {
          select: {
            id: true,
            customerName: true,
            customerEmail: true,
            type: true,
            slot: true,
          },
        },
      },
    }),
  ]);

  return {
    data,
    ...calculatePagination(total, page, limit),
  };
}

export async function createReminder(payload: unknown) {
  const data = createReminderSchema.parse(payload);

  const appointment = await prisma.appointment.findUnique({
    where: { id: data.appointmentId },
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

  const reminder = await prisma.reminder.create({
    data: {
      ...data,
      scheduledAt: new Date(data.scheduledAt),
      status: data.status || "pending",
    },
    include: {
      appointment: {
        select: {
          id: true,
          customerName: true,
          customerEmail: true,
          type: true,
          slot: true,
        },
      },
    },
  });

  return reminder;
}

export async function updateReminder(id: string, payload: unknown) {
  const data = updateReminderSchema.parse(payload);

  const existing = await prisma.reminder.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new ActionError("Reminder not found", 404);
  }

  const updateData: Prisma.ReminderUpdateInput = {
    ...data,
  };

  if (data.scheduledAt) {
    updateData.scheduledAt = new Date(data.scheduledAt);
  }

  return prisma.reminder.update({
    where: { id },
    data: updateData,
    include: {
      appointment: {
        select: {
          id: true,
          customerName: true,
          customerEmail: true,
          type: true,
          slot: true,
        },
      },
    },
  });
}

export async function deleteReminder(id: string) {
  const existing = await prisma.reminder.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new ActionError("Reminder not found", 404);
  }

  return prisma.reminder.delete({ where: { id } });
}

export async function sendReminder(id: string) {
  const reminder = await prisma.reminder.findUnique({
    where: { id },
    include: {
      appointment: {
        select: {
          id: true,
          customerName: true,
          customerEmail: true,
          type: true,
          slot: true,
        },
      },
    },
  });

  if (!reminder) {
    throw new ActionError("Reminder not found", 404);
  }

  if (!reminder.appointment) {
    throw new ActionError("Associated appointment not found", 404);
  }

  const appointment = reminder.appointment;

  if (reminder.type === "email") {
    const typeLabel = appointment.type === "home" ? "Home Visit" : appointment.type === "online" ? "Online Consultation" : "Showroom Visit";
    const dateTime = appointment.slot.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const subject = "Appointment reminder - Lomash Wood";
    const body = `Hi ${appointment.customerName}, this is a reminder for your ${typeLabel} appointment on ${dateTime}. Please confirm if you'll be attending.`;

    const emailResult = await sendSystemEmail({
      to: appointment.customerEmail,
      subject,
      text: body,
      html: `<p>${body}</p>`,
    });

    if (emailResult.sent) {
      const sentReminder = await prisma.reminder.update({
        where: { id },
        data: {
          sentAt: new Date(),
          status: "sent",
        },
        include: {
          appointment: {
            select: {
              id: true,
              customerName: true,
              customerEmail: true,
              type: true,
              slot: true,
            },
          },
        },
      });

      return {
        message: "Reminder email sent successfully",
        reminder: sentReminder,
        sent: true,
      };
    } else {
      await prisma.reminder.update({
        where: { id },
        data: {
          status: "failed",
        },
      });

      return {
        message: `Failed to send reminder email: ${emailResult.reason}`,
        sent: false,
      };
    }
  }

  // SMS handling would go here if needed
  return {
    message: "Reminder type not yet implemented",
    sent: false,
  };
}
