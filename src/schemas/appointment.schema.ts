import { z } from "zod";

export const appointmentTypeSchema = z.enum([
  "home_measurement",
  "online",
  "showroom",
]);

export const appointmentSchema = z.object({
  type: appointmentTypeSchema,
  forKitchen: z.boolean().default(false),
  forBedroom: z.boolean().default(false),
  customerName: z.string().min(1, "Name is required"),
  customerPhone: z.string().min(1, "Phone number is required"),
  customerEmail: z.string().email("Invalid email address"),
  customerPostcode: z.string().min(1, "Postcode is required"),
  customerAddress: z.string().min(1, "Address is required"),
  slotDate: z.string().min(1, "Date is required"),
  slotTime: z.string().min(1, "Time is required"),
  consultantId: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => data.forKitchen || data.forBedroom, {
  message: "At least one of Kitchen or Bedroom must be selected",
  path: ["forKitchen"],
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;