import { baseUserSchema } from "@/modules/user/user.schemas";
import { z } from "zod";

// Schema for validating signup requests
export const signupRequestSchema = z.object({
  body: z.object(baseUserSchema),
});

// Schema for validating signup data in auth services
export const signupDataSchema = z.object(baseUserSchema);

// Schema for validating login data in auth services
export const loginDataSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

// Schema for validating login requests
export const loginRequestSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" }),
  }),
});

export const AuthValidation = {
  loginRequestSchema,
};
