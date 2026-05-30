import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { getDashboardStats } from '../controllers/dashboard/dashboard.controller.js';

const router = express.Router();

router.get('/stats', authMiddleware, getDashboardStats);

export default router;
