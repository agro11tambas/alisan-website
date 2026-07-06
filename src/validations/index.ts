import * as z from 'zod';

export const loginPhoneSchema = z.object({
  phoneNumber: z.string()
    .min(9, 'WhatsApp number must be at least 9 digits')
    .max(14, 'WhatsApp number must be at most 14 digits')
    .regex(/^(08|628)\d+$/, 'Must be a valid Indonesian WhatsApp number starting with 08 or 628'),
});

export type LoginPhoneFormValues = z.infer<typeof loginPhoneSchema>;

export const loginOtpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
});

export type LoginOtpFormValues = z.infer<typeof loginOtpSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  whatsappNumber: z
    .string()
    .min(9, 'WhatsApp number must be at least 9 digits')
    .max(14, 'WhatsApp number must be at most 14 digits')
    .regex(/^(08|628)\d+$/, 'Must be a valid Indonesian WhatsApp number starting with 08 or 628'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const checkoutSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  whatsappNumber: z
    .string()
    .min(9, 'WhatsApp number must be at least 9 digits')
    .max(14, 'WhatsApp number must be at most 14 digits')
    .regex(/^(08|628)\d+$/, 'Must be a valid Indonesian WhatsApp number starting with 08 or 628'),
  shippingAddress: z.string().min(10, 'Please provide a complete shipping address'),
  notes: z.string().optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
