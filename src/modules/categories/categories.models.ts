import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            unique: true,
            maxlength: 50,
        },
        value: {
            type: String,
            required: true,
            unique: true,
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
    }
});

CategorySchema.index({ title: 1 });
CategorySchema.index({ value: 1 });

const Category = mongoose.model("Category", CategorySchema);

export default Category;
