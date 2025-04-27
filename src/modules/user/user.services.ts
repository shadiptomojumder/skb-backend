import ApiError from "@/errors/ApiError";
import { paginationHelpers } from "@/helpers/paginationHelper";
import { IAuthUser, IGenericResponse } from "@/interfaces/common";
import { IPaginationOptions } from "@/interfaces/pagination";
import { normalizePhoneNumber } from "@/shared/normalizePhoneNumber";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import { FilterQuery } from "mongoose";
import { User } from "./user.model";
import { updateUserSchema } from "./user.schemas";
import { extractCloudinaryPublicId } from "@/shared/extractCloudinaryPublicId";
import { deleteFromCloudinary, uploadSingleOnCloudinary } from "@/shared/cloudinary";

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

const updateUser = async (req: Request) => {
    try {
        // Product Id
        const { userId } = req.params;
        console.log("User Id: ", userId);
        console.log("Request Body Is: ", req.body);
        const file = req.file as Express.Multer.File;
        

        // Fetch user from the database to determine their signup method
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
        }

        // Validate the request body against the product schema
        const parseBody = updateUserSchema.safeParse(req.body);
        console.log("The parseBody is:", parseBody);

        // If validation fails, collect error messages and throw a BAD_REQUEST error
        if (!parseBody.success) {
            const errorMessages = parseBody.error.errors
                .map((error) => error.message)
                .join(",");
            throw new ApiError(StatusCodes.BAD_REQUEST, errorMessages);
        }

        // Allowed fields for update
        const allowedFields = [
            "avatar",
            "phone",
            "email",
            "address",
            "firstName",
            "lastName",
            "role",
        ];

        // Filter out unwanted fields
        const updateData: Record<string, any> = {};
        Object.keys(req.body).forEach((key) => {
            if (allowedFields.includes(key)) {
                updateData[key] = req.body[key];
            }
        });

        // Prevent changing the signup field
        if (existingUser.email && updateData.email) {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                "You cannot change your registered email"
            );
        }
        if (existingUser.phone && updateData.phone) {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                "You cannot change your registered phone number"
            );
        }

        // Normalize phone number if provided
        if (updateData.phone) {
            updateData.phone = normalizePhoneNumber(updateData.phone);
        }

        // Handle image update
        if (file) {
            // Delete old image from Cloudinary
            if (existingUser.avatar) {
                const publicId = extractCloudinaryPublicId(existingUser.avatar);
                await deleteFromCloudinary(publicId);
            }

            // Upload new thumbnail
            const result = await uploadSingleOnCloudinary(file.path, "users");
            if (result?.secure_url) updateData.avatar = result.secure_url;
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
            new: true, // Return updated document
            runValidators: true, // Run Mongoose validators
        });

        return updatedUser;
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
    updateUser,
};
