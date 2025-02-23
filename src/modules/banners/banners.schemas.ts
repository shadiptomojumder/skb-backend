import { z } from 'zod';

// banner validation schema
export const bannerSchema = z.object({
  title: z
    .string()
    .min(3, "Banner title must be at least 3 characters")
    .max(50, "Banner title not more than 50 characters")
    .trim(),
  image: z.any().optional()
});

// Banner Update Schema (to handle updates)
export const bannerUpdateSchema = bannerSchema.partial().extend({
  // Allow partial updates
});


