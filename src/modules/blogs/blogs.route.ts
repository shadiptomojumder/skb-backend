import { upload } from "./../../middlewares/multer.middleware";
import express, { Router } from "express";
import { blogsController } from "./blogs.controller";

const router = express.Router();

// Create a new blog with an image upload
router.post("", upload.single("image"), blogsController.createBlog);

// Update an existing blog (image update is optional)
router.patch(
    "/:blogId",
    upload.single("image"),
    blogsController.updateBlog
);

// Get all blogs
router.get("", blogsController.getAllBlogs);

// Get a specific blog by ID
router.get("/:blogId", blogsController.getBlogById);

// Delete a blog by ID
router.delete("/:blogId", blogsController.deleteSingleBlog);

// Delete multiple blogs
router.delete("", blogsController.deleteMultipleBlogs);

export const BlogRoutes: Router = router;