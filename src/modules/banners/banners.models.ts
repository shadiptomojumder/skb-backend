import mongoose from "mongoose";

const BannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            unique: true,
            maxlength: 50,
        },
        image: {
            type: String,
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
    }
});


const Banner = mongoose.model("Banner", BannerSchema);

export default Banner;
