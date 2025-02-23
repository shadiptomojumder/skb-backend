import fs from "fs/promises";

export async function deleteLocalFiles(filePaths: string | string[]): Promise<void> {
    try {
        // Convert single file path to an array for consistency
        const files = Array.isArray(filePaths) ? filePaths : [filePaths];

        // Use Promise.allSettled to handle individual file deletions
        const results = await Promise.allSettled(files.map(async (file) => {
            try {
                await fs.unlink(file);
                console.log(`Deleted: ${file}`);
            } catch (error) {
                console.error(`Failed to delete ${file}:`, error);
            }
        }));

        // Optional: Return failed deletions
        const failedFiles = results
            .filter(result => result.status === "rejected")
            .map((result, index) => files[index]);

        if (failedFiles.length > 0) {
            console.error("Some files could not be deleted:", failedFiles);
        }
    } catch (error) {
        console.error("Unexpected error deleting files:", error);
    }
}

// Usage examples:

// Deleting a single file
// deleteFiles("path/to/file1.jpg");

// Deleting multiple files
// deleteFiles(["path/to/file1.jpg", "path/to/file2.jpg", "path/to/file3.jpg"]);
