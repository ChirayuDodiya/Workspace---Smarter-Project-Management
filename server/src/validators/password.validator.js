import { z } from 'zod';
import { errorResponse } from '../utils/response.js';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain uppercase, lowercase and number'),
  password_confirmation: z.string().optional(),
});

const validatePassword = (req, res, next) => {
  try {
    passwordSchema.parse(req.body);

    if (req.body.password_confirmation !== undefined) {
      if (req.body.password !== req.body.password_confirmation) {
        return errorResponse(res, 'Password and password_confirmation do not match', 400);
      }
    }

    return next();
  } catch (err) {
    const errors = err?.issues || err?.errors;
    const msg = errors ? errors.map((e) => e.message).join(', ') : 'Invalid password';
    return errorResponse(res, msg, 400);
  }
};

export { validatePassword, passwordSchema };
