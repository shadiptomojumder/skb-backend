import { Error as MongooseError } from "mongoose";
import { IGenericErrorMessage } from "../interfaces/error";

const handleMongooseError = (error: any) => {
    let errors: IGenericErrorMessage[] = [];
    let message = "An unexpected error occurred.";
    let statusCode = 500;

    // Logging the error using console in development and production
    if (error instanceof MongooseError.ValidationError) {
        message = "Validation failed.";
        statusCode = 400;
        errors = Object.values(error.errors).map((err) => ({
            path: err.path,
            message: err.message,
        }));
        console.error(
            `Validation failed on field: ${errors
                .map((e) => e.path)
                .join(", ")}`
        );
    } else if (error instanceof MongooseError.CastError) {
        message = `Invalid value for ${error.path}.`;
        statusCode = 400;
        errors = [{ path: error.path, message }];
        console.error(`Cast error on field: ${error.path}`);
    } else if (error.code === 11000) {
        message = "Duplicate key error.";
        statusCode = 409;
        errors = Object.keys(error.keyValue).map((key) => ({
            path: key,
            message: `${key} must be unique.`,
        }));
        console.error(`Duplicate key error: ${JSON.stringify(error.keyValue)}`);
    } else if (error.name === "DocumentNotFoundError") {
        message = "Requested document not found.";
        statusCode = 404;
        errors = [{ path: "", message }];
        console.warn("Document not found");
    } else if (error.name === "MongoServerError") {
        message = "Database server error.";
        statusCode = 500;
        console.error("MongoDB server error");
    }

    return {
        statusCode,
        message,
        errorMessages: errors.length ? errors : [{ path: "", message }],
    };
};

export default handleMongooseError;
