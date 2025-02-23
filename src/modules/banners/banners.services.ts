import {
    deleteFromCloudinary,
    uploadSingleOnCloudinary,
} from "@/shared/cloudinary";
import { extractCloudinaryPublicId } from "@/shared/extractCloudinaryPublicId";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiError";

import { deleteLocalFiles } from "@/shared/deleteLocalFiles";
import mongoose from "mongoose";
import Category from "../categories/categories.models";
import Banner from "./banners.models";
import { bannerSchema, bannerUpdateSchema } from "./banners.schemas";

// Function to create a new Banner
const createBanner = async (req: Request) => {
    try {
        // Validate the request body against the Banner schema
        const parseBody = bannerSchema.safeParse(req.body);
        const file = req.file as Express.Multer.File;
        // Check if the Banner image is provided
        if (!file) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Banner must have an image."
            );
        }

        // If validation fails, collect error messages and throw a BAD_REQUEST error
        if (!parseBody.success) {
            const errorMessages: string = parseBody.error.errors
                .map((error) => error.message)
                .join(",");
            deleteLocalFiles(file.path);
            throw new ApiError(StatusCodes.BAD_REQUEST, errorMessages);
        }

        // Check if a Banner with the same title already exists
        const existingBanner = await Banner.findOne({
            title: parseBody.data.title,
        });
        if (existingBanner) {
            // Delete the locally stored file before throwing an error
            deleteLocalFiles(file.path);
            throw new ApiError(
                StatusCodes.CONFLICT,
                "Banner with this title already exists"
            );
        }

        // Upload the thumbnail image to Cloudinary
        let imageUrl = "";

        if (req.file) {
            const result = await uploadSingleOnCloudinary(file.path, "banners");
            imageUrl = result?.secure_url || "";
        }

        // console.log("The Banner imageUrl is: ", imageUrl);

        // Create a new Banner in the database
        const banner = new Banner({
            ...parseBody.data,
            image: imageUrl,
        });

        console.log("The created Banner", banner);

        await banner.save();

        return banner;
    } catch (error) {
        console.log("The createBanner Error is:", error);

        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

// Function to update an existing Banner
const updateBanner = async (req: Request) => {
    try {
        // Banner Id
        const { bannerId } = req.params;

        // Validate the request body against the Banner update schema
        const parseBody = bannerUpdateSchema.safeParse(req.body);

        const file = req.file as Express.Multer.File;

        // If validation fails, collect error messages and throw a BAD_REQUEST error
        if (!parseBody.success) {
            const errorMessages = parseBody.error.errors
                .map((error) => error.message)
                .join(",");
            deleteLocalFiles(file.path);
            throw new ApiError(StatusCodes.BAD_REQUEST, errorMessages);
        }

        // Check if a Banner with the same title or id already exists
        const existingBanner = await Banner.findOne({
            title: parseBody.data.title,
            _id: { $ne: bannerId },
        });
        if (existingBanner) {
            // Delete the locally stored file before throwing an error
            deleteLocalFiles(file.path);
            throw new ApiError(
                StatusCodes.CONFLICT,
                "Banner with this title already exists"
            );
        }

        // Find and update banner (without modifying image)
        const banner = await Banner.findByIdAndUpdate(
            bannerId,
            parseBody.data,
            { new: true }
        );
        if (!banner) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Banner not found");
        }

        // If an image is uploaded, update the image field
        let imageUrl = "";
        if (file) {
            const result = await uploadSingleOnCloudinary(file.path, "banners");
            imageUrl = result?.secure_url;
        }

        // Update the banner if new image is provided
        banner.image = imageUrl;
        await banner.save();

        // console.log("The banner imageUrl is: ", imageUrl);
        // console.log("the updated banner:", banner);

        return banner;
    } catch (error) {
        console.log("Update Banner Error: ", error);

        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

// Function to get all banners
const getAllBanners = async (req: Request) => {
    try {
        // Retrieve all banners with all fields from the database
        const banners = await Banner.find();
        if (!banners) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "banners not found!!");
        }

        return banners;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

// Function to get a single banner by ID
const getBannerById = async (req: Request) => {
    try {
        // Banner Id
        const { bannerId } = req.params;

        // ✅ Check if bannerId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(bannerId)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid banner ID");
        }

        // Retrieve the banner with the specified ID from the database
        const banner = await Banner.findById(bannerId);

        // If the banner is not found, throw a NOT_FOUND error
        if (!banner) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Banner not found");
        }

        return banner;
    } catch (error) {
        console.log("GetBannerById Error:", error);

        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

// Function to delete a banner by ID
const deleteCategory = async (req: Request) => {
    try {
        const { id } = req.params;
        const { ids } = req.body;

        if (id) {
            // Find the category to get the thumbnail (if exists)
            const category = await Category.findById(id);
            if (!category) {
                throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
            }

            // First, delete the category from the database
            const deletedCategory = await Category.findByIdAndDelete(id);
            if (!deletedCategory) {
                throw new ApiError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to delete category"
                );
            }

            // Delete image from Cloudinary if the category has a thumbnail
            if (category.thumbnail) {
                const publicId = extractCloudinaryPublicId(category.thumbnail);
                await deleteFromCloudinary(publicId);
            }

            return { message: "Category deleted successfully" };
        } else if (ids && Array.isArray(ids)) {
            // Validate that 'ids' is an array and contains valid values
            if (!Array.isArray(ids) || ids.length === 0) {
                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    "Invalid request. 'ids' must be a non-empty array"
                );
            }

            // Fetch all categories to ensure they exist
            const existingCategories = await Category.find({
                _id: { $in: ids },
            });
            if (existingCategories.length !== ids.length) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "One or more category IDs do not exist"
                );
            }

            // Delete categories from database first
            const result = await Category.deleteMany({ _id: { $in: ids } });
            if (result.deletedCount !== ids.length) {
                throw new ApiError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Some categories could not be deleted"
                );
            }

            // If successful, delete associated images
            for (const category of existingCategories) {
                if (category.thumbnail) {
                    const publicId = extractCloudinaryPublicId(
                        category.thumbnail
                    );
                    await deleteFromCloudinary(publicId);
                }
            }
            return {
                message: `${result.deletedCount} categories deleted successfully`,
            };
        } else {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid request");
        }
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

export const BannerService = {
    createBanner,
    updateBanner,
    getAllBanners,
    deleteCategory,
    getBannerById,
};
