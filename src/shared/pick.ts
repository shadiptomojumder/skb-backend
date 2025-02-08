// Define the pick function with generic types T and k
const pick = <T extends Record<string, unknown>, k extends keyof T>(
  obj: T, // The source object from which to pick properties
  keys: k[] // An array of keys to pick from the source object
): Partial<T> => {
  // Initialize an empty object to store the picked properties
  const finalObj: Partial<T> = {};

  // Iterate over the array of keys
  for (const key of keys) {
    // Check if the key exists in the source object
    if (obj && Object.hasOwnProperty.call(obj, key)) {
      // Add the key and its value to the final object
      finalObj[key] = obj[key];
    }
  }

  // Return the final object containing the picked properties
  return finalObj;
};

// Export the pick function as the default export
export default pick;
