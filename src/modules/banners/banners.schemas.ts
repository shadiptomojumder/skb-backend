import { z } from "zod";

// banner validation schema
export const bannerSchema = z.object({
    order: z.number().optional(),
    image: z.any().optional(),
    isActive: z.boolean().optional(),
});

// Banner Update Schema (to handle updates)
export const bannerUpdateSchema = bannerSchema.partial().extend({
    // Allow partial updates
});
