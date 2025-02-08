import asyncErrorHandler from "@/shared/asyncErrorHandler";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import ApiResponse from "@/shared/ApiResponse";
import { ProductService } from "./product.services";
import pick from "@/shared/pick";
import { productFilterAbleFields } from "./product.utils";
import { IAuthUser } from "@/interfaces/common";
import ApiError from "@/errors/ApiError";

// Controller function to create a new product
const createProduct = asyncErrorHandler(async (req: Request, res: Response) => {
  const product = await ProductService.createProduct(req);
  ApiResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Product created",
    data:  product ,
  });
});

// Controller function to update an existing product
const updateProduct = asyncErrorHandler(async (req: Request, res: Response) => {
  const product = await ProductService.updateProduct(req);
  ApiResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Product successfully updated",
    data:  product ,
  });
});

// Controller function to get all products with filters
const getAllProduct = asyncErrorHandler(async (req: Request, res: Response) => {
  // Extract filters from the query parameters using the pick function and userFilterAbleFields array
  const filters: Record<string, any> = pick(req.query, productFilterAbleFields);
  const options: Record<string, any> = pick(req.query, [
    "limit",
    "page",
    "sortBy",
    "sortOrder",
  ]);
  const user: IAuthUser = req.user as IAuthUser;

  const result = await ProductService.getAllProduct(filters, options,user);
  ApiResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "All products retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

// Controller function to get a single product by ID
const getSingleProduct = asyncErrorHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  const product = await ProductService.getSingleProduct(id);
  ApiResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Product retrieved successfully",
    data: product,
  });
});

// Controller function to delete a single or multiple products
const deleteProduct = asyncErrorHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { ids } = req.body;

  let result;
  if (id) {
    result = await ProductService.deleteSingleProduct(id);
    ApiResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Product deleted successfully",
      data: result,
    });
  } else if (ids && Array.isArray(ids)) {
    result = await ProductService.deleteMultipleProducts(ids);
    ApiResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Products deleted successfully",
      data: result,
    });
  } else {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid request");
  }
});


export const productController = {
  createProduct,
  updateProduct,
  getAllProduct,
  getSingleProduct,
  deleteProduct,
};
