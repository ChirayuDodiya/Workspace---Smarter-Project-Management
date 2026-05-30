import { successResponse } from '../../utils/response.js';
import prisma from '../../prisma/client.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

// GET: /api/v1/dashboard/stats
const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Calculate statistics
  const totalProjects = await prisma.projects.count({
    where: { deleted_at: null },
  });

  const activeTasks = await prisma.tasks.count({
    where: {
      assigned_to: userId,
      status: { in: ['todo', 'in_progress', 'in_review'] },
      deleted_at: null,
    },
  });

  const overdueTasks = await prisma.tasks.count({
    where: {
      assigned_to: userId,
      due_date: { lt: new Date() },
      status: { not: 'done' },
      deleted_at: null,
    },
  });

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Set to Monday
  startOfWeek.setHours(0, 0, 0, 0);

  const completedTasks = await prisma.tasks.count({
    where: {
      assigned_to: userId,
      status: 'done',
      deleted_at: null,
      updated_at: { gte: startOfWeek },
    },
  });

  return successResponse(
    res,
    {
      total_projects: totalProjects,
      active_tasks: activeTasks,
      overdue_tasks: overdueTasks,
      completed_tasks: completedTasks,
    },
    'Dashboard statistics fetched successfully',
    200
  );
});

export { getDashboardStats };
