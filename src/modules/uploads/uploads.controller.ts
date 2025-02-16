import ApiResponse from "@/shared/ApiResponse";
import asyncErrorHandler from "@/shared/asyncErrorHandler";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

// Controller function to create a new category
const uploadFiles = asyncErrorHandler(async (req: Request, res: Response) => {
    console.log("The Request is:", req);
    console.log("The Request.Files is:", req.files);

    ApiResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Category created",
        data: {},
    });
});

export const UploadController = {
    uploadFiles,
};
