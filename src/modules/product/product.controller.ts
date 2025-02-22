import { IAuthUser } from "@/interfaces/common";
import ApiResponse from "@/shared/ApiResponse";
import asyncErrorHandler from "@/shared/asyncErrorHandler";
import pick from "@/shared/pick";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ProductService } from "./product.services";
import { productFilterAbleFields } from "./product.utils";

// Controller function to create a new product
const createProduct = asyncErrorHandler(async (req: Request, res: Response) => {
    const product = await ProductService.createProduct(req);
    ApiResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Product Successfully Created",
        data: product,
    });
});

// Controller function to update an existing product
const updateProduct = asyncErrorHandler(async (req: Request, res: Response) => {
    const product = await ProductService.updateProduct(req);
    ApiResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Product successfully updated",
        data: product,
    });
});

// Controller function to get all products with filters
const getAllProduct = asyncErrorHandler(async (req: Request, res: Response) => {
    // Extract filters from the query parameters using the pick function and userFilterAbleFields array
    const filters: Record<string, any> = pick(
        req.query,
        productFilterAbleFields
    );
    const options: Record<string, any> = pick(req.query, [
        "limit",
        "page",
        "sortBy",
        "sortOrder",
        "all",
    ]);
    const user: IAuthUser = req.user as IAuthUser;

    const result = await ProductService.getAllProduct(filters, options, user);
    ApiResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "All products retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

// Controller function to get a single product by ID
const getSingleProduct = asyncErrorHandler(
    async (req: Request, res: Response) => {
        const id = req.params.id;
        const product = await ProductService.getSingleProduct(id);
        ApiResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Product retrieved successfully",
            data: product,
        });
    }
);

// Controller function to delete a single or multiple products
const deleteProduct = asyncErrorHandler(async (req: Request, res: Response) => {
    const result = await ProductService.deleteProducts(req);
    ApiResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: `${result.message}`,
    });
});

// Controller function to delete product image
const deleteProductImage = asyncErrorHandler(async (req: Request, res: Response) => {
    const result = await ProductService.deleteProductImage(req);
    ApiResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: `${result.message}`,
    });
});

export const productController = {
    createProduct,
    updateProduct,
    getAllProduct,
    getSingleProduct,
    deleteProduct,
    deleteProductImage
};
