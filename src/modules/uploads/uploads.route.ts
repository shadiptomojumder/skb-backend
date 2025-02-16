import express, { Router } from "express";
import { UploadController } from "./uploads.controller";
import { upload } from "@/middlewares/multer.middleware";


const router = express.Router();

// Create a new category
router.post("",upload.array("images",10), UploadController.uploadFiles);


export const UploadRoutes:Router = router;
