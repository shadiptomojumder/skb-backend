import {
    deleteFromCloudinary,
    uploadSingleOnCloudinary,
} from "@/shared/cloudinary";
import { deleteLocalFiles } from "@/shared/deleteLocalFiles";
import { extractCloudinaryPublicId } from "@/shared/extractCloudinaryPublicId";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import ApiError from "../../errors/ApiError";
import Category from "./categories.models";
import { categorySchema, categoryUpdateSchema } from "./categories.schemas";

// Function to create a new category
const createCategory = async (req: Request) => {
    try {
        // Validate the request body against the category schema
        const parseBody = categorySchema.safeParse(req.body);

        // Check if the request contains files
        const files = req.files as {
            [fieldname: string]: Express.Multer.File[];
        };

        // If validation fails, collect error messages and throw a BAD_REQUEST error
        if (!parseBody.success) {
            const errorMessages: string = parseBody.error.errors
                .map((error) => error.message)
                .join(",");
            // Delete the locally stored file before throwing an error
            const pathsToDelete = [];
            if (files["thumbnail"])
                pathsToDelete.push(files["thumbnail"][0].path);
            if (files["logo"]) pathsToDelete.push(files["logo"][0].path);
            deleteLocalFiles(pathsToDelete);
            throw new ApiError(StatusCodes.BAD_REQUEST, errorMessages);
        }

        // Check if the category images are provided
        if (!files || !files["thumbnail"] || !files["logo"]) {
            const pathsToDelete = [];
            if (files["thumbnail"])
                pathsToDelete.push(files["thumbnail"][0].path);
            if (files["logo"]) pathsToDelete.push(files["logo"][0].path);
            deleteLocalFiles(pathsToDelete);
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Both thumbnail and logo images are required"
            );
        }

        // Generate a unique `value` from `title`
        const generatedValue = parseBody.data.title
            .toLowerCase()
            .replace(/\s+/g, "_") // Convert spaces to underscores
            .replace(/[^a-z0-9_]/g, ""); // Remove special characters

        // Check if a category with the same title or value already exists
        const existingCategory = await Category.findOne({
            $or: [
                { title: parseBody.data.title }, // Check for duplicate title
                { value: generatedValue }, // Check for duplicate value
            ],
        });

        // If category exists, throw a CONFLICT error
        if (existingCategory) {
            // Delete the locally stored file before throwing an error
            const pathsToDelete = [];
            if (files["thumbnail"])
                pathsToDelete.push(files["thumbnail"][0].path);
            if (files["logo"]) pathsToDelete.push(files["logo"][0].path);
            deleteLocalFiles(pathsToDelete);
            throw new ApiError(
                StatusCodes.CONFLICT,
                "Category with this title or value already exists"
            );
        }

        // Upload the thumbnail and logo images to Cloudinary
        let thumbnailUrl = "";
        let logoUrl = "";

        if (files["thumbnail"]) {
            const result = await uploadSingleOnCloudinary(
                files["thumbnail"][0].path,
                "categories"
            );
            thumbnailUrl = result?.secure_url || "";
        }

        if (files["logo"]) {
            const result = await uploadSingleOnCloudinary(
                files["logo"][0].path,
                "categories"
            );
            logoUrl = result?.secure_url || "";
        }

        // Create a new category in the database
        const category = new Category({
            ...parseBody.data,
            value: generatedValue,
            thumbnail: thumbnailUrl,
            logo: logoUrl,
        });

        await category.save();

        return category;
    } catch (error) {
        if (error instanceof ApiError) throw error; // Keep the original error's status code
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `An unexpected error occurred while creating the category:${
                error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
};

// Function to update an existing category
const updateCategory = async (req: Request) => {
    try {
        // Category Id
        const { categoryId } = req.params;
        // Check if the request contains files
        const files = req.files as {
            [fieldname: string]: Express.Multer.File[];
        };
        // console.log("The Files in Request:",req.files);

        // Validate the request body against the category update schema
        const parseBody = categoryUpdateSchema.safeParse(req.body);

        // If validation fails, collect error messages and throw a BAD_REQUEST error
        if (!parseBody.success) {
            const errorMessages = parseBody.error.errors
                .map((error) => error.message)
                .join(",");
            const pathsToDelete = [];
            if (files["thumbnail"])
                pathsToDelete.push(files["thumbnail"][0].path);
            if (files["logo"]) pathsToDelete.push(files["logo"][0].path);
            deleteLocalFiles(pathsToDelete);
            throw new ApiError(StatusCodes.BAD_REQUEST, errorMessages);
        }

        const { title } = parseBody.data;

        const updateData: Record<string, any> = { ...parseBody.data };

        // Find the existing category
        const existingCategory = await Category.findById(categoryId);
        if (!existingCategory) {
            const pathsToDelete = [];
            if (files["thumbnail"])
                pathsToDelete.push(files["thumbnail"][0].path);
            if (files["logo"]) pathsToDelete.push(files["logo"][0].path);
            deleteLocalFiles(pathsToDelete);
            throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
        }

        // Check if the title already exists in another category
        if (title) {
            const duplicateCategory = await Category.findOne({
                title,
                _id: { $ne: categoryId }, // Exclude current category
            });

            if (duplicateCategory) {
                const pathsToDelete = [];
                if (files["thumbnail"])
                    pathsToDelete.push(files["thumbnail"][0].path);
                if (files["logo"]) pathsToDelete.push(files["logo"][0].path);
                deleteLocalFiles(pathsToDelete);
                throw new ApiError(
                    StatusCodes.CONFLICT,
                    "A category with this title already exists"
                );
            }

            // Generate `value` from `title`
            updateData.value = title
                .toLowerCase()
                .replace(/\s+/g, "_")
                .replace(/[^a-z0-9_]/g, "");
        }

        // Handle image updates if image is provided
        if (files && (files["thumbnail"] || files["logo"])) {
            const pathsToDelete = [];
            if (files["thumbnail"]) {
                // Delete old thumbnail from Cloudinary
                if (existingCategory.thumbnail) {
                    const publicId = extractCloudinaryPublicId(
                        existingCategory.thumbnail
                    );
                    await deleteFromCloudinary(publicId);
                }
                // Upload new thumbnail
                const result = await uploadSingleOnCloudinary(
                    files["thumbnail"][0].path,
                    "categories"
                );
                if (result?.secure_url)
                    updateData.thumbnail = result.secure_url;
                pathsToDelete.push(files["thumbnail"][0].path);
            }

            if (files["logo"]) {
                // Delete old logo from Cloudinary
                if (existingCategory.logo) {
                    const publicId = extractCloudinaryPublicId(
                        existingCategory.logo
                    );
                    await deleteFromCloudinary(publicId);
                }
                // Upload new logo
                const result = await uploadSingleOnCloudinary(
                    files["logo"][0].path,
                    "categories"
                );
                if (result?.secure_url) updateData.logo = result.secure_url;
                pathsToDelete.push(files["logo"][0].path);
            }

            // Delete the locally stored files after uploading to Cloudinary
            deleteLocalFiles(pathsToDelete);
        }

        // Update the category
        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,
            updateData,
            { new: true }
        );

        if (!updatedCategory)
            throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");

        return updatedCategory;
    } catch (error) {
        console.log("UpdateCategory Error: ", error);

        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `An unexpected error occurred while updating category:${
                error instanceof Error ? error.message : "Unknown error"
            }`
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
            `An unexpected error occurred while getting all categories:${
                error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
};

// Function to get a single category by ID
const getCategoryById = async (req: Request) => {
    try {
        const { categoryId } = req.params;

        // Retrieve the category with the specified ID from the database
        const category = await Category.findById(categoryId);

        // If the category is not found, throw a NOT_FOUND error
        if (!category) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
        }

        return category;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `An unexpected error occurred while getting category By ID:${
                error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
};

// Delete a single category By ID
const deleteSingleCategory = async (req: Request) => {
    try {
        const { categoryId } = req.params;

        if (!categoryId) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Category ID is required"
            );
        }

        // Validate the productId to ensure it's a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                `Invalid Category Id: ${categoryId}`
            );
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
        }

        const deletedCategory = await Category.findByIdAndDelete(categoryId);
        if (!deletedCategory) {
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                "Failed to delete category"
            );
        }

        // Delete images from Cloudinary if they exist
        const pathsToDelete: string[] = [];
        if (category.thumbnail) {
            const publicId = extractCloudinaryPublicId(category.thumbnail);
            await deleteFromCloudinary(publicId);
            pathsToDelete.push(category.thumbnail);
        }
        if (category.logo) {
            const publicId = extractCloudinaryPublicId(category.logo);
            await deleteFromCloudinary(publicId);
            pathsToDelete.push(category.logo);
        }

        // Delete the locally stored files
        deleteLocalFiles(pathsToDelete);

        return { message: "Category deleted successfully" };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `An unexpected error occurred while deleting the category:${
                error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
};

// Delete multiple categories
const deleteMultipleCategories = async (req: Request) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Invalid request. 'ids' must be a non-empty array"
            );
        }
        // Validate the ids to ensure they're valid ObjectId strings
        const invalidIds = ids.filter(
            (id) => !mongoose.Types.ObjectId.isValid(id)
        );
        if (invalidIds.length > 0) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                `Invalid Category Id(s): ${invalidIds.join(", ")}`
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

        const result = await Category.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount !== ids.length) {
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                "Some categories could not be deleted"
            );
        }

        // Delete associated images from Cloudinary
        const pathsToDelete: string[] = [];
        for (const category of existingCategories) {
            if (category.thumbnail) {
                const publicId = extractCloudinaryPublicId(category.thumbnail);
                await deleteFromCloudinary(publicId);
                pathsToDelete.push(category.thumbnail);
            }
            if (category.logo) {
                const publicId = extractCloudinaryPublicId(category.logo);
                await deleteFromCloudinary(publicId);
                pathsToDelete.push(category.logo);
            }
        }

        return {
            message: `${result.deletedCount} categories deleted successfully`,
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `An unexpected error occurred while deleting categories:${
                error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
};

export const CategoryService = {
    createCategory,
    updateCategory,
    getAllCategory,
    deleteSingleCategory,
    deleteMultipleCategories,
    getCategoryById,
};
