import ApiResponse from "@/shared/ApiResponse";
import asyncErrorHandler from "@/shared/asyncErrorHandler";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BannerService } from "./banners.services";

// Controller function to create a new Banner
const createBanner = asyncErrorHandler(async (req: Request, res: Response) => {
    const result = await BannerService.createBanner(req);
    ApiResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Banner Successfully Created",
        data: result,
    });
});

// Controller function to update an existing category
const updateBanner = asyncErrorHandler(async (req: Request, res: Response) => {
    const result = await BannerService.updateBanner(req);
    ApiResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Banner successfully updated",
        data: result,
    });
});

// Controller function to get all categories
const getAllBanners = asyncErrorHandler(async (req: Request, res: Response) => {
    const result = await BannerService.getAllBanners(req);
    ApiResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "All Banners fetched",
        data: result,
    });
});

// Controller function to delete a category by ID
const deleteBanners = asyncErrorHandler(
    async (req: Request, res: Response) => {
        const result = await BannerService.deleteBanners(req);

        ApiResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: `${result.message}`,
        });
    }
);

// Controller function to delete a category by ID
const getBannerById = asyncErrorHandler(async (req: Request, res: Response) => {
    const result = await BannerService.getBannerById(req);
    ApiResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Banner Found",
        data: result,
    });
});

// Controller function to upload Banner Images
const uploadBannerImages = asyncErrorHandler(async (req: Request, res: Response) => {
    const result = await BannerService.uploadBannerImages(req);
    ApiResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Images uploaded successfully.",
        data: result,
    });
});

// Controller function to upload Banner Images
const getBannerImages = asyncErrorHandler(async (req: Request, res: Response) => {
    const result = await BannerService.getBannerImages();
    ApiResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Images fetched successfully.",
        data: result,
    });
});

export const bannersController = {
    createBanner,
    updateBanner,
    getAllBanners,
    deleteBanners,
    getBannerById,
    uploadBannerImages,
    getBannerImages
};
