import { z } from 'zod';
import { errorResponse } from '../utils/response.js';

const statusEnum = z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']);

const parseDate = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed;
};

const parseBudget = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    return parseFloat(value);
  }

  return value;
};

const projectCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Project name is required and must be at least 3 characters')
    .max(255, 'Project name cannot exceed 255 characters'),

  description: z.string().trim().optional(),

  status: statusEnum.optional(),

  owner_id: z
    .preprocess((value) => {
      if (typeof value === 'string' && value.trim() !== '') {
        return Number(value);
      }

      return value;
    }, z.number().int().positive('Owner ID must be a positive integer'))
    .optional(),

    //if start date is not provided, it will be set to the current date
  start_date: z
    .preprocess(parseDate, z.date({ invalid_type_error: 'Invalid start date' }))
    .default(() => new Date()),

  end_date: z.preprocess(parseDate, z.date({ invalid_type_error: 'Invalid end date' })).optional(),

  budget: z
  .string()
  .regex(
    /^\d{1,8}(\.\d{1,2})?$/,
    'Budget must be a valid DECIMAL(10,2)'
  )
  .transform(Number)
  .optional(),
});

const projectUpdateSchema = 
projectCreateSchema
.partial()


const validateCreateProject = (req, res, next) => {
  try {
    //assign validated data to req.body to store default values like date
    req.body=projectCreateSchema.parse(req.body);

    return next();
  } catch (err) {
    const errors = err?.issues || err?.errors;

    const msg = errors ? errors.map((e) => e.message).join(', ') : 'Invalid project data';

    return errorResponse(res, msg, 400);
  }
};

const validateUpdateProject = (req, res, next) => {
  try {
    projectUpdateSchema.parse(req.body);

    return next();
  } catch (err) {
    const errors = err?.issues || err?.errors;

    const msg = errors ? errors.map((e) => e.message).join(', ') : 'Invalid project data';

    return errorResponse(res, msg, 400);
  }
};

export { validateCreateProject, validateUpdateProject, projectCreateSchema, projectUpdateSchema };
