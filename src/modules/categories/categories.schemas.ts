import { z } from 'zod';

// Category validation schema
export const categorySchema = z.object({
  title: z
    .string()
    .min(3, "Category title must be at least 3 characters")
    .max(50, "Category title not more than 50 characters")
    .trim(),
  value: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9_]+$/, "Value must be lowercase with underscores only") // Enforces proper format
    .trim()
    .optional(),
  logo: z.any().optional(),
  thumbnail: z.any().optional()
});

// Category Update Schema (to handle updates)
export const categoryUpdateSchema = categorySchema.partial().extend({
  // Allow partial updates
});


