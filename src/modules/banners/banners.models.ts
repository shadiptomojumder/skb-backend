import mongoose from "mongoose";

const BannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
        },
        image: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

BannerSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v; // Optional: remove __v
    },
});

export const Banner = mongoose.model("Banner", BannerSchema);

const BannerImageSchema = new mongoose.Schema(
    {
        images: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

BannerImageSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v; // Optional: remove __v
    },
});

export const BannerImage = mongoose.model("BannerImage", BannerSchema);
