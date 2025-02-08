// Generate a SKU based on the product name, category, and an incrementing number (or unique id)
export const generateSku = (category: string, productName: string): string => {
    const categoryCode = category.substring(0, 4).toUpperCase(); // First 4 letters of the category
    const productPrefix = productName.substring(0, 4).toUpperCase(); // First 4 letters of the product name
    const uniqueId = Math.floor(Math.random() * 10000).toString().padStart(4, "0"); // Random unique ID
  
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
    "createdAt",
    "updatedAt",
  ];