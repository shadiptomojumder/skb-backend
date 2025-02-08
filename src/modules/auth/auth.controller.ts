import { AuthServices } from "@/auth/auth.services";
import config from "@/config";
import ApiResponse from "@/shared/ApiResponse";
import asyncErrorHandler from "@/shared/asyncErrorHandler";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AuthUtils } from "./auth.utils";

// Controller function to handle user signup
const signup = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Call the signup service to create a new user
    const result = await AuthServices.signup(req);

    // Send a response with the created user data
    ApiResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "User created successfully!",
      data: result,
    });
  }
);

// Controller function to handle user login
const login = asyncErrorHandler(async (req: Request, res: Response) => {
  // Call the login service to authenticate the user
  const result = await AuthServices.login(req);
  const { accessToken, user } = result.data;
  //console.log("result user is:", result.data.user);

  // Set the refresh token into a cookie with secure and httpOnly options
  const cookieOptions = {
    secure: config.env === "production",
    httpOnly: true,
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
  const cookieOptions = {
    secure: config.env === "production",
    httpOnly: true,
  };
  // Clear the access token from cookies
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  // Optionally, you can also invalidate the token on the server side
  // For example, by adding it to a blacklist
  await AuthUtils.blacklistToken(token);

  // Send a response with the user data and tokens
  ApiResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User logged in successfully !",
  });
});

export const AuthController = {
  signup,
  login,
  logout,
};
