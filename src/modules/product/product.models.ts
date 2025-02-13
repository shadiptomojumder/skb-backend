import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            index: true,
        },
        price: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            default: 0.0,
        },
        discount: {
            type: Number,
            min: 0,
            max: 100,
        },
        finalPrice: {
            type: mongoose.Schema.Types.Decimal128,
            default: 0.0,
        },
        quantity: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        stock: {
            type: Number,
            default: 0,
        },
        images: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
        },
        sku: {
            type: String,
            unique: true,
            sparse: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (doc, ret) => {
                ret.price = parseFloat(ret.price.toString());
                ret.finalPrice = parseFloat(ret.finalPrice.toString());
                return ret;
            },
        },
    }
);

ProductSchema.index({ name: 1 }); // Text Search Optimization
ProductSchema.index({ category: 1 }); // Faster Category Lookups
ProductSchema.index({ sku: 1 });
ProductSchema.index({ price: 1 }); // Price-based Filtering Optimization
ProductSchema.index({ createdAt: -1 }); // Sorting Optimization



const Product = mongoose.model("Product", ProductSchema);

export default Product;
