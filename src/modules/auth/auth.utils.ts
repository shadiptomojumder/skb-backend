import config from "@/config";
import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { BlacklistedToken } from "./auth.model";

import bcrypt from "bcryptjs";

// Function to convert plain text password to hashed password
export const hashedPassword = async (password: string): Promise<string> => {
    const saltRounds = 10;
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hashed = await bcrypt.hash(password, salt);
        return hashed;
    } catch (error) {
        throw new Error("Error hashing password");
    }
};


// Function to compare plain text password with hashed password
export const comparePasswords = async (
    plainTextPassword: string,
    hashedPassword: string
): Promise<boolean> => {
    try {
        const match: boolean = await bcrypt.compare(
            plainTextPassword,
            hashedPassword
        );
        return match;
    } catch (error) {
        throw new Error("Error while comparing passwords");
    }
};

interface CustomJwtPayload extends JwtPayload {
  id?: string | null;
  email?: string |null ;
  role?: string | null;
}
type UnitAnyCase = "s" | "m" | "h" | "d";

export type StringValue =
    | `${number}` // e.g., "60"
    | `${number}${UnitAnyCase}` // e.g., "60s", "2h", "7d"
    | `${number} ${UnitAnyCase}`; // e.g., "60 s", "2 h"

// Function to generate a JWT token
export const generateToken = (payload: CustomJwtPayload): string => {
    if (!config.jwt.secret || !config.jwt.expires_in) {
        throw new Error(
            "JWT secret or expiration time is not defined in config"
        );
    }

    try {
        const signOptions: SignOptions = {
            algorithm: "HS256",
            expiresIn: config.jwt.expires_in,
        };
        return jwt.sign(payload, config.jwt.secret as Secret, signOptions);
    } catch (error) {
        console.log("Error generating:", error);

        throw new Error("Error generating token");
    }
};

// Function to verify a JWT token
export const verifyToken = (token: string): CustomJwtPayload => {
    if (!config.jwt.secret) {
        throw new Error("JWT secret is not defined in config");
    }
    try {
        return jwt.verify(token, config.jwt.secret as Secret) as CustomJwtPayload;
    } catch (error) {
        throw new Error("Invalid or expired token");
    }
};

// Function to blacklist a token
const blacklistToken = async (token: string) => {
    await BlacklistedToken.create({ token });
};

// Function to check if a token is blacklisted
const isTokenBlacklisted = async (token: string) => {
    const blacklisted = await BlacklistedToken.findOne({ token });
    // Return true if the token is found, otherwise false
    return !!blacklisted;
};

export const AuthUtils = {
    comparePasswords,
    generateToken,
    blacklistToken,
    isTokenBlacklisted,
};
