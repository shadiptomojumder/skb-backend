import ApiResponse from "@/shared/ApiResponse";
import asyncErrorHandler from "@/shared/asyncErrorHandler";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ProductService } from "./categories.services";
import ApiError from "@/errors/ApiError";

// Controller function to create a new category
const createCategory = asyncErrorHandler(
    async (req: Request, res: Response) => {
        const category = await ProductService.createCategory(req);
        ApiResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Category created",
            data: category,
        });
    }
);

// Controller function to update an existing category
const updateCategory = asyncErrorHandler(
    async (req: Request, res: Response) => {
        // Check if the request body is empty
        if (Object.keys(req.body).length === 0 && !req.file) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "No data or file provided");
        }
        const category = await ProductService.updateCategory(req);
        ApiResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Category successfully updated",
            data: category,
        });
    }
);

// Controller function to get all categories
const getAllCategory = asyncErrorHandler(
    async (req: Request, res: Response) => {
        const category = await ProductService.getAllCategory(req);
        ApiResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "All category fetched",
            data: category,
        });
    }
);

// Controller function to delete a category by ID
const deleteCategory = asyncErrorHandler(
    async (req: Request, res: Response) => {
        const id = req.params.id;
        const category = await ProductService.deleteCategory(id);
        ApiResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Category deleted successfully",
            data: category,
        });
    }
);

// Controller function to delete a category by ID
const singleCategory = asyncErrorHandler(
    async (req: Request, res: Response) => {
        const id = req.params.id;
        const category = await ProductService.getSingleCategory(id);
        ApiResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Category update successfully",
            data: category,
        });
    }
);

export const categoriesController = {
    createCategory,
    updateCategory,
    getAllCategory,
    deleteCategory,
    singleCategory
};
