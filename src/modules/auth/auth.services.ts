import { loginDataSchema, signupDataSchema } from "@/auth/auth.schemas";
import config from "@/config";
import ApiError from "@/errors/ApiError";
import { hashedPassword } from "@/helpers/hashPasswordHelper";
import { normalizePhoneNumber } from "@/shared/normalizePhoneNumber";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import { Secret } from "jsonwebtoken";
import { User } from "../user/user.model";
import { AuthUtils } from "./auth.utils";

// Signup function to register a new user
const signup = async (req: Request) => {
    try {
        // Validate the request body against the user schema
        const parseBody = signupDataSchema.safeParse(req.body);
        if (!parseBody.success) {
            // If validation fails, collect error messages and throw a BAD_REQUEST error
            const errorMessages = parseBody.error.errors
                .map((error) => error.message)
                .join(",");
            throw new ApiError(StatusCodes.BAD_REQUEST, errorMessages);
        }
        console.log("The parseBody is:", parseBody);

        const { email, phone, password } = parseBody.data;

        // Normalize the phone number
        const normalizedPhone = phone ? normalizePhoneNumber(phone) : null;

        // Check if a user with the same email or phone already exists
        let isUserExist;
        if (email) {
            isUserExist = await User.findOne({ email });
        } else if (normalizedPhone) {
            isUserExist = await User.findOne({ phone: normalizedPhone });
        }

        // If user exists, throw a CONFLICT error
        if (isUserExist) {
            throw new ApiError(StatusCodes.CONFLICT, "User already exists");
        }

        // Hash the user's password before storing it in the database
        const hashPassword = await hashedPassword(password);

        // Create a new user in the database with the hashed password
        const result = await User.create({
            ...parseBody.data,
            ...(normalizedPhone && { phone: normalizedPhone }),
            password: hashPassword,
        });

        // Convert to plain object and remove sensitive fields
        const userObj: Partial<typeof result> = result.toObject();
        delete userObj.password;

        return userObj;
    } catch (error) {
        console.log("Error creating user", error);

        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

// Login function to authenticate a user
const login = async (req: Request) => {
    try {
        // Validate the request body against the loginData schema
        const parseBody = loginDataSchema.safeParse(req.body);

        // If validation fails, collect error messages and throw a BAD_REQUEST error
        if (!parseBody.success) {
            const errorMessages = parseBody.error.errors
                .map((error) => error.message)
                .join(",");
            throw new ApiError(StatusCodes.BAD_REQUEST, errorMessages);
        }

        const { email, phone } = parseBody.data;

        // Normalize the phone number
        const normalizedPhone = phone ? normalizePhoneNumber(phone) : null;

        // Check if a user with the same email or phone already exists
        // Check if user exists
        let isUserExist = await User.findOne(
            email ? { email } : { phone: normalizedPhone }
        )
            .select("_id firstName lastName email phone address googleId role avatar password")
            .lean();

        if (!isUserExist) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
        }

        //console.log("isUserExist is:", isUserExist);

        // Compare the provided password with the hashed password stored in the database
        // Verify password
        const isPasswordValid = await AuthUtils.comparePasswords(
            parseBody.data.password,
            isUserExist.password
        );
        if (!isPasswordValid) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
        }

        // Generate JWT tokens for authentication and authorization
        // Generate JWT tokens
        let accessToken, refreshToken;
        try {
            accessToken = AuthUtils.generateToken(
                {
                    id: isUserExist._id.toString(),
                    email: isUserExist.email,
                    role: isUserExist.role,
                },
            );
            refreshToken = AuthUtils.generateToken(
                {
                    id: isUserExist._id.toString(),
                    email: isUserExist.email,
                    role: isUserExist.role,
                },
            );
        } catch (error) {
            //console.log("The token error is:",error);
            
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                "Failed to generate authentication tokens"
            );
        }

        // Save the refreshToken in the database
        await User.findByIdAndUpdate(isUserExist._id, { refreshToken });

        console.log("The Exist User is:",isUserExist);
        

        // Prepare sanitized user object
        const sanitizedUser = {
            id: isUserExist._id,
            firstName: isUserExist.firstName,
            lastName: isUserExist.lastName,
            email: isUserExist.email,
            phone: isUserExist.phone,
            role: isUserExist.role,
            ...(isUserExist.avatar && { avatar: isUserExist.avatar }),
            ...(isUserExist.address && { avatar: isUserExist.address }),
        };


        return {
            data: {
                user: sanitizedUser,
                accessToken,
            },
        };
    } catch (error) {
        console.log("The Login service Error:", error);

        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

export const AuthServices = {
    signup,
    login,
};
