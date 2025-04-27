import express, { Router } from "express";
import { categoriesController } from "./categories.controller";
import { upload } from "@/middlewares/multer.middleware";

const router = express.Router();

// Create a new category with an optional thumbnail upload
// router.post("",upload.single("thumbnail"), categoriesController.createCategory);

// Create a new category with optional thumbnail and logo uploads
router.post("", upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "logo", maxCount: 1 }]), categoriesController.createCategory);


// Get all categories
router.get("", categoriesController.getAllCategory);

// Get a specific category by ID
router.get("/:categoryId", categoriesController.getCategoryById);

// Update a category (thumbnail update is optional)
router.patch("/:categoryId",upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "logo", maxCount: 1 }]), categoriesController.updateCategory);

// Delete Single Category by ID
router.delete("/:categoryId", categoriesController.deleteSingleCategory);

// Delete Multiple Categories
router.delete("", categoriesController.deleteMultipleCategories);

export const CategoryRoutes:Router = router;
