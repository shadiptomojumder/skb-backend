import { upload } from "@/middlewares/multer.middleware";
import express, { Router } from "express";
import { bannersController } from "./banners.controller";

const router = express.Router();

// Create a new banner
router.post("", upload.single("image"), bannersController.createBanner);

// Update a category
router.patch(
    "/:bannerId",
    upload.single("image"),
    bannersController.updateBanner
);

// Get all categories
router.get("", bannersController.getAllCategory);

// Get category by Id
router.get("/:id", bannersController.singleCategory);

// Delete a category by ID
router.delete("/:id?", bannersController.deleteCategory);

export const BannerRoutes: Router = router;
