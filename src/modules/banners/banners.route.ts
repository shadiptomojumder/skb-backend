import { upload } from "@/middlewares/multer.middleware";
import express, { Router } from "express";
import { bannersController } from "./banners.controller";

const router = express.Router();

// Create a new banner
router.post("", upload.single("image"), bannersController.createBanner);

// Update a Banner
router.patch(
    "/:bannerId",
    upload.single("image"),
    bannersController.updateBanner
);

// Get all Banners
router.get("", bannersController.getAllBanners);

// Get Banner by Id
router.get("/:bannerId", bannersController.getBannerById);

// Delete Banners
router.delete("/:bannerId?", bannersController.deleteBanners);

export const BannerRoutes: Router = router;
