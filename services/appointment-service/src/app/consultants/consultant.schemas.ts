import { z } from 'zod';

export const CreateConsultantSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must not exceed 100 characters' }),
  email: z
    .string()
    .email({ message: 'Invalid email address' })
    .max(255, { message: 'Email must not exceed 255 characters' }),
  phone: z
    .string()
    .min(7, { message: 'Phone number must be at least 7 characters' })
    .max(20, { message: 'Phone number must not exceed 20 characters' })
    .optional(),
  bio: z
    .string()
    .max(1000, { message: 'Bio must not exceed 1000 characters' })
    .optional(),
  avatar: z
    .string()
    .url({ message: 'Avatar must be a valid URL' })
    .optional(),
  specializations: z
    .array(z.string().min(1).max(100))
    .max(10, { message: 'Specializations must not exceed 10 items' })
    .optional(),
  showroomId: z
    .string()
    .uuid({ message: 'Invalid showroom ID' })
    .optional(),
});

export const UpdateConsultantSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must not exceed 100 characters' })
    .optional(),
  email: z
    .string()
    .email({ message: 'Invalid email address' })
    .max(255, { message: 'Email must not exceed 255 characters' })
    .optional(),
  phone: z
    .string()
    .min(7, { message: 'Phone number must be at least 7 characters' })
    .max(20, { message: 'Phone number must not exceed 20 characters' })
    .nullable()
    .optional(),
  bio: z
    .string()
    .max(1000, { message: 'Bio must not exceed 1000 characters' })
    .nullable()
    .optional(),
  avatar: z
    .string()
    .url({ message: 'Avatar must be a valid URL' })
    .nullable()
    .optional(),
  specializations: z
    .array(z.string().min(1).max(100))
    .max(10, { message: 'Specializations must not exceed 10 items' })
    .optional(),
  showroomId: z
    .string()
    .uuid({ message: 'Invalid showroom ID' })
    .nullable()
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' },
);

export const ConsultantQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  isActive: z.coerce.boolean().optional(),
  showroomId: z.string().uuid({ message: 'Invalid showroom ID' }).optional(),
  specialization: z.string().max(100).optional(),
  status: z.string().optional(),
  from: z.string().datetime({ message: 'Invalid from date format' }).optional(),
  to: z.string().datetime({ message: 'Invalid to date format' }).optional(),
  search: z.string().max(100).optional(),
}).refine(
  (data) => {
    if (data.from && data.to) {
      return new Date(data.from) <= new Date(data.to);
    }
    return true;
  },
  {
    message: 'From date must be before or equal to to date',
    path: ['from'],
  },
);

export type CreateConsultantDto = z.infer<typeof CreateConsultantSchema>;
export type UpdateConsultantDto = z.infer<typeof UpdateConsultantSchema>;
export type ConsultantQueryDto = z.infer<typeof ConsultantQuerySchema>;