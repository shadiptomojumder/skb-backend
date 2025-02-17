import express, { Router } from "express";
import { categoriesController } from "./categories.controller";
import { upload } from "@/middlewares/multer.middleware";

const router = express.Router();

// Create a new category
router.post("",upload.single("thumbnail"), categoriesController.createCategory);

// Get all categories
router.get("", categoriesController.getAllCategory);

// Get category by Id
router.get("/:id", categoriesController.singleCategory);

// Update a category
router.patch("/:id",upload.single("thumbnail"), categoriesController.updateCategory);

// Delete a category by ID
router.delete("/:id", categoriesController.deleteCategory);

export const CategoryRoutes:Router = router;
