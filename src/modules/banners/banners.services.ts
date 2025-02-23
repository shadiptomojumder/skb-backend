import {
    deleteFromCloudinary,
    uploadSingleOnCloudinary,
} from "@/shared/cloudinary";
import { extractCloudinaryPublicId } from "@/shared/extractCloudinaryPublicId";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiError";

import { deleteLocalFiles } from "@/shared/deleteLocalFiles";
import Category from "../categories/categories.models";
import { categoryUpdateSchema } from "../categories/categories.schemas";
import Banner from "./banners.models";
import { bannerSchema } from "./banners.schemas";

// Function to create a new category
const createBanner = async (req: Request) => {
    try {
        // Validate the request body against the category schema
        const parseBody = bannerSchema.safeParse(req.body);
        const file = req.file as Express.Multer.File;
        // Check if the category image is provided
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

        // Check if a category with the same title or value already exists
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

        console.log("The category imageUrl is: ", imageUrl);

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

// Function to update an existing category
const updateCategory = async (req: Request) => {
    try {
        // Category Id
        const { id } = req.params;

        // Validate the request body against the category update schema
        const parseBody = categoryUpdateSchema.safeParse(req.body);

        // If validation fails, collect error messages and throw a BAD_REQUEST error
        if (!parseBody.success) {
            const errorMessages = parseBody.error.errors
                .map((error) => error.message)
                .join(",");
            throw new ApiError(StatusCodes.BAD_REQUEST, errorMessages);
        }

        // Generate a unique `value` from `title` if title is updated
        let generatedValue;
        if (parseBody.data.title) {
            generatedValue = parseBody.data.title
                .toLowerCase()
                .replace(/\s+/g, "_") // Convert spaces to underscores
                .replace(/[^a-z0-9_]/g, ""); // Remove special characters
        }

        // Upload the thumbnail image to Cloudinary
        let thumbnailUrl = "";

        if (req.file) {
            const result = await uploadSingleOnCloudinary(
                req.file.path,
                "categories"
            );
            thumbnailUrl = result?.url || "";
        }

        console.log("The thumbnailUrl result is: ", thumbnailUrl);

        // Update the category with the provided fields
        const updateData = {
            ...parseBody.data,
            ...(generatedValue && { value: generatedValue }),
        };

        // If a new image was uploaded, include the new thumbnail URL in the update data
        if (thumbnailUrl) {
            updateData.thumbnail = thumbnailUrl;
        }

        const category = await Category.findByIdAndUpdate(id, updateData, {
            new: true,
        });

        console.log("the updated category:", category);

        // If category is not found, throw a NOT_FOUND error
        if (!category) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
        }

        return category;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

// Function to get all categories
const getAllCategory = async (req: Request) => {
    try {
        // Retrieve all categories with all fields from the database
        const categories = await Category.find();
        if (!categories) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "categories not found!!"
            );
        }

        return categories;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

// Function to get a single category by ID
const getSingleCategory = async (id: string) => {
    try {
        // Retrieve the category with the specified ID from the database
        const category = await Category.findById(id);

        // If the category is not found, throw a NOT_FOUND error
        if (!category) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
        }

        return category;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

// Function to delete a category by ID
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

export const CategoryService = {
    createBanner,
    updateCategory,
    getAllCategory,
    deleteCategory,
    getSingleCategory,
};
