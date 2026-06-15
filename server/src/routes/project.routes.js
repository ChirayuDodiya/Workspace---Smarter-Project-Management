import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  listProjects,
  createProject,
  showProject,
  updateProject,
  deleteProject,
  projectStats,
  listTasks,
  createTask,
  teamMembers,
  listManagers,
  addTeamMember,
  removeTeamMember,
} from '../controllers/project/project.controller.js';
import { ProjectPolicy } from '../policies/project.policy.js';
import { TaskPolicy } from '../policies/task.policy.js';
import { validateCreateProject, validateUpdateProject } from '../validators/project.validator.js';
import { validateCreateTask } from '../validators/task.validator.js';
import { loadProjectBySlug } from '../loaders/project.loader.js';
import { etagMiddleware } from '../middlewares/etag.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, etagMiddleware, listProjects);
router.post('/', authMiddleware, validateCreateProject, ProjectPolicy.canCreate, createProject);
router.get('/managers', authMiddleware, etagMiddleware, listManagers);
router.get('/:slug', authMiddleware, etagMiddleware, showProject);
router.put(
  '/:slug',
  authMiddleware,
  loadProjectBySlug,
  validateUpdateProject,
  ProjectPolicy.canUpdate,
  updateProject
);
router.delete('/:slug', authMiddleware, loadProjectBySlug, ProjectPolicy.canDelete, deleteProject);
router.get('/:slug/stats', authMiddleware, etagMiddleware, projectStats);
router.get('/:slug/tasks', authMiddleware, etagMiddleware, listTasks);
router.post(
  '/:slug/tasks',
  authMiddleware,
  loadProjectBySlug,
  validateCreateTask,
  TaskPolicy.canCreate,
  createTask
);
router.get('/:slug/team-members', authMiddleware, loadProjectBySlug, etagMiddleware, teamMembers);
router.post(
  '/:slug/team-members',
  authMiddleware,
  loadProjectBySlug,
  ProjectPolicy.canUpdate,
  addTeamMember
);
router.delete(
  '/:slug/team-members/:userId',
  authMiddleware,
  loadProjectBySlug,
  ProjectPolicy.canUpdate,
  removeTeamMember
);

export default router;
