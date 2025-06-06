import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateRequest(schema: {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateUserId(req: Request, res: Response, next: NextFunction) {
  const userId = parseInt(req.params.userId);
  
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ 
      message: "Invalid user ID format",
      details: "User ID must be a positive integer"
    });
  }
  
  req.params.userId = userId.toString();
  next();
}