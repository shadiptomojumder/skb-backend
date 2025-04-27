import { Error as MongooseError } from 'mongoose';
import { IGenericErrorResponse } from '../interfaces/common';

const handleMongooseValidationError = (
  error: MongooseError.ValidationError
): IGenericErrorResponse => {
  const errors = Object.values(error.errors).map((err) => ({
    path: err.path,
    message: err.message,
  }));
  
  return {
    statusCode: 400,
    message: 'Validation Error',
    errorMessages: errors,
  };
};

export default handleMongooseValidationError;
