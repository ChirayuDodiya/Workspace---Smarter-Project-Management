import { successResponse } from '../../utils/response.js';
import prisma from '../../prisma/client.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

// GET: /api/v1/dashboard/stats
const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const totalProjects = await prisma.projects.countNonDeleted();
  const activeTasks = await prisma.tasks.countActive(userId);
  const overdueTasks = await prisma.tasks.countOverdue(userId);

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Set to Monday
  startOfWeek.setHours(0, 0, 0, 0);

  const completedTasks = await prisma.tasks.countCompletedThisWeek(userId, startOfWeek);

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
