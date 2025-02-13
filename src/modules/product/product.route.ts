import express from "express";
import { productController } from "./product.controller";
import { upload } from "@/middlewares/multer.middleware";

const router = express.Router();

// Create a new Product
router.post("/create",upload.array("images",10), productController.createProduct);

// Update a Product
router.patch("/:id", productController.updateProduct);

// Get all products with filters
router.get("/all", productController.getAllProduct);

// Get a single product by ID
router.get("/:id", productController.getSingleProduct);

// Delete a single product by ID
router.delete("/:id?", productController.deleteProduct);

export const ProductRoutes = router;
