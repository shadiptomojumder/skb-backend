import * as z from 'zod';

// Define the base schema with common fields
export const baseUserSchema = {
  fullname: z
    .string()
    .min(1, { message: 'Full name is required' })
    .max(255, { message: 'Full name cannot exceed 255 characters' }),
  email: z
    .string()
    .email({ message: 'Invalid email address' }),
  phone: z
    .string()
    .optional()
    .nullable()
    .refine(
      (value) => !value || /^\d+$/.test(value),
      { message: 'Phone number must contain only digits' }
    ),
  address: z.string().optional().nullable(),
  googleId: z.string().optional().nullable(),
  role: z
    .enum(['USER', 'ADMIN', 'SELLER'])
    .default('USER'),
  avatar: z.string().optional().nullable(),
  otp: z.number().optional().nullable(),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' }),
  refreshToken: z.string().optional().nullable(),
};


// User schema for createUser request sanitation/validation purposes only
export const createUser = z.object({
  body: z.object(baseUserSchema),
});

// General user schema for all user operations
export const userSchema = z.object(baseUserSchema);

// Update user schema by making all fields optional
export const updateUserSchema = z.object({
  body: z.object(baseUserSchema).partial(),
});

// Schema for getting one user by ID
const getOneUser = z.object({
  params: z.object({
    id: z.number(),
  }),
});

export const UserValidation = {
  createUser,
  updateUserSchema,
  getOneUser,
};
