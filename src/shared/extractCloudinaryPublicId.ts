export const extractCloudinaryPublicId = (url: string): string => {
    const parts = url.split("/");
    const filenameWithExt = parts.pop() || ""; // Get last part (e.g., "image_name.jpg")
    const folder = parts.slice(7).join("/"); // Extract folder structure if any
    const filename = filenameWithExt?.split(".")[0]; // Remove file extension

    return folder ? `${folder}/${filename}` : filename; // Return full public ID
};
