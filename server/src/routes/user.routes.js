import express from 'express';
import { listUsers, updateUserRole } from '../controllers/user/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { UserPolicy } from '../policies/user.policy.js';

const router = express.Router();

router.get('/', authMiddleware, listUsers);
router.put('/:id/role', authMiddleware, UserPolicy.canChangeRole, updateUserRole);

export default router;
