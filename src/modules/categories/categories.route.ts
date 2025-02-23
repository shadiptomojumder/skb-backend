import express, { Router } from "express";
import { categoriesController } from "./categories.controller";
import { upload } from "@/middlewares/multer.middleware";

const router = express.Router();

// Create a new category with an optional thumbnail upload
router.post("",upload.single("thumbnail"), categoriesController.createCategory);

// Get all categories
router.get("", categoriesController.getAllCategory);

// Get a specific category by ID
router.get("/:categoryId", categoriesController.getCategoryById);

// Update a category (thumbnail update is optional)
router.patch("/:categoryId",upload.single("thumbnail"), categoriesController.updateCategory);

// Delete a single or multiple categories
router.delete("/:id?", categoriesController.deleteCategory);

export const CategoryRoutes:Router = router;
