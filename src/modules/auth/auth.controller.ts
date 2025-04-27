import { AuthServices } from "@/auth/auth.services";
import config from "@/config";
import ApiResponse from "@/shared/ApiResponse";
import asyncErrorHandler from "@/shared/asyncErrorHandler";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AuthUtils } from "./auth.utils";
import { parseExpiry } from "@/shared/parseExpiry";

// Controller function to handle user signup
const signup = asyncErrorHandler(async (req: Request, res: Response) => {
    // Call the signup service to create a new user
    const result = await AuthServices.signup(req);

    ApiResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "User created successfully!",
        data: result,
    });
});

// Controller function to handle user login
const login = asyncErrorHandler(async (req: Request, res: Response) => {
    // Call the login service to authenticate the user
    const result = await AuthServices.login(req);
    const { accessToken, user } = result.data;
    //console.log("result user is:", result.data.user);

    // Set the refresh token into a cookie with secure and httpOnly options
    const cookieOptions = {
        httpOnly: true,
        secure: config.env === "production",
        maxAge: parseExpiry(config.jwt.expires_in || "10m"), 
        sameSite: "none" as const,
    };
    res.cookie("accessToken", accessToken, cookieOptions);

    // Send a response with the user data and tokens
    ApiResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "User logged in successfully !",
        data: {
            user: { ...user },
            accessToken,
        },
    });
});

// Controller function to handle user logout
const logout = asyncErrorHandler(async (req: Request, res: Response) => {
    const token =
        req.cookies?.accessToken || req.headers.authorization?.split(" ")[1]; // Bearer <token>
    // console.log("15.The accessToken is:", req.cookies?.accessToken);

    // Define secure cookie options
    const cookieOptions = {
        httpOnly: true,
        secure: config.env === "production",
        path: "/", // Ensure cookies are cleared for the entire site
    };

    // Clear the access token from cookies
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    // Invalidate token (if it exists)
    if (token) {
        try {
            await AuthUtils.blacklistToken(token);
        } catch (error) {
            console.error("Error blacklisting token:", error);
            return ApiResponse(res, {
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                success: false,
                message: "Error logging out. Please try again.",
            });
        }
    }

    // Send a proper logout success response
    ApiResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "User logged out successfully!",
    });
});

export const AuthController = {
    signup,
    login,
    logout,
};
