import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiError";
import Category from "./categories.models";
import { categorySchema, categoryUpdateSchema } from "./categories.schemas";
import { uploadSingleOnCloudinary } from "@/shared/cloudinary";

// Function to create a new category
const createCategory = async (req: Request) => {
    try {
        // Validate the request body against the category schema
        const parseBody = categorySchema.safeParse(req.body);
        console.log("parseBody is:", parseBody);

        // If validation fails, collect error messages and throw a BAD_REQUEST error
        if (!parseBody.success) {
            const errorMessages: string = parseBody.error.errors
                .map((error) => error.message)
                .join(",");
            throw new ApiError(StatusCodes.BAD_REQUEST, errorMessages);
        }

        // Generate a unique `value` from `title`
        const generatedValue = parseBody.data.title
            .toLowerCase()
            .replace(/\s+/g, "_") // Convert spaces to underscores
            .replace(/[^a-z0-9_]/g, ""); // Remove special characters

        //console.log("generatedValue is:", generatedValue);

        // Check if a category with the same title or value already exists
        const existingCategory = await Category.findOne({
            $or: [
                { title: parseBody.data.title }, // Check for duplicate title
                { value: generatedValue }, // Check for duplicate value
            ],
        });

        // If category exists, throw a CONFLICT error
        if (existingCategory) {
            throw new ApiError(
                StatusCodes.CONFLICT,
                "Category with this title or value already exists"
            );
        }

        
        // Upload the thumbnail image to Cloudinary
        let thumbnailUrl = "";
        if (parseBody.data.thumbnail && parseBody.data.thumbnail.base64) {
            const base64Data = parseBody.data.thumbnail.base64.split(",")[1];
            const result = await uploadSingleOnCloudinary(`data:image/webp;base64,${base64Data}`);
            thumbnailUrl = result?.url || "";
        }

        console.log("The thumbnailUrl result is: ", thumbnailUrl);
        

        // Create a new category in the database
        const category = new Category({
            ...parseBody.data,
            value: generatedValue,
            thumbnail: thumbnailUrl,
        });

        await category.save();

        return category;
    } catch (error) {
        if (error instanceof Error) {
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        } else {
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                "An unknown error occurred"
            );
        }
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

        // Update the category with the provided fields
        const category = await Category.findByIdAndUpdate(
            id,
            {
                ...parseBody.data,
                ...(generatedValue && { value: generatedValue }),
            },
            { new: true }
        );

        // If category is not found, throw a NOT_FOUND error
        if (!category) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
        }

        return category;
    } catch (error) {
        if (error instanceof Error) {
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        } else {
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                "An unknown error occurred"
            );
        }
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
        if (error instanceof Error) {
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        } else {
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                "An unknown error occurred"
            );
        }
    }
};

// Function to delete a category by ID
const deleteCategory = async (id: string) => {
    try {
        // Delete the category with the specified ID from the database
        const category = await Category.findByIdAndDelete(id);

        // If the category is not found, throw a NOT_FOUND error
        if (!category) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
        }

        return category;
    } catch (error) {
        if (error instanceof Error) {
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        } else {
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                "An unknown error occurred"
            );
        }
    }
};

export const ProductService = {
    createCategory,
    updateCategory,
    getAllCategory,
    deleteCategory,
};
