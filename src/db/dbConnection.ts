import mongoose from "mongoose";
import { errorlogger, logger } from "../shared/logger";
import config from "@/config";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      config.database_url as string
    );
    console.log(`\n MongoDB Connected !! DB HOST: ${connectionInstance.connection.host}`);
    logger.info(
      `MongoDB Connected! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB CONNECTION FAILD", error);
    errorlogger.error("MongoDB connection failed", error);
    process.exit(1);
  }
};

export default connectDB;
