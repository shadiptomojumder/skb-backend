import ApiError from "@/errors/ApiError";
import { paginationHelpers } from "@/helpers/paginationHelper";
import { IAuthUser, IGenericResponse } from "@/interfaces/common";
import { IPaginationOptions } from "@/interfaces/pagination";
import { StatusCodes } from "http-status-codes";
import { FilterQuery } from "mongoose";
import { User } from "./user.model";

const getOneUser = async (userId: string) => {
    try {
        // Fetch the user by ID
        const user = await User.findById(userId)
            .select("-password -refreshToken")
            .lean()
            .exec();

        if (!user)
            throw new ApiError(StatusCodes.NOT_FOUND, "User does not exist");
        return user;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

const getAllUser = async (
    filters: any,
    options: IPaginationOptions,
    authUser: IAuthUser
): Promise<IGenericResponse<InstanceType<typeof User>[]>> => {
    try {
        const { limit, page, skip } =
            paginationHelpers.calculatePagination(options);

        // console.log("40.filters is:", filters);

        // auth role base logic here
        const andConditions: FilterQuery<typeof User>[] = [];

        // Apply filters
        if (Object.keys(filters).length > 0) {
            Object.keys(filters).forEach((key) => {
                if (key === "fullname") {
                    // Case-insensitive partial match for fullname
                    andConditions.push({
                        [key]: { $regex: filters[key], $options: "i" },
                    });
                } else {
                    // Exact match for other fields
                    andConditions.push({
                        [key]: filters[key],
                    });
                }
            });
        }

        // Debug: Log the constructed where conditions
        // console.log(
        //   "Constructed where conditions:",
        //   JSON.stringify(andConditions, null, 2)
        // );

        // Combine all conditions
        const whereConditions =
            andConditions.length > 0 ? { $and: andConditions } : {};

        // Query the database
        const result = await User.find(whereConditions)
            .skip(skip)
            .limit(limit)
            .sort(
                options.sortBy && options.sortOrder
                    ? { [options.sortBy]: options.sortOrder === "asc" ? 1 : -1 }
                    : { createdAt: 1 }
            )
            .exec();

        const total = await User.countDocuments(whereConditions);

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

export const UserServices = {
    getOneUser,
    getAllUser,
};
