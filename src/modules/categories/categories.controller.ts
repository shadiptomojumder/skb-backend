import ApiResponse from "@/shared/ApiResponse";
import asyncErrorHandler from "@/shared/asyncErrorHandler";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CategoryService } from "./categories.services";

// Controller function to create a new category
const createCategory = asyncErrorHandler(
    async (req: Request, res: Response) => {
        const category = await CategoryService.createCategory(req);
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
        const category = await CategoryService.updateCategory(req);
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
        const category = await CategoryService.getAllCategory(req);
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
        const result = await CategoryService.deleteCategory(req);

        ApiResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: `${result.message}`,
        });
    }
);

// Controller function to delete a category by ID
const singleCategory = asyncErrorHandler(
    async (req: Request, res: Response) => {
        const id = req.params.id;
        const category = await CategoryService.getSingleCategory(id);
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
    singleCategory,
};
