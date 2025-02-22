import { paginationHelpers } from "@/helpers/paginationHelper";
import { IAuthUser, IGenericResponse } from "@/interfaces/common";
import { IPaginationOptions } from "@/interfaces/pagination";
import {
    deleteFromCloudinary,
    uploadMultipleOnCloudinary,
} from "@/shared/cloudinary";
import { extractCloudinaryPublicId } from "@/shared/extractCloudinaryPublicId";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import ApiError from "../../errors/ApiError";
import Category from "../categories/categories.models";
import Product from "./product.models";
import { productSchema, productUpdateSchema } from "./product.schemas";
import { deleteLocalFiles, generateSku } from "./product.utils";

// Function to create a new product
const createProduct = async (req: Request) => {
    try {
        // Validate the request body against the product schema
        const parseBody = productSchema.safeParse(req.body);
        console.log("The parseBody is:", parseBody);

        // Generate an array of strings for file path
        const filePaths = (req.files as Express.Multer.File[]).map(
            (file) => file.path
        );

        // If validation fails, collect error messages and throw a BAD_REQUEST error
        if (!parseBody.success) {
            const errorMessages = parseBody.error.errors
                .map((error) => error.message)
                .join(",");
            // Delete locally stored images before throwing error
            deleteLocalFiles(filePaths);
            throw new ApiError(StatusCodes.BAD_REQUEST, errorMessages);
        }

        // If user dont send any image then show an error
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "At least one image is required to create a product."
            );
        }

        // Check if the provided Product category exists or not
        const existingCategory = await Category.findById(
            parseBody.data.category
        );
        if (!existingCategory) {
            // Delete locally stored images before throwing error
            deleteLocalFiles(filePaths);
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                "Invalid category. Category does not exist."
            );
        }

        // Check if product already exists in the same category (to prevent duplicates)
        const existingProduct = await Product.findOne({
            name: parseBody.data.name,
            category: parseBody.data.category, // Ensure the product is unique per category
        });
        if (existingProduct) {
            // Delete locally stored images before throwing error
            deleteLocalFiles(filePaths);
            throw new ApiError(
                StatusCodes.CONFLICT,
                "Product with this name already exists in this category."
            );
        }

        // Calculate finalPrice based on discount
        const finalPrice = parseBody.data.discount
            ? parseBody.data.price -
              (parseBody.data.price * parseBody.data.discount) / 100
            : parseBody.data.price;

        // Generate a unique SKU for the product
        const sku = await generateSku(
            parseBody.data.category,
            parseBody.data.name
        );
        console.log("The Product SKU is:", sku);

        // Create new product linked to the category
        const product = new Product({
            ...parseBody.data,
            finalPrice,
            sku,
        });
        console.log("The product is:", product);

        await product.save();

        // Upload images to Cloudinary
        const uploadResults = await uploadMultipleOnCloudinary(
            filePaths,
            "products"
        );
        // Transform it into an array of URLs
        const imageUrls = uploadResults.map((image) => image.url);
        console.log("The imageUrls  is:", imageUrls);

        // If product created, update the images array with the uploaded ones
        if (product) {
            // Update product with image URLs
            product.images = imageUrls;
            await product.save();
        } else {
            // Delete locally stored images before throwing error
            deleteLocalFiles(filePaths);
        }

        return product;
    } catch (error) {
        console.error("Error in createProduct:", error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

// Function to update an existing product
const updateProduct = async (req: Request) => {
    try {
        // Product Id
        const { productId } = req.params;

        // Generate an array of strings for file path
        const filePaths = (req.files as Express.Multer.File[]).map(
            (file) => file.path
        );

        // Validate the request body against the product schema
        const parseBody = productUpdateSchema.safeParse(req.body);
        console.log("The parseBody is:", parseBody);

        // If validation fails, collect error messages and throw a BAD_REQUEST error
        if (!parseBody.success) {
            const errorMessages = parseBody.error.errors
                .map((error) => error.message)
                .join(",");
            throw new ApiError(StatusCodes.BAD_REQUEST, errorMessages);
        }

        // Check if SKU is being updated and throw an error if it is
        if (parseBody.data.sku) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "SKU cannot be updated"
            );
        }

        // Find the product by ID
        const product = await Product.findById(productId);
        if (!product) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Product not found.");
        }

        // Check if the category exists
        if (parseBody.data.category) {
            const existingCategory = await Category.findById(
                parseBody.data.category
            );
            if (!existingCategory) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "Invalid category. Category does not exist."
                );
            }
        }

        // Check for duplicate product name in the same category
        const existingProduct = await Product.findOne({
            name: parseBody.data.name,
            category: parseBody.data.category || product.category,
            _id: { $ne: productId },
        });
        if (existingProduct) {
            throw new ApiError(
                StatusCodes.CONFLICT,
                "Product with this name already exists in this category."
            );
        }

        // Recalculate finalPrice only if price or discount is updated
        if (
            parseBody.data.price !== undefined ||
            parseBody.data.discount !== undefined
        ) {
            const price = parseBody.data.price ?? product.price;
            const discount = parseBody.data.discount ?? product.discount;

            const finalPrice = discount
                ? Number(price) - (Number(price) * Number(discount)) / 100
                : Number(price);

            // Convert finalPrice to Decimal128
            product.finalPrice = mongoose.Types.Decimal128.fromString(
                finalPrice.toString()
            );
        }

        // Update product fields
        Object.assign(product, parseBody.data);

        // Upload images to Cloudinary
        const uploadResults = await uploadMultipleOnCloudinary(
            filePaths,
            "products"
        );
        const newImageUrls = uploadResults.map((image) => image.url);
        console.log("The imageUrls  is:", newImageUrls);


        // Append new images if uploaded
        if (newImageUrls.length > 0) {
            product.images = [...product.images, ...newImageUrls];
        }

        console.log("The Updated Product:", product);

        await product.save();


        // // If product is not found, throw a BAD_REQUEST error
        if (!product) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
        }
        return product;
    } catch (error) {
        console.error("Error in updateProduct:", error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

// Function to get all products with filters and pagination
const getAllProduct = async (
    filters: any,
    options: IPaginationOptions,
    authUser: IAuthUser
): Promise<IGenericResponse<any[]>> => {
    try {
        let { limit, page, skip } =
            paginationHelpers.calculatePagination(options);

        const andConditions: any[] = [];

        // Apply filters safely
        Object.keys(filters).forEach((key) => {
            if (!filters[key]) return; // Ignore undefined or empty values

            if (key === "name" || key === "sku") {
                andConditions.push({
                    [key]: {
                        $regex: filters[key],
                        $options: "i", // Case-insensitive search
                    },
                });
            } else if (key === "price") {
                const price = parseFloat(filters[key]);
                if (!isNaN(price)) {
                    andConditions.push({ [key]: { $eq: price } });
                }
            } else {
                andConditions.push({ [key]: { $eq: filters[key] } });
            }
        });

        const whereConditions =
            andConditions.length > 0 ? { $and: andConditions } : {};

        // Fetch products with filters, pagination, and sorting
        const result = await Product.find(whereConditions)
            .skip(skip)
            .limit(limit)
            .sort(
                options.sortBy && options.sortOrder
                    ? { [options.sortBy]: options.sortOrder }
                    : { createdAt: -1 } // Default to newest first
            )
            .populate({
                path: "category",
                select: "-createdAt -updatedAt", // Exclude createdAt and updatedAt fields
            })
            .exec();

        // Convert Decimal128 values to numbers
        // result.forEach((p) => {
        //   p.price = parseFloat(p.price.toString()) as any; // Convert Decimal128 to number
        //   p.finalPrice = parseFloat(p.finalPrice.toString()) as any; // Convert Decimal128 to number
        // });

        // Calculate the total number of products in the database
        const total = await Product.countDocuments(whereConditions);

        return {
            meta: {
                total,
                page,
                limit,
            },
            data: result,
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

// Function to get a single product by ID
const getSingleProduct = async (id: string) => {
    try {
        // Retrieve the product with the specified ID from the database
        const product = await Product.findById(id).populate("category");

        // If the product is not found, throw a NOT_FOUND error
        if (!product) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
        }

        return product;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

// Function to delete a single product by ID
const deleteProducts = async (req: Request) => {
    try {
        const { id } = req.params;
        const { ids } = req.body;
        if (id) {
            // Find the category to get the thumbnail (if exists)
            const product = await Product.findById(id);
            if (!product) {
                throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
            }

            // First, delete the product from the database
            const deletedProduct = await Product.findByIdAndDelete(id);
            if (!deletedProduct) {
                throw new ApiError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to delete product"
                );
            }

            // Delete images from Cloudinary if the product has images
            if (product.images && Array.isArray(product.images)) {
                for (const imageUrl of product.images) {
                    const publicId = extractCloudinaryPublicId(imageUrl);
                    await deleteFromCloudinary(publicId);
                }
            }

            return { message: "Product deleted successfully" };
        } else if (ids && Array.isArray(ids)) {
            // Validate that 'ids' is an array and contains valid values
            if (!Array.isArray(ids) || ids.length === 0) {
                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    "Invalid request. 'ids' must be a non-empty array"
                );
            }

            // Fetch all product to ensure they exist
            const existingProducts = await Product.find({
                _id: { $in: ids },
            });
            if (existingProducts.length !== ids.length) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "One or more product IDs do not exist"
                );
            }

            // Extract all image publicIds from Cloudinary (if available)
            const imagePublicIds = existingProducts
                .flatMap((product) => product.images || []) // Flatten all image arrays
                .map((imageUrl) => extractCloudinaryPublicId(imageUrl));

            // Delete products from database first
            const result = await Product.deleteMany({ _id: { $in: ids } });
            if (result.deletedCount !== ids.length) {
                throw new ApiError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Some products could not be deleted"
                );
            }

            // Delete associated images from Cloudinary in parallel
            if (imagePublicIds.length > 0) {
                await Promise.all(
                    imagePublicIds.map((publicId) =>
                        deleteFromCloudinary(publicId)
                    )
                );
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

// Function to delete product image
const deleteProductImage = async (req: Request) => {
    try {
        const { productId } = req.params;
        const { imageUrl } = req.body; // Image URL to be deleted

        if (!imageUrl) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Image URL is required.");
        }

        // Find the product by ID
        const product = await Product.findById(productId);
        if (!product) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Product not found.");
        }

        // Check if the image exists in the product
        if (!product.images.includes(imageUrl)) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Image not found in product.");
        }

        // Prevent deletion if only one image is left
        if (product.images.length === 1) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Cannot delete the only image. At least one image is required."
            );
        }

        // Remove the image URL from the images array
        product.images = product.images.filter((img) => img !== imageUrl);

        // Delete the image from Cloudinary
        const publicId = extractCloudinaryPublicId(imageUrl);
        await deleteFromCloudinary(publicId);

        // Save the updated product
        await product.save();

        return { message: "Image deleted successfully" };
    } catch (error) {
        console.error("Error in deleteProductImage:", error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};


export const ProductService = {
    createProduct,
    updateProduct,
    getAllProduct,
    getSingleProduct,
    deleteProducts,
    deleteProductImage
};
