import { AuthController } from "@/auth/auth.controller";
import express, { Router } from "express";

// Create a new Express router
const router = express.Router();

// Define the signup route
router.post("/signup", AuthController.signup);

// Define the login route
router.post("/login", AuthController.login);

// Define the logout route
router.post("/logout", AuthController.logout);

export const AuthRoutes: Router = router;
