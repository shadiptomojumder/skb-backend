import { NextFunction, Request, RequestHandler, Response } from "express";

const asyncErrorHandler =
  (fn: RequestHandler): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };

export default asyncErrorHandler;
