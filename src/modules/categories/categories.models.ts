import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            unique: true,
            maxlength: 50,
            index: true,
        },
        value: {
            type: String,
            required: true,
            unique: true,
        },
        logo: {
            type: String,
        },
        thumbnail: {
            type: String,
        },
    },
    {
        timestamps: true, // Automatically manages createdAt and updatedAt
    }
);

CategorySchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v; // Optional: remove __v
    },
});

const Category = mongoose.model("Category", CategorySchema);

export default Category;
