import express from 'express';
import prisma from '../prisma/client.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { errorResponse } from '../utils/response.js';
import { TaskPolicy } from '../policies/task.policy.js';
import {
  updateTask,
  changeTaskStatus,
  assignTask,
  reorderTasks,
  deleteTask,
  listTaskComments,
  createTaskComment,
  listTaskActivities,
  showTask,
} from '../controllers/task/task.controller.js';
import {
  validateUpdateTask,
  validateChangeTaskStatus,
  validateAssignTask,
  validateReorderTasks,
} from '../validators/task.validator.js';
import { validateCreateComment } from '../validators/comment.validator.js';
import { loadTaskAndProject } from '../loaders/taskAndProject.loader.js';
import { etagMiddleware } from '../middlewares/etag.middleware.js';
const router = express.Router();

router.get('/:id', authMiddleware, loadTaskAndProject, etagMiddleware, showTask);

router.get(
  '/:id/activities',
  authMiddleware,
  loadTaskAndProject,
  etagMiddleware,
  listTaskActivities
);

router.put(
  '/:id',
  authMiddleware,
  loadTaskAndProject,
  TaskPolicy.canUpdate,
  validateUpdateTask,
  updateTask
);

router.patch(
  '/:id/status',
  authMiddleware,
  loadTaskAndProject,
  TaskPolicy.canChangeStatus,
  validateChangeTaskStatus,
  changeTaskStatus
);

router.patch(
  '/:id/assign',
  authMiddleware,
  loadTaskAndProject,
  TaskPolicy.canAssign,
  validateAssignTask,
  assignTask
);

router.post('/reorder', authMiddleware, validateReorderTasks, reorderTasks);

router.delete('/:id', authMiddleware, loadTaskAndProject, TaskPolicy.canDelete, deleteTask);

router.get('/:id/comments', authMiddleware, loadTaskAndProject, etagMiddleware, listTaskComments);

router.post(
  '/:id/comments',
  authMiddleware,
  loadTaskAndProject,
  validateCreateComment,
  createTaskComment
);

export default router;
