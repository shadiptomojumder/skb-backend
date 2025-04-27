import { z } from "zod";

// Product validation schema
export const productSchema = z.object({
    name: z
        .string()
        .min(1, { message: "Product name is required" })
        .max(255, { message: "Product name must be less than 255 characters" }),

    price: z.any(),

    discount: z
        .number()
        .min(0, { message: "Discount must be between 0 and 100" })
        .max(100, { message: "Discount must be between 0 and 100" })
        .optional(), // Discount is optional

    finalPrice: z
        .number()
        .positive({ message: "Final price must be a positive number" })
        .optional(),

    quantity: z
        .string()
        .min(1, { message: "Quantity is required" })
        .max(50, { message: "Quantity should not exceed 50 characters" }),

    description: z
        .string()
        .max(1000, { message: "Description should not exceed 1000 characters" })
        .optional(),

    stock: z
        .number()
        .min(0, { message: "Stock must be a positive number" })
        .optional(),

    images: z.any().optional(),

    sku: z
        .string()
        .min(1, { message: "SKU is required" })
        .max(50, { message: "SKU should not exceed 50 characters" })
        .optional(),

    isActive: z.boolean().optional(),
    isWeekendDeal: z.boolean().optional(),
    isFeatured: z.boolean().optional(),

    category: z.string().min(1, { message: "Category is required" }),
});


// Product Update Schema (to handle updates)
export const productUpdateSchema = productSchema.partial().extend({
    // Allow partial updates
});
