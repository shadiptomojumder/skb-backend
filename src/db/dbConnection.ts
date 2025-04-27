import config from "@/config";
import mongoose from "mongoose";
import { errorlogger, logger } from "../shared/logger";

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        console.log("Already connected to MongoDB.");
        return;
    }
    try {
        const connectionInstance = await mongoose.connect(
            config.database_url as string
        );
        logger.info(
            `MongoDB Connected! DB HOST: ${connectionInstance.connection.host}`
        );
        console.log(
            `MongoDB Connected !! DB-HOST: ${connectionInstance.connection.host} DB-NAME: ${connectionInstance.connection.name}`
        );
       // Sanitize and log the MongoDB URL
       const sanitizedUrl = (config.database_url ?? "").replace(/\/\/.*:.*@/, '//user:***@'); // Mask username and password
       console.log("MongoDB Connection String (Sanitized):", sanitizedUrl);  // Safely log the sanitized connection string
        // console.log("MongoDB Connection String:",connectionInstance.connection._connectionString);
    } catch (error) {
        console.log("MONGODB CONNECTION FAILD:", error);
        errorlogger.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};

export default connectDB;
