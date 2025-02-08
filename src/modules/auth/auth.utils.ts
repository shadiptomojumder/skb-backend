import { jwtHelpers } from "@/helpers/jwtHelpers";
import * as bcrypt from "bcrypt";
import { Secret } from "jsonwebtoken";
import { BlacklistedToken } from "./auth.model";

// Function to compare plain text password with hashed password
const comparePasswords = async (
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
    throw new Error("Error comparing passwords");
  }
};

// Function to generate a JWT token
const generateToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expiresIn: string
) => {
  return jwtHelpers.createToken(payload, secret, expiresIn);
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
