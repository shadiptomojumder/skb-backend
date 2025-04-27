import * as z from "zod";

// General user schema for all user operations
export const userSchema = z.object({
    firstame: z
        .string()
        .min(1, { message: "First name is required" })
        .max(150, { message: "First name cannot exceed 255 characters" }),
    lastame: z
        .string()
        .min(1, { message: "Last name is required" })
        .max(150, { message: "Last name cannot exceed 255 characters" }),
    email: z.string().email().trim().toLowerCase().optional(),
    phone: z
        .string()
        .optional()
        .nullable()
        .refine((value) => !value || /^\d+$/.test(value), {
            message: "Phone number must contain only digits",
        }),
    address: z.string().optional().nullable(),
    googleId: z.string().optional().nullable(),
    role: z.enum(["USER", "ADMIN", "SELLER"]).default("USER"),
    avatar: z.string().optional().nullable(),
    otp: z.number().optional().nullable(),
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long" }),
    refreshToken: z.string().optional().nullable(),
});

// Update user schema by making all fields optional
export const updateUserSchema = userSchema.partial().extend({});

// User Interface
export interface IUser {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    googleId: string;
    role: string;
    avatar: string;
    otp: number;
    refreshToken: string;
}
