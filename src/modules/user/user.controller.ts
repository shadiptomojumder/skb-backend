import ApiResponse from "@/shared/ApiResponse";
import asyncErrorHandler from "@/shared/asyncErrorHandler";
import pick from "@/shared/pick";
import { UserServices } from "@/user/user.services";
import { userFilterAbleFields } from "@/user/user.utils";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { IAuthUser } from "../../interfaces/common";


// Controller function to get the profile of the authenticated user
const getOneUser = asyncErrorHandler(async (req: Request, res: Response) => {
  const userId = req.params.id;

  const result = await UserServices.getOneUser(userId);

  ApiResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile data fetched!",
    data: result,
  });
});

// Controller function to get all user
const getAllUser = asyncErrorHandler(async (req: Request, res: Response) => {
  // Extract filters from the query parameters using the pick function and userFilterAbleFields array
  const filters: Record<string, any> = pick(req.query, userFilterAbleFields);
  const options: Record<string, any> = pick(req.query, [
    "limit",
    "page",
    "sortBy",
    "sortOrder",
  ]);
  const user: IAuthUser = req.user as IAuthUser;

  const result = await UserServices.getAllUser(filters, options, user);
  ApiResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "All user retrieval successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const UserController = {
  getOneUser,
  getAllUser,
};
