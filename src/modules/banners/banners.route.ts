import express, { Router } from "express";
import { upload } from "@/middlewares/multer.middleware";
import { bannersController } from "./banners.controller";

const router = express.Router();

// Create a new banner
router.post("",upload.single("thumbnail"), bannersController.createCategory);

// Get all categories
router.get("", bannersController.getAllCategory);

// Get category by Id
router.get("/:id", bannersController.singleCategory);

// Update a category
router.patch("/:id",upload.single("thumbnail"), bannersController.updateCategory);

// Delete a category by ID
router.delete("/:id?", bannersController.deleteCategory);

export const bannerRoutes:Router = router;
