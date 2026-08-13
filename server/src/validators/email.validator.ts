import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.js';

const emailSchema = z.object({
  email: z
    .string()
    .nonempty('Email is required')
    .trim()
    .max(255, 'Email must not exceed 255 characters')
    .email('Invalid email address')
    .transform((email) => email.toLowerCase()),
});

const validateEmail = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = emailSchema.parse(req.body);
    req.body.email = validated.email;
    return next();
  } catch (err: any) {
    const errors = err?.issues || err?.errors;
    const msg = errors ? errors.map((e: any) => e.message).join(', ') : 'Invalid email';
    return errorResponse(res, msg, 400);
  }
};

export { validateEmail, emailSchema };
