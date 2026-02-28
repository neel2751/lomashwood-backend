import { z } from "zod";

export const availabilitySchema = z.object({
  consultantId: z.string().min(1, "Consultant is required"),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  slotDurationMinutes: z.coerce.number().int().min(15, "Minimum slot duration is 15 minutes"),
  isActive: z.boolean().default(true),
});

export type AvailabilityFormValues = z.infer<typeof availabilitySchema>;