import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import { v4 as uuidv4 } from "uuid";

// Configure storage for Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const tempDir = path.join(__dirname, "../public");
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "_");
        const uniqueName = `${uuidv4()}-${Date.now()}-${baseName}${ext}`;
        cb(null, uniqueName);
    }
});

// File filter to allow only images and videos
const fileFilter = (req:Request, file:Express.Multer.File, cb:FileFilterCallback) => {
    const fileTypes = /jpeg|jpg|png|webp|mp4|mov|avi/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error("Only images and videos are allowed"));
    }
};

// Multer upload configuration
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 50 } // 50MB limit
});