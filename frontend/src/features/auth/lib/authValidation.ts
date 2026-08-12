import { z } from 'zod';

export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'auth.register.validation.fullNameRequired')
      .max(100),
    username: z
      .string()
      .trim()
      .min(3, 'auth.register.validation.usernameRequired')
      .max(50)
      .regex(/^[a-zA-Z0-9_.-]+$/, 'auth.register.validation.usernameInvalid'),
    email: z
      .string()
      .trim()
      .min(1, 'auth.register.validation.emailRequired')
      .email('auth.register.validation.emailInvalid'),
    phone: z
      .string()
      .trim()
      .min(1, 'auth.register.validation.mobileRequired')
      .regex(/^(?:\+91|91)?[6-9]\d{9}$/, 'auth.register.validation.mobileInvalid'),
    role: z
      .enum(['FARMER', 'FARM_OWNER', 'ADMIN', 'FARM_MANAGER', 'SUPERVISOR', 'WORKER', 'VIEWER']),
    password: z
      .string()
      .min(8, 'auth.register.validation.passwordRequired')
      .regex(passwordRegex, 'auth.register.validation.passwordWeak'),
    confirmPassword: z
      .string()
      .min(1, 'auth.register.validation.confirmPasswordRequired'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.register.validation.passwordMismatch',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  username: z.string().min(1, 'Username, email, or mobile number is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .regex(
        passwordRegex,
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
      ),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address format').optional().or(z.literal('')),
  phone: z.string().optional(),
  preferredLanguage: z.string().optional(),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
