import { AuthController } from "@/auth/auth.controller";
import { loginRequestSchema, signupRequestSchema } from "@/auth/auth.schemas";
import validateRequest from "@/middlewares/validateRequest";
import express, { Router } from "express";

// Create a new Express router
const router = express.Router();

// Define the signup route
router.post(
  "/signup",
  validateRequest(signupRequestSchema),
  AuthController.signup
);

// Define the login route
router.post(
  "/login",
  validateRequest(loginRequestSchema),
  AuthController.login
);

// Define the logout route
router.post("/logout", AuthController.logout);

export const AuthRoutes:Router = router;
