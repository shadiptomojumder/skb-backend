import { Server } from "http";
import app from "./app";
import config from "./config";
import connectDB from "./db/dbConnection";
import { errorlogger, logger } from "./shared/logger";

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start the server
    const server: Server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });

    // Function to handle server shutdown
    const exitHandler = () => {
      if (server) {
        server.close(() => {
          logger.info("Server closed");
        });
      }
      process.exit(1);
    };

    // Function to handle unexpected errors
    const unexpectedErrorHandler = (error: unknown) => {
      errorlogger.error(error);
      exitHandler();
    };

    // Listen for uncaught exceptions and handle them
    process.on("uncaughtException", unexpectedErrorHandler);

    // Listen for unhandled promise rejections and handle them
    process.on("unhandledRejection", unexpectedErrorHandler);

    // Listen for SIGTERM signal and handle graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received");
      if (server) {
        server.close(() => {
          logger.info("Server closed due to SIGTERM");
        });
      }
    });
  } catch (error) {
    // Log error and exit process if server fails to start
    errorlogger.error("Failed to start the server:", error);
    process.exit(1);
  }
}

startServer();
