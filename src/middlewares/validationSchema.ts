import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import ApiResponse from "@/shared/ApiResponse";

// Validation middleware
export const validateSchema =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    // parse request body
    const { success, error } = schema.safeParse(req.body);

    // handle non-compliant request body
    if (!success) {
      ApiResponse(res, {
        statusCode: 200,
        success: false,
        message: error.errors
          .map((t) => `${t.path[0] ?? ""}: ${t.message}`)
          .join(", "),
      });
      next(error);
    }

    next();
  };
