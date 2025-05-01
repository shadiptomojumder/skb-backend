import ApiResponse from "@/shared/ApiResponse";
import asyncErrorHandler from "@/shared/asyncErrorHandler";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BlogService } from "./blogs.services";

// Controller function to create a new blog
const createBlog = asyncErrorHandler(async (req: Request, res: Response) => {
    const result = await BlogService.createBlog(req);
    ApiResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Blog successfully created",
        data: result,
    });
});

// Controller function to update an existing blog
const updateBlog = asyncErrorHandler(async (req: Request, res: Response) => {
    const result = await BlogService.updateBlog(req);
    ApiResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Blog successfully updated",
        data: result,
    });
});

// Controller function to get all blogs
const getAllBlogs = asyncErrorHandler(async (req: Request, res: Response) => {
    const result = await BlogService.getAllBlogs(req);
    ApiResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "All blogs fetched successfully",
        data: result,
    });
});

// Controller function to get a specific blog by ID
const getBlogById = asyncErrorHandler(async (req: Request, res: Response) => {
    const result = await BlogService.getBlogById(req);
    ApiResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Blog found",
        data: result,
    });
});

// Controller function to delete a single blog by ID
const deleteSingleBlog = asyncErrorHandler(async (req: Request, res: Response) => {
    const result = await BlogService.deleteSingleBlog(req);
    ApiResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Blog successfully deleted",
        data: result,
    });
});

// Controller function to delete multiple blogs
const deleteMultipleBlogs = asyncErrorHandler(async (req: Request, res: Response) => {
    const result = await BlogService.deleteMultipleBlogs(req);
    ApiResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Blogs successfully deleted",
        data: result,
    });
});

export const blogsController = {
    createBlog,
    updateBlog,
    getAllBlogs,
    getBlogById,
    deleteSingleBlog,
    deleteMultipleBlogs,
};