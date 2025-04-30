import Product from "./product.models";
import fs from "fs";

// Generate a SKU based on the product name, category, and an incrementing number (or unique id)
export const generateSkuOld = (category: string, productName: string): string => {
    const categoryCode = category.substring(0, 4).toUpperCase(); // First 4 letters of the category
    const productPrefix = productName.substring(0, 4).toUpperCase(); // First 4 letters of the product name
    const uniqueId = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0"); // Random unique ID

    return `${categoryCode}-${productPrefix}-${uniqueId}`; // Example: "NIKE-AIRM-0012"
};

// Product filters
export const productFilterAbleFields: string[] = [
    "id",
    "name",
    "price",
    "stock",
    "sku",
    "category",
    "isActive",
    "isWeekendDeal",
    "isFeatured",
    "createdAt",
    "updatedAt",
];

// Function to generate a unique SKU for a product using the provided category and product name
export const generateSku = async (): Promise<string> => {
    let sku = Math.floor(10000 + Math.random() * 90000).toString(); // Generate a 5-digit number
  
    // Ensure SKU is unique in the database
    let existingProduct = await Product.findOne({ sku });
    while (existingProduct) {
      sku = Math.floor(10000 + Math.random() * 90000).toString(); // Generate a new 5-digit number
      existingProduct = await Product.findOne({ sku });
    }
  
    return sku;
  };

// Function to delete local files
export const deleteLocalFiles = (filePaths: string[]) => {
    filePaths.forEach((filePath) => {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error("Error deleting file:", filePath, err);
            } else {
                console.log("Deleted local file:", filePath);
            }
        });
    });
};
