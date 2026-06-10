import { z } from 'zod';
import { errorResponse } from '../utils/response.js';

const statusEnum = z.enum(['todo', 'in_progress', 'in_review', 'done']);
const priorityEnum = z.enum(['low', 'medium', 'high', 'critical']);

const parseDate = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed;
};

const parseInteger = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    return Number(value);
  }

  return value;
};

const parseDecimal = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    return Number(value);
  }

  return value;
};

const positiveInteger = (field) =>
  z.preprocess(parseInteger, z.number().int().positive(`${field} must be a positive integer`));

const taskHours = (field) =>
  z.preprocess(
    parseDecimal,
    z
      .number({ invalid_type_error: `${field} must be a valid number` })
      .nonnegative(`${field} cannot be negative`)
      .max(9999.9, `${field} must be a valid DECIMAL(5,1)`)
      .refine(
        (value) => /^\d{1,4}(\.\d)?$/.test(String(value)),
        `${field} must be a valid DECIMAL(5,1)`
      )
  );

const taskCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Task title is required and must be at least 3 characters')
    .max(255, 'Task title cannot exceed 255 characters'),

  description: z.string().trim().optional(),

  status: statusEnum.optional(),

  priority: priorityEnum.optional(),

  assigned_to: positiveInteger('Assigned user ID').optional(),

  due_date: z.preprocess(parseDate, z.date({ invalid_type_error: 'Invalid due date' })).optional(),

  estimated_hours: taskHours('Estimated hours').optional(),

  actual_hours: taskHours('Actual hours').optional(),

  sort_order: z
    .preprocess(parseInteger, z.number().int('Sort order must be an integer'))
    .optional(),
});

const taskUpdateSchema = taskCreateSchema.omit({ status: true, assigned_to: true }).partial();

const validateCreateTask = (req, res, next) => {
  try {
    req.body = taskCreateSchema.parse(req.body);

    return next();
  } catch (err) {
    const errors = err?.issues || err?.errors;

    const msg = errors ? errors.map((e) => e.message).join(', ') : 'Invalid task data';

    return errorResponse(res, msg, 400);
  }
};

const validateUpdateTask = (req, res, next) => {
  try {
    req.body = taskUpdateSchema.parse(req.body);

    return next();
  } catch (err) {
    const errors = err?.issues || err?.errors;

    const msg = errors ? errors.map((e) => e.message).join(', ') : 'Invalid task data';

    return errorResponse(res, msg, 400);
  }
};

const taskStatusSchema = z.object({
  status: statusEnum,
  actual_hours: taskHours('Actual hours').optional(),
});

const validateChangeTaskStatus = (req, res, next) => {
  try {
    req.body = taskStatusSchema.parse(req.body);
    return next();
  } catch (err) {
    const errors = err?.issues || err?.errors;
    const msg = errors ? errors.map((e) => e.message).join(', ') : 'Invalid task status data';
    return errorResponse(res, msg, 400);
  }
};

const taskAssignSchema = z.object({
  assigned_to: z.preprocess(
    (val) => {
      if (val === null || val === 'null') return null;
      if (val === undefined || val === '') return undefined;
      const parsed = Number(val);
      return Number.isNaN(parsed) ? val : parsed;
    },
    z.union([
      z.literal(null),
      z.number().int().positive('Assigned user ID must be a positive integer'),
    ])
  ),
});

const validateAssignTask = (req, res, next) => {
  try {
    req.body = taskAssignSchema.parse(req.body);
    return next();
  } catch (err) {
    const errors = err?.issues || err?.errors;
    const msg = errors ? errors.map((e) => e.message).join(', ') : 'Invalid assignment data';
    return errorResponse(res, msg, 400);
  }
};

const taskReorderSchema = z.array(
  z.object({
    id: z.preprocess(
      (val) => (val === undefined ? undefined : Number(val)),
      z.number().int().positive('Task ID must be a positive integer')
    ),
    sort_order: z.preprocess(
      (val) => (val === undefined ? undefined : Number(val)),
      z.number().int('Sort order must be an integer')
    ),
  })
);

const validateReorderTasks = (req, res, next) => {
  try {
    req.body = taskReorderSchema.parse(req.body);
    return next();
  } catch (err) {
    const errors = err?.issues || err?.errors;
    const msg = errors ? errors.map((e) => e.message).join(', ') : 'Invalid task reorder data';
    return errorResponse(res, msg, 400);
  }
};

export {
  validateCreateTask,
  validateUpdateTask,
  validateChangeTaskStatus,
  validateAssignTask,
  validateReorderTasks,
  taskCreateSchema,
  taskUpdateSchema,
  taskStatusSchema,
  taskAssignSchema,
  taskReorderSchema,
};
