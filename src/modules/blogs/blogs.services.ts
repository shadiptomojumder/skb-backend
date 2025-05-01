import ApiError from "@/errors/ApiError";
import { uploadSingleOnCloudinary } from "@/shared/cloudinary";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import { Blog } from "./blogs.model";
import { blogSchema } from "./blogs.schemas";

// Service to create a new blog
const createBlog = async (req: Request) => {
    try {
        console.log("Creating blog with request body:", req.body);
        console.log("Request file:", req.file);

        // Validate the request body against the category schema
        const parseBody = blogSchema.safeParse(req.body);

        // If validation fails, collect error messages and throw a BAD_REQUEST error
        if (!parseBody.success) {
            const errorMessages = parseBody.error.errors
                .map((error) => error.message)
                .join(", ");
            throw new ApiError(StatusCodes.BAD_REQUEST, errorMessages);
        }

        // Check if an image is provided
        if (!req.file) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "An image is required to create a blog."
            );
        }

        // Upload the image to Cloudinary
        const uploadResult = await uploadSingleOnCloudinary(
            req.file.path,
            "blogs"
        );

        const imageUrl = uploadResult?.secure_url;
        if (!imageUrl) {
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                "Failed to upload image to Cloudinary."
            );
        }

        // Create a new blog in the database
        const blog = new Blog({
            title: parseBody.data.title,
            description: parseBody.data.description,
            image: imageUrl,
            isActive: parseBody.data.isActive ?? true,
        });

        await blog.save();
        return blog;
    } catch (error) {
        console.error("Error creating blog:", error);

        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `An unexpected error occurred while creating the blog:${
                error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
};

// Service to update an existing blog
const updateBlog = async (req: Request) => {
    try {
        const { blogId } = req.params;
        const { title, description, isActive } = req.body;

        // Find the existing blog
        const existingBlog = await Blog.findById(blogId);
        if (!existingBlog) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Blog not found");
        }

        // Update the image if a new one is provided
        let imageUrl = existingBlog.image;
        if (req.file) {
            const uploadResult = await uploadSingleOnCloudinary(
                req.file.path,
                "blogs"
            );
            imageUrl = uploadResult?.secure_url || imageUrl;
        }

        // Update the blog
        existingBlog.title = title || existingBlog.title;
        existingBlog.description = description || existingBlog.description;
        existingBlog.isActive = isActive ?? existingBlog.isActive;
        existingBlog.image = imageUrl;

        await existingBlog.save();
        return existingBlog;
    } catch (error) {
        console.error("Error updating blog:", error);

        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `An unexpected error occurred while updating the blog:${
                error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
};

// Service to get all blogs
const getAllBlogs = async (req: Request) => {
    try {
        const blogs = await Blog.find();
        return blogs;
    } catch (error) {
        console.error("Error fetching blogs:", error);

        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `An unexpected error occurred while getting the blogs:${
                error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
};

// Service to get a specific blog by ID
const getBlogById = async (req: Request) => {
    try {
        const { blogId } = req.params;
        const blog = await Blog.findById(blogId);
        if (!blog) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Blog not found");
        }
        return blog;
    } catch (error) {
        console.error("Error fetching blog by ID:", error);

        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `An unexpected error occurred while get blog by id:${
                error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
};

// Service to delete a single blog by ID
const deleteSingleBlog = async (req: Request) => {
    try {
        const { blogId } = req.params;
        const blog = await Blog.findByIdAndDelete(blogId);
        if (!blog) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Blog not found");
        }
        return blog;
    } catch (error) {
        console.error("Error deleting blog:", error);

        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `An unexpected error occurred while delete blogs :${
                error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
};

// Service to delete multiple blogs
const deleteMultipleBlogs = async (req: Request) => {
    try {
        const { blogIds } = req.body; // Expecting an array of blog IDs in the request body
        const result = await Blog.deleteMany({ _id: { $in: blogIds } });
        return result;
    } catch (error) {
        console.error("Error deleting multiple blogs:", error);

        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `An unexpected error occurred while delete the blog:${
                error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
};

export const BlogService = {
    createBlog,
    updateBlog,
    getAllBlogs,
    getBlogById,
    deleteSingleBlog,
    deleteMultipleBlogs,
};
