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
router.get("/:productId", productController.getProductById);

// Delete Single product by ID
router.delete("/:productId", productController.deleteSingleProduct);

// Delete Multiple products
router.delete("", productController.deleteMultipleProducts);



export const ProductRoutes: Router = router;
