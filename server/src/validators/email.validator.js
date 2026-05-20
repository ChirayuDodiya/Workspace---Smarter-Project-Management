import { z } from 'zod';
import { errorResponse } from '../utils/response.js';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const validateEmail = (req, res, next) => {
  try {
    emailSchema.parse(req.body);
    return next();
  } catch (err) {
    const errors = err?.issues || err?.errors;
    const msg = errors ? errors.map((e) => e.message).join(', ') : 'Invalid email';
    return errorResponse(res, msg, 400);
  }
};

export { validateEmail, emailSchema };
