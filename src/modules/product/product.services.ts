import { paginationHelpers } from "@/helpers/paginationHelper";
import { IAuthUser, IGenericResponse } from "@/interfaces/common";
import { IPaginationOptions } from "@/interfaces/pagination";
import { uploadMultipleOnCloudinary } from "@/shared/cloudinary";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import ApiError from "../../errors/ApiError";
import Category from "../categories/categories.models";
import Product from "./product.models";
import { productSchema, productUpdateSchema } from "./product.schemas";
import { generateSku } from "./product.utils";

// Function to create a new product
const createProduct = async (req: Request) => {
    try {
        console.log("The body is:", req.body);

        // Validate the request body against the product schema
        const parseBody = productSchema.safeParse(req.body);
        console.log("The parseBody is:", parseBody);

        // If validation fails, collect error messages and throw a BAD_REQUEST error
        if (!parseBody.success) {
            const errorMessages = parseBody.error.errors
                .map((error) => error.message)
                .join(",");
            throw new ApiError(StatusCodes.BAD_REQUEST, errorMessages);
        }

        // Check if the provided category exists
        const existingCategory = await Category.findById(
            parseBody.data.category
        );

        if (!existingCategory) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                "Invalid category. Category does not exist."
            );
        }



        


        const filePaths = (req.files as Express.Multer.File[]).map(
            (file) => file.path
        );
        const uploadResults = await uploadMultipleOnCloudinary(filePaths);
        // Transform it into an array of URLs
        const imageUrls = uploadResults.map((image) => image.url);

        console.log("The uploaded files is:", uploadResults);
        console.log("The imageUrls  is:", imageUrls);

        // Check if product already exists in the same category (to prevent duplicates)
        const existingProduct = await Product.findOne({
            name: parseBody.data.name,
            category: parseBody.data.category, // Ensure the product is unique per category
        });

        if (existingProduct) {
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
        const sku = generateSku(parseBody.data.category, parseBody.data.name);

        // Create new product linked to the category
        const product = new Product({
            ...parseBody.data,
            finalPrice,
            sku,
            images: imageUrls,
        });
        console.log("The product is:", product);

        await product.save();
        return product;
    } catch (error) {
        if (error instanceof mongoose.Error.CastError) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Invalid ObjectId format"
            );
        } else if (error instanceof ApiError) {
            throw error;
        } else if (error instanceof Error) {
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

// Function to update an existing product
const updateProduct = async (req: Request) => {
    try {
        // Product Id
        const { id } = req.params;

        // Validate the request body against the product schema
        const parseBody = productUpdateSchema.safeParse(req.body);

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

        // Calculate finalPrice if price or discount is updated
        let finalPrice;
        if (
            parseBody.data.price !== undefined ||
            parseBody.data.discount !== undefined
        ) {
            const product = await Product.findById(id);
            const price = parseBody.data.price ?? product?.price;
            const discount = parseBody.data.discount ?? product?.discount;
            finalPrice = discount
                ? Number(price) - (Number(price) * Number(discount)) / 100
                : Number(price);
        }

        // Update the product with the provided fields
        const product = await Product.findByIdAndUpdate(
            id,
            {
                ...parseBody.data,
                ...(finalPrice !== undefined && { finalPrice }),
            },
            { new: true }
        );

        // If product is not found, throw a BAD_REQUEST error
        if (!product) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
        }
        return product;
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

// Function to get all products with filters and pagination
const getAllProduct = async (
    filters: any,
    options: IPaginationOptions,
    authUser: IAuthUser
): Promise<IGenericResponse<any[]>> => {
    try {
        const { limit, page, skip } =
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
                select: "-createdAt -updatedAt" // Exclude createdAt and updatedAt fields
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

// Function to delete a single product by ID
const deleteSingleProduct = async (id: string) => {
    try {
        // Delete the product with the specified ID from the database
        const product = await Product.findByIdAndDelete(id);

        // If the product is not found, throw a NOT_FOUND error
        if (!product) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
        }

        return product;
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

// Function to delete multiple products by their IDs
const deleteMultipleProducts = async (ids: string[]) => {
    try {
        // Delete the products with the specified IDs from the database
        const result = await Product.deleteMany({
            _id: {
                $in: ids,
            },
        });

        // If no products are found to delete, throw a NOT_FOUND error
        if (result.deletedCount === 0) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                "No products found to delete"
            );
        }

        return result;
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
    createProduct,
    updateProduct,
    getAllProduct,
    getSingleProduct,
    deleteSingleProduct,
    deleteMultipleProducts,
};
