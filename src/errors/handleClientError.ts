import { Error as MongooseError } from 'mongoose';
import { IGenericErrorMessage } from '../interfaces/error';

const handleMongooseError = (error: any) => {
  let errors: IGenericErrorMessage[] = [];
  let message = "An unexpected error occurred.";
  let statusCode = 500;

  if (error instanceof MongooseError.ValidationError) {
    message = "Validation failed.";
    statusCode = 400;
    errors = Object.values(error.errors).map((err) => ({
      path: err.path,
      message: err.message,
    }));
  } else if (error instanceof MongooseError.CastError) {
    message = `Invalid value for ${error.path}.`;
    statusCode = 400;
    errors = [{ path: error.path, message }];
  } else if (error.code === 11000) {
    message = "Duplicate key error.";
    statusCode = 409;
    errors = Object.keys(error.keyValue).map((key) => ({
      path: key,
      message: `${key} must be unique.`,
    }));
  } else if (error.name === 'DocumentNotFoundError') {
    message = "Requested document not found.";
    statusCode = 404;
    errors = [{ path: "", message }];
  } else if (error.name === 'MongoServerError') {
    message = "Database server error.";
    statusCode = 500;
  }

  return {
    statusCode,
    message,
    errorMessages: errors.length ? errors : [{ path: "", message }],
  };
};

export default handleMongooseError;
