import cloudinary, {
    deleteFromCloudinary,
    uploadMultipleOnCloudinary,
} from "@/shared/cloudinary";
import { extractCloudinaryPublicId } from "@/shared/extractCloudinaryPublicId";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiError";

import mongoose from "mongoose";
import { Banner } from "./banners.models";
import { bannerUpdateSchema } from "./banners.schemas";

// Function to create a new Banner
const createBanner = async (req: Request) => {
    try {
        // Determine the order for the new banner (last in sequence)
        const lastBanner = await Banner.findOne().sort({ order: -1 });
        const newOrder = lastBanner ? lastBanner.order + 1 : 1;

        // Create a new Banner in the database
        const banner = await Banner.create({
            title: `Banner #${newOrder}`,
            image: "",
            order: newOrder,
        });

        return banner;
    } catch (error) {
        console.log("The createBanner Error is:", error);

        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

// Function to update an existing Banner
const updateBanner = async (req: Request) => {
    try {
        // Banner Id
        const { bannerId } = req.params;

        // Validate the request body against the Banner update schema
        const parseBody = bannerUpdateSchema.safeParse(req.body);

        // If validation fails, collect error messages and throw a BAD_REQUEST error
        if (!parseBody.success) {
            const errorMessages = parseBody.error.errors
                .map((error) => error.message)
                .join(",");
            throw new ApiError(StatusCodes.BAD_REQUEST, errorMessages);
        }

        // Find the existing category
        const existingBanner = await Banner.findById(bannerId);
        if (!existingBanner) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Banner not found");
        }

        // Update the banner with the provided data
        const updatedBanner = await Banner.findByIdAndUpdate(bannerId, {
            image: parseBody.data.image,
            isActive: parseBody.data.isActive,
        });

        return updatedBanner;
    } catch (error) {
        console.log("Update Banner Error: ", error);

        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

// Function to get all banners
const getAllBanners = async (req: Request) => {
    try {
        // Retrieve all banners with all fields from the database
        const banners = await Banner.find();
        if (!banners) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "banners not found!!");
        }

        return banners;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

// Function to get a single banner by ID
const getBannerById = async (req: Request) => {
    try {
        // Banner Id
        const { bannerId } = req.params;

        // ✅ Check if bannerId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(bannerId)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid banner ID");
        }

        // Retrieve the banner with the specified ID from the database
        const banner = await Banner.findById(bannerId);

        // If the banner is not found, throw a NOT_FOUND error
        if (!banner) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Banner not found");
        }

        return banner;
    } catch (error) {
        console.log("GetBannerById Error:", error);

        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

// Function to delete a banner by ID
const deleteBanners = async (req: Request) => {
    try {
        const { bannerId } = req.params;
        const { ids } = req.body;

        if (bannerId) {
            // Find the Banner to get the image (if exists)
            const banner = await Banner.findById(bannerId);
            if (!banner) {
                throw new ApiError(StatusCodes.NOT_FOUND, "Banner not found");
            }

            // First, delete the Banner from the database
            const deletedBanner = await Banner.findByIdAndDelete(bannerId);
            if (!deletedBanner) {
                throw new ApiError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to delete Banner from database"
                );
            }

            // Delete image from Cloudinary if the banner has a image
            if (banner.image) {
                const publicId = extractCloudinaryPublicId(banner.image);
                await deleteFromCloudinary(publicId);
            }

            return { message: "Banner deleted successfully" };
        } else if (ids && Array.isArray(ids)) {
            // Validate that 'ids' is an array and contains valid values
            if (!Array.isArray(ids) || ids.length === 0) {
                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    "Invalid request. 'ids' must be a non-empty array"
                );
            }

            // Fetch all banners to ensure they exist
            const existingBanners = await Banner.find({
                _id: { $in: ids },
            });
            if (existingBanners.length !== ids.length) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    "One or more banner IDs do not exist"
                );
            }

            // Delete banners from database first
            const result = await Banner.deleteMany({ _id: { $in: ids } });
            console.log("The delete result is:", result);
            if (result.deletedCount !== ids.length) {
                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    "Some banners could not be deleted"
                );
            }
            console.log("The delete result is:", result);

            console.log("The existingBanners is:", existingBanners);

            // ✅ Delete associated images from Cloudinary
            await Promise.all(
                existingBanners.map(async (banner) => {
                    if (banner.image) {
                        const publicId = extractCloudinaryPublicId(
                            banner.image
                        );
                        await deleteFromCloudinary(publicId);
                    }
                })
            );

            return {
                message: `${result.deletedCount} banners deleted successfully`,
            };
        } else {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid request");
        }
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

// Function to delete a single banner by ID
const deleteSingleBanner = async (req: Request) => {
    try {
        const { bannerId } = req.params;

        if (!bannerId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Banner ID is required");
        }

        const banner = await Banner.findById(bannerId);
        if (!banner) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Banner not found");
        }

        const deletedBanner = await Banner.findByIdAndDelete(bannerId);
        if (!deletedBanner) {
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                "Failed to delete banner from database"
            );
        }

        if (banner.image) {
            const publicId = extractCloudinaryPublicId(banner.image);
            await deleteFromCloudinary(publicId);
        }

        return { message: "Banner deleted successfully" };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred while deleting the banner"
        );
    }
};

// Function to delete multiple banners by IDs
const deleteMultipleBanners = async (req: Request) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "'ids' must be a non-empty array"
            );
        }

        const existingBanners = await Banner.find({ _id: { $in: ids } });

        if (existingBanners.length !== ids.length) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                "One or more banner IDs do not exist"
            );
        }

        const result = await Banner.deleteMany({ _id: { $in: ids } });

        if (result.deletedCount !== ids.length) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Some banners could not be deleted"
            );
        }

        await Promise.all(
            existingBanners.map(async (banner) => {
                if (banner.image) {
                    const publicId = extractCloudinaryPublicId(banner.image);
                    await deleteFromCloudinary(publicId);
                }
            })
        );

        return {
            message: `${result.deletedCount} banners deleted successfully`,
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred while deleting banners"
        );
    }
};


// Function to create a new product
const uploadBannerImages = async (req: Request) => {
    try {
        // If user dont send any image then show an error
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "At least one image is required to create a product."
            );
        }

        // Generate an array of strings for file path
        const filePaths = (req.files as Express.Multer.File[]).map(
            (file) => file.path
        );

        // Upload images to Cloudinary
        const uploadResults = await uploadMultipleOnCloudinary(
            filePaths,
            "banners"
        );

        // Transform it into an array of URLs
        const imageUrls = uploadResults.map((image) => image.url);
        console.log("The imageUrls  is:", imageUrls);

        return imageUrls;
    } catch (error) {
        console.error("Error in createProduct:", error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred"
        );
    }
};

const getBannerImages = async () => {
    try {
        const result = await cloudinary.api.resources({
            type: "upload",
            prefix: "banners/", // Fetch only images from 'banners' folder
            resource_type: "image", // Ensure only images are retrieved
            max_results: 50, // Limit number of images
        });

        console.log("The result is:", result);

        return result.resources.map(
            (file: { secure_url: string; public_id: string }) => ({
                imageURL: file.secure_url,
                public_id: file.public_id,
            })
        );
    } catch (error) {
        console.error("Error fetching banner images:", error);
        throw new Error("Failed to fetch images from Cloudinary");
    }
};

export const BannerService = {
    createBanner,
    updateBanner,
    getAllBanners,
    deleteBanners,
    deleteSingleBanner,
    deleteMultipleBanners,
    getBannerById,
    uploadBannerImages,
    getBannerImages,
};
