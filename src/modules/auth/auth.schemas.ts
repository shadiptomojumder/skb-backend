import { z } from "zod";

// Regex patterns for phone number validation Bangladesh only
const bdPhoneRegex = /^(?:\+8801|8801|01)[3-9]\d{8}$/;

// Schema for validating signup data in auth services
export const signupDataSchema = z
    .object({
        firstName: z.string().nonempty("First name is required"),
        lastName: z.string().nonempty("Last name is required"),
        email: z.string().email("Invalid email address").optional(),
        phone: z
            .string()
            .optional()
            .nullable()
            .refine((value) => !value || bdPhoneRegex.test(value), {
                message:
                    "Invalid Bangladeshi phone number.",
            }),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters long")
            .nonempty("Password is required"),
    })
    .refine((data) => data.email || data.phone, {
        message: "Either email or phone must be provided",
        path: ["email", "phone"], // Specify the path to the fields
    });

// Schema for validating login data in auth services
export const loginDataSchema = z
    .object({
        email: z
            .string()
            .email({ message: "Invalid email address" })
            .optional(),
        phone: z
            .string()
            .optional()
            .nullable()
            .refine((value) => !value || bdPhoneRegex.test(value), {
                message:
                    "Invalid Bangladeshi phone number.",
            }),
        password: z
            .string()
            .min(8, { message: "Password must be at least 8 characters long" }),
    })
    .refine((data) => data.email || data.phone, {
        message: "Either email or phone must be provided",
        path: ["email", "phone"], // Specify the path to the fields
    });
