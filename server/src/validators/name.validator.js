import { z } from 'zod';
import { errorResponse } from '../utils/response.js';

const nameSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(255, 'Name must not exceed 255 characters'),
});

const validateName = (req, res, next) => {
  try {
    nameSchema.parse(req.body);
    return next();
  } catch (err) {
    const errors = err?.issues || err?.errors;
    const msg = errors ? errors.map((e) => e.message).join(', ') : 'Invalid name';
    return errorResponse(res, msg, 400);
  }
};

export { validateName, nameSchema };
