import config from "@/config";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises"; // Use async file system methods for better performance

cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret,
});

interface UploadResponse {
    url: string;
    [key: string]: any;
}

export const uploadSingleOnCloudinary = async (
    localFilePath: string,
    folderName?: string
): Promise<UploadResponse | null> => {
    if (!localFilePath) return null;

    try {
        const response: UploadResponse = await cloudinary.uploader.upload(
            localFilePath,
            {
                resource_type: "auto",
                folder: folderName || "products", // Use provided folderName or default,
            }
        );

        return response;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw new Error("Failed to upload file to Cloudinary");
    } finally {
        try {
            await fs.unlink(localFilePath); // Asynchronous file deletion
        } catch (unlinkError) {
            console.warn("Failed to delete local file:", unlinkError);
        }
    }
};

export const uploadSingleOnCloudinaryBase64 = async (
    base64: string
): Promise<UploadResponse | null> => {
    if (!base64) return null;

    try {
        return await cloudinary.uploader.upload(base64, {
            resource_type: "auto",
            folder: "categories",
        });
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw new Error("Failed to upload image to Cloudinary");
    }
};

// Function to Upload Multiple Files to Cloudinary
export const uploadMultipleOnCloudinary = async (
    localFilePaths: string[]
): Promise<UploadResponse[]> => {
    if (!localFilePaths || localFilePaths.length === 0) return [];

    try {
        const uploadPromises = localFilePaths.map(async (filePath) => {
            const response = await cloudinary.uploader.upload(filePath, {
                resource_type: "auto",
                folder: "products", // Store in a specific folder
            });
            return { url: response.secure_url, public_id: response.public_id };
        });

        const uploadResponses = await Promise.all(uploadPromises);
        return uploadResponses;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw new Error("Failed to upload files to Cloudinary");
    } finally {
        // Delete temporary files after uploading
        const deletePromises = localFilePaths.map(async (filePath) => {
            try {
                await fs.unlink(filePath);
            } catch (unlinkError) {
                console.warn("Failed to delete local file:", unlinkError);
            }
        });

        await Promise.all(deletePromises);
    }
};

// Function to Upload Multiple Base64 Images to Cloudinary
export const uploadMultipleOnCloudinaryBase64 = async (
    base64Images: string[]
): Promise<UploadResponse[]> => {
    if (!base64Images || base64Images.length === 0) return [];

    try {
        const uploadPromises = base64Images.map(async (base64) => {
            const response = await cloudinary.uploader.upload(base64, {
                resource_type: "auto",
                folder: "products", // Store in a specific folder
            });
            return { url: response.secure_url, public_id: response.public_id };
        });

        const uploadResponses = await Promise.all(uploadPromises);
        return uploadResponses;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw new Error("Failed to upload images to Cloudinary");
    }
};

export const deleteFromCloudinary = async (
    publicId: string
): Promise<{ success: boolean; result?: any; error?: string }> => {
    try {
        if (!publicId) {
            throw new Error("Public ID is required for deletion.");
        }

        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result !== "ok") {
            throw new Error(
                `Failed to delete image from Cloudinary: ${result.result}`
            );
        }

        console.log("Cloudinary delete successful:", result);
        return { success: true, result };
    } catch (error: any) {
        console.error("Cloudinary delete error:", error.message);
        return { success: false, error: error.message };
    }
};
