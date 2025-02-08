import { User } from "@/modules/user/user.model";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";
import ApiError from "../errors/ApiError";
import { jwtHelpers } from "../helpers/jwtHelpers";
import { AuthUtils } from "@/modules/auth/auth.utils";

const auth =
  (...requiredRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get authorization token from cookies or headers
      const token =
        req.cookies?.accessToken || req.headers.authorization?.split(" ")[1]; // Bearer <token>
      //console.log("15.The accessToken is:", req.cookies?.accessToken);

      // Check if the token is missing
      if (!token) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "You are not authorized!");
      } else {
        console.log("You are authorized!");
      }

      // Check if the token is blacklisted
      const isBlacklisted = await AuthUtils.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Token is blacklisted");
      }

      // Verify token
      const decoded = jwtHelpers.verifyToken(
        token,
        config.jwt.secret as string
      ) as JwtPayload;

      if (!decoded) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid token");
      }
      //console.log("29.decoded dete is:", decoded);

      // Find the user by ID
      const user = await User.findById(decoded.userId).exec();
      if (!user) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found");
      }

      // checking if the user is already deleted

      // const status = user?.status;

      // if (status === 'BLOCKED') {
      //   throw new ApiError(StatusCodes.FORBIDDEN, 'This user is blocked !');
      // }

      // if (
      //   user.passwordChangedAt &&
      //   User.isJWTIssuedBeforePasswordChanged(
      //     user.passwordChangedAt,
      //     iat as number
      //   )
      // ) {
      //   throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized !');
      // }

      // Check user role
      if (requiredRoles && !requiredRoles.includes(decoded.userRole)) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "You are not authorized");
      }

      // Attach user to request object
      req.user = decoded as JwtPayload;
      next();
    } catch (error) {
      console.error("Error in auth middleware:", error);
      if (error instanceof jwt.JsonWebTokenError) {
        next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid token"));
      } else {
        next(error);
      }
    }
  };

export default auth;
