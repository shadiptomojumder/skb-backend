import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { StatusCodes } from "http-status-codes";
import config from "./config";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import routes from "./routes";
import { logger } from "./shared/logger";

const app: Application = express();

// Apply security middlewares
app.use(helmet());
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    })
);

// interface CorsOptions {
//   origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
//   credentials: boolean;
// }

// CORS configuration
const corsOptions = {
    origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void
    ) => {
        if (config.allowedOrigins.includes(origin!) || !origin) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
};

app.use(cors(corsOptions));

app.use(cookieParser());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API routes
app.use("/api/v1", routes);

// Test endpoint to verify server is working
app.get("/test", async (req: Request, res: Response) => {
    res.status(200).json({
        message: "SKB BEST Server is working....!",
    });
});
app.get("/", (req, res) => {
    res.send("SKB BEST Server is running..!");
});

// Global error handler middleware
app.use(globalErrorHandler);

// Handle 404 - Not Found errors
app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Not Found",
        errorMessages: [
            {
                path: req.originalUrl,
                message: "API Not Found",
            },
        ],
    });
    next();
});

// Graceful shutdown on SIGTERM signal
process.on("SIGTERM", async () => {
    logger.info("SIGTERM signal received: closing HTTP server");
    process.exit(0);
});

export default app;
