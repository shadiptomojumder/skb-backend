import { upload } from "@/middlewares/multer.middleware";
import express, { Router } from "express";
import { bannersController } from "./banners.controller";

const router = express.Router();

// Create a new banner with an image upload
router.post("", upload.single("image"), bannersController.createBanner);

// Update an existing banner (image update is optional)
router.patch(
    "/:bannerId",
    upload.single("image"),
    bannersController.updateBanner
);

// Get all Banners
router.get("", bannersController.getAllBanners);

// Get a specific banner by ID
// router.get("/:bannerId", bannersController.getBannerById);

// Get a specific banner by ID
router.post(
    "/images",
    upload.array("images", 10),
    bannersController.uploadBannerImages
);
router.get("/images", bannersController.getBannerImages);

// Delete Banner by ID
router.delete("/:bannerId", bannersController.deleteSingleBanner);

// Delete Multiple Banners
router.delete("", bannersController.deleteMultipleBanners);



export const BannerRoutes: Router = router;
