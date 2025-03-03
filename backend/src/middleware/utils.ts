import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async middleware to catch and forward any errors to next()
 * This solves the common issue with async Express middleware not handling rejections
 */
export const asyncMiddleware = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};