import ApiResponse from "@/shared/ApiResponse";
import asyncErrorHandler from "@/shared/asyncErrorHandler";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CategoryService } from "./categories.services";

// Controller function to create a new category
const createCategory = asyncErrorHandler(
    async (req: Request, res: Response) => {
        const result = await CategoryService.createCategory(req);
        ApiResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Category created successfully",
            data: result,
        });
    }
);

// Controller function to update an existing category
const updateCategory = asyncErrorHandler(
    async (req: Request, res: Response) => {
        const result = await CategoryService.updateCategory(req);
        ApiResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Category updated successfully",
            data: result,
        });
    }
);

// Controller function to get all categories
const getAllCategory = asyncErrorHandler(
    async (req: Request, res: Response) => {
        const result = await CategoryService.getAllCategory(req);
        ApiResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Categories retrieved successfully",
            data: result,
        });
    }
);

// Controller function to delete a category by ID
const deleteCategory = asyncErrorHandler(
    async (req: Request, res: Response) => {
        const result = await CategoryService.deleteCategory(req);

        ApiResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: `${result.message}`,
        });
    }
);

// Controller function to delete a category by ID
const getCategoryById = asyncErrorHandler(
    async (req: Request, res: Response) => {
        const result = await CategoryService.getCategoryById(req);
        ApiResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Category details retrieved successfully",
            data: result,
        });
    }
);

export const categoriesController = {
    createCategory,
    updateCategory,
    getAllCategory,
    deleteCategory,
    getCategoryById,
};
