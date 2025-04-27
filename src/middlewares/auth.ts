import { AuthUtils, verifyToken } from "@/modules/auth/auth.utils";
import { User } from "@/modules/user/user.model";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import ApiError from "../errors/ApiError";

// Extract token from request
const extractToken = (req: Request): string | null => {
    if (req.cookies?.accessToken) return req.cookies.accessToken;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authHeader.split(" ")[1];
    }
    return null;
};

const auth =
    (...requiredRoles: string[]) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Get authorization token from cookies or headers
            const token = extractToken(req);
            if (!token)
                throw new ApiError(
                    StatusCodes.UNAUTHORIZED,
                    "Token is missing"
                );

            // Check if the token is blacklisted
            const isBlacklisted = await AuthUtils.isTokenBlacklisted(token);
            if (isBlacklisted) {
                throw new ApiError(
                    StatusCodes.UNAUTHORIZED,
                    "Token is blacklisted"
                );
            }

            // Verify token
            const decoded = verifyToken(token);
            if (!decoded) {
                throw new ApiError(
                    StatusCodes.UNAUTHORIZED,
                    "You are not authorized.Invalid token"
                );
            }
            console.log("29.decoded dete is:", decoded);

            // Find user in database
            const user = await User.findById(decoded.id).exec();
            if (!user)
                throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found");

            // Check required roles
            if (
                requiredRoles.length > 0 &&
                (!decoded.role || !requiredRoles.includes(decoded.role))
            ) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    "You are not authorized"
                );
            }

            // Attach user to request object
            req.user = decoded;
            next();
        } catch (error) {
            console.error("Error in auth middleware:", error);

            if (error instanceof jwt.JsonWebTokenError) {
                next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid token"));
            } else if (error instanceof jwt.TokenExpiredError) {
                next(
                    new ApiError(
                        StatusCodes.UNAUTHORIZED,
                        "Token expired, please log in again"
                    )
                );
            } else {
                next(error);
            }
        }
    };

export default auth;
