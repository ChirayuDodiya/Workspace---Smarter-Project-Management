import express from 'express';
import {
  listUsers,
  updateUserRole,
  softDeleteUser,
  restoreUser,
} from '../controllers/user/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { etagMiddleware } from '../middlewares/etag.middleware.js';
import { UserPolicy } from '../policies/user.policy.js';

const router = express.Router();

router.get('/', authMiddleware, etagMiddleware, listUsers);
router.put('/:id/role', authMiddleware, UserPolicy.canChangeRole, updateUserRole);
router.delete('/:id', authMiddleware, UserPolicy.canDelete, softDeleteUser);
router.post('/:id/restore', authMiddleware, UserPolicy.canRestore, restoreUser);

export default router;
