import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.js';

const parseInteger = (value: any) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'string') {
    return Number(value);
  }
  return value;
};

const commentCreateSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Comment body is required and must be at least 1 character')
    .max(5000, 'Comment body cannot exceed 5000 characters'),
  parent_id: z
    .preprocess(
      parseInteger,
      z.number().int().positive('Parent comment ID must be a positive integer')
    )
    .optional()
    .nullable(),
});

const commentUpdateSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Comment body is required and must be at least 1 character')
    .max(5000, 'Comment body cannot exceed 5000 characters'),
});

const validateCreateComment = (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = commentCreateSchema.parse(req.body);
    return next();
  } catch (err: any) {
    const errors = err?.issues || err?.errors;
    const msg = errors ? errors.map((e: any) => e.message).join(', ') : 'Invalid comment data';
    return errorResponse(res, msg, 400);
  }
};

const validateUpdateComment = (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = commentUpdateSchema.parse(req.body);
    return next();
  } catch (err: any) {
    const errors = err?.issues || err?.errors;
    const msg = errors ? errors.map((e: any) => e.message).join(', ') : 'Invalid comment data';
    return errorResponse(res, msg, 400);
  }
};

export { validateCreateComment, validateUpdateComment, commentCreateSchema, commentUpdateSchema };
