import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { updateComment, deleteComment } from '../controllers/comment/comment.controller.js';
import { validateUpdateComment } from '../validators/comment.validator.js';

const router = express.Router();

router.put('/:id', authMiddleware, validateUpdateComment, updateComment);
router.delete('/:id', authMiddleware, deleteComment);

export default router;
