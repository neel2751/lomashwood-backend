import { z } from 'zod';


const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );


const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must not exceed 255 characters')
  .toLowerCase()
  .trim();



const phoneSchema = z
  .string()
  .regex(
    /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
    'Invalid phone number format'
  )
  .optional();


export const RegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .trim(),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .trim(),
  phone: phoneSchema,
});

export type RegisterInput = z.infer<typeof RegisterSchema>;


export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;


export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;


export const ForgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;


export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;


export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;


export const ResendVerificationSchema = z.object({
  email: emailSchema,
});

export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;


export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;


export const UpdateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .trim()
    .optional(),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .trim()
    .optional(),
  phone: phoneSchema,
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;


export const EnableTwoFactorSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export type EnableTwoFactorInput = z.infer<typeof EnableTwoFactorSchema>;

export const VerifyTwoFactorSchema = z.object({
  code: z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d+$/, 'Verification code must contain only digits'),
});

export type VerifyTwoFactorInput = z.infer<typeof VerifyTwoFactorSchema>;


export const SocialAuthSchema = z.object({
  provider: z.enum(['google', 'facebook', 'apple'], {
    errorMap: () => ({ message: 'Invalid provider' }),
  }),
  accessToken: z.string().min(1, 'Access token is required'),
});

export type SocialAuthInput = z.infer<typeof SocialAuthSchema>;


export const DeleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmation: z
    .string()
    .regex(/^DELETE$/, 'Please type DELETE to confirm account deletion'),
});

export type DeleteAccountInput = z.infer<typeof DeleteAccountSchema>;


export const AuthSchemas = {
  Register: RegisterSchema,
  Login: LoginSchema,
  RefreshToken: RefreshTokenSchema,
  ForgotPassword: ForgotPasswordSchema,
  ResetPassword: ResetPasswordSchema,
  VerifyEmail: VerifyEmailSchema,
  ResendVerification: ResendVerificationSchema,
  ChangePassword: ChangePasswordSchema,
  UpdateProfile: UpdateProfileSchema,
  EnableTwoFactor: EnableTwoFactorSchema,
  VerifyTwoFactor: VerifyTwoFactorSchema,
  SocialAuth: SocialAuthSchema,
  DeleteAccount: DeleteAccountSchema,
} as const;