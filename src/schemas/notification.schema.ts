import { z } from "zod";

export const notificationChannelSchema = z.enum(["email", "sms", "push"]);

export const sendNotificationSchema = z.object({
  channel: notificationChannelSchema,
  recipientIds: z.array(z.string()).min(1, "At least one recipient is required"),
  templateId: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().min(1, "Message body is required"),
  scheduledAt: z.string().optional(),
});

export type SendNotificationFormValues = z.infer<typeof sendNotificationSchema>;