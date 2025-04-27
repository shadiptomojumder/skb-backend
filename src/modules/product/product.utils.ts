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
export const generateSku = async (category: string, productName: string): Promise<string> => {
  const categoryCode = category.substring(0, 3).toUpperCase(); // First 3 letters of category
  const productCode = productName.substring(0, 3).toUpperCase(); // First 3 letters of product name
  const timestamp = Date.now().toString(36).slice(-4); // Unique timestamp (Base36, last 4 chars)
  
  let uniqueId = Math.floor(1000 + Math.random() * 9000).toString(); // Generate a 4-digit random number
  let sku = `${categoryCode}-${productCode}-${timestamp}-${uniqueId}`; // Example: "ELE-LAP-X1A3-3456"

  // Ensure SKU is unique in the database
  let existingProduct = await Product.findOne({ sku });
  while (existingProduct) {
      uniqueId = Math.floor(1000 + Math.random() * 9000).toString(); // Generate new random number
      sku = `${categoryCode}-${productCode}-${timestamp}-${uniqueId}`;
      existingProduct = await Product.findOne({ sku }); // Check again
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
