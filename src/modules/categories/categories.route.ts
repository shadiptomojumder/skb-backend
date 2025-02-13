import express, { Router } from "express";
import { productController } from "./categories.controller";

const router = express.Router();

// Create a new category
router.post("", productController.createCategory);

// Get all categories
router.get("/all", productController.getAllCategory);

// Update a category
router.patch("/:id", productController.updateCategory);

// Delete a category by ID
router.delete("/:id", productController.deleteCategory);

export const CategoryRoutes:Router = router;
