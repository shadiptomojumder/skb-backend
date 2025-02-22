import { upload } from "@/middlewares/multer.middleware";
import express, { Router } from "express";
import { productController } from "./product.controller";

const router = express.Router();

// Create a new Product
router.post("", upload.array("images", 10), productController.createProduct);

// Update a Product
router.patch(
    "/:productId",
    upload.array("images", 10),
    productController.updateProduct
);
// Delete product images
router.delete("/:productId/image", productController.deleteProductImage);

// Get all products with filters
router.get("", productController.getAllProduct);

// Get a single product by ID
router.get("/:id", productController.getSingleProduct);

// Delete a single product by ID
router.delete("/:id?", productController.deleteProduct);



export const ProductRoutes: Router = router;
