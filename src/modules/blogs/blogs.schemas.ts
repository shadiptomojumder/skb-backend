import { z } from "zod";

// banner validation schema
export const blogSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    image: z.any().optional(),
    isActive: z.boolean().optional(),
});

// Banner Update Schema (to handle updates)
export const bannerUpdateSchema = blogSchema.partial().extend({
    // Allow partial updates
});
