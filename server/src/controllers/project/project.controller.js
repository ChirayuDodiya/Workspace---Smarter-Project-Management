import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import prisma from '../../prisma/client.js';
import { serializeUser } from '../../serializers/user.serializer.js';
import { Parser } from 'json2csv';
import { serializeProject } from '../../serializers/project.serializer.js';
import { serializeTask } from '../../serializers/task.serializer.js';
import { createActivityLog } from '../../services/activity.service.js';
import { buildSlug } from '../../services/slug.service.js';
import { broadcastTaskCreated } from '../../services/socket.service.js';
import {
  getCachedStats,
  setCachedStats,
  invalidateProjectStats,
} from '../../services/redis.service.js';

// GET: /api/v1/projects — List with filtering (status, owner), sorting, and pagination
const listProjects = asyncHandler(async (req, res) => {
  const {
    status,
    owner,
    search,
    page = 1,
    per_page = 20,
    sortBy = 'created_at',
    order = 'desc',
  } = req.query;
  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(per_page) || 20, 1), 100);

  const allowedSortFields = ['created_at', 'start_date', 'end_date', 'name', 'status'];
  const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  const orderDirection = order === 'asc' ? 'asc' : 'desc';

  const allowedStatus = ['planning', 'active', 'on_hold', 'completed', 'archived'];
  if (status && !allowedStatus.includes(status)) {
    return errorResponse(res, 'Invalid status filter', 400);
  }

  const where = {
    deleted_at: null,
  };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.name = {
      contains: search,
    };
  }

  if (owner) {
    const ownerId = Number(owner);
    if (Number.isNaN(ownerId) || ownerId <= 0) {
      return errorResponse(res, 'Invalid owner filter', 400);
    }
    where.owner_id = ownerId;
  }

  const [total, projects] = await Promise.all([
    prisma.projects.count({ where }),
    prisma.projects.findPaginated(
      where,
      orderField,
      orderDirection,
      (pageNumber - 1) * pageSize,
      pageSize
    ),
  ]);

  const projectIds = projects.map((p) => p.id);
  const taskCounts =
    projectIds.length > 0
      ? await prisma.tasks.groupBy({
          by: ['project_id', 'status'],
          where: {
            project_id: { in: projectIds },
            deleted_at: null,
          },
          _count: {
            _all: true,
          },
        })
      : [];

  const statsMap = {};
  projectIds.forEach((id) => {
    statsMap[id] = { total: 0, completed: 0 };
  });

  taskCounts.forEach((item) => {
    const pId = item.project_id;
    const count = item._count._all;
    if (statsMap[pId]) {
      statsMap[pId].total += count;
      if (item.status === 'done') {
        statsMap[pId].completed += count;
      }
    }
  });

  const serialized = projects.map((project) => {
    const stats = statsMap[project.id] || { total: 0, completed: 0 };
    const serializedProject = serializeProject(project);
    serializedProject.task_count = stats.total;
    serializedProject.completed_tasks = stats.completed;
    return serializedProject;
  });

  return paginatedResponse(res, serialized, {
    page: pageNumber,
    per_page: pageSize,
    total,
    total_pages: Math.ceil(total / pageSize),
  });
});

// POST: /api/v1/projects — Create (admin & manager only)
const createProject = asyncHandler(async (req, res) => {
  const slug = await buildSlug(req.body.name);

  const project = await prisma.projects.create({
    data: {
      ...req.body,
      slug,
      owner_id: req.body.owner_id !== undefined ? req.body.owner_id : req.user.id,
    },
    include: { users: true },
  });

  await createActivityLog({
    subject_type: 'project',
    subject_id: project.id,
    user_id: req.user.id,
    action: 'created',
    properties: {
      name: project.name,
      status: project.status,
      owner_id: project.owner_id,
    },
  }).catch((error) => {
    console.error('Activity log failed:', error);
  });

  return successResponse(res, serializeProject(project), 'Project created successfully', 201);
});

const getProjectBySlug = async (slug) => {
  return prisma.projects.findFirst({
    where: {
      slug,
      deleted_at: null,
    },
    include: { users: true },
  });
};

// GET: /api/v1/projects/{slug} — Show with task summary stats
const showProject = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  const stats = await prisma.tasks.getProjectSummaryStats(project.id);

  const summary = {
    total_tasks: stats.total_tasks,
    total_hours: stats.total_hours,
    overdue_count: stats.overdue_count,
    status_counts: stats.task_count_by_status,
  };

  return successResponse(res, {
    project: serializeProject(project),
    stats: summary,
  });
});

// PUT: /api/v1/projects/{slug} — Update (owner or admin only)
const updateProject = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  const updateData = req.body;

  const data = { ...updateData };

  if (updateData.name && updateData.name !== project.name) {
    data.slug = await buildSlug(updateData.name, project.id);
  }

  const updatedProject = await prisma.projects.update({
    where: { id: project.id },
    data,
    include: { users: true },
  });

  await createActivityLog({
    subject_type: 'project',
    subject_id: updatedProject.id,
    user_id: req.user.id,
    action: 'updated',
    properties: {
      changes: updateData,
    },
  }).catch((error) => {
    console.error('Activity log failed:', error);
  });

  return successResponse(
    res,
    serializeProject(updatedProject),
    'Project updated successfully',
    200
  );
});

// DELETE: /api/v1/projects/{slug} — Soft delete (admin only)
const deleteProject = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  const deletedProject = await prisma.projects.update({
    where: { id: project.id },
    data: { deleted_at: new Date() },
  });

  await createActivityLog({
    subject_type: 'project',
    subject_id: deletedProject.id,
    user_id: req.user.id,
    action: 'deleted',
    properties: {
      slug: deletedProject.slug,
      name: deletedProject.name,
    },
  }).catch((error) => {
    console.error('Activity log failed:', error);
  });

  return successResponse(res, null, 'Project deleted successfully', 200);
});

// GET: /api/v1/projects/{slug}/stats — Task count by status, total hours, overdue count
const projectStats = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  // Try retrieving cached stats first
  const cachedData = await getCachedStats(slug);
  if (cachedData) {
    return successResponse(res, cachedData, 'Project statistics retrieved from cache');
  }

  const project = await getProjectBySlug(slug);

  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  const stats = await prisma.tasks.getProjectSummaryStats(project.id);

  const statsData = {
    task_count_by_status: stats.task_count_by_status,
    total_hours: stats.total_hours,
    overdue_count: stats.overdue_count,
  };

  // Cache statsData in Redis
  await setCachedStats(slug, statsData);

  return successResponse(res, statsData);
});

// GET: /api/v1/projects/{slug}/tasks — List with filtering (status, priority, assigned_to), sorting, pagination
const listTasks = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  const {
    status,
    priority,
    assigned_to,
    search,
    page = 1,
    per_page = 20,
    sortBy = 'sort_order',
    order = 'asc',
  } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(per_page) || 20, 1), 100);

  const allowedSortFields = [
    'created_at',
    'title',
    'status',
    'priority',
    'assigned_to',
    'due_date',
    'sort_order',
  ];
  const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'sort_order';
  const orderDirection = order === 'desc' ? 'desc' : 'asc';

  const allowedStatus = ['todo', 'in_progress', 'in_review', 'done'];
  if (status && !allowedStatus.includes(status)) {
    return errorResponse(res, 'Invalid status filter', 400);
  }

  const allowedPriority = ['low', 'medium', 'high', 'critical'];
  if (priority && !allowedPriority.includes(priority)) {
    return errorResponse(res, 'Invalid priority filter', 400);
  }

  const whereFilters = {};
  if (status) whereFilters.status = status;
  if (priority) whereFilters.priority = priority;
  if (assigned_to) whereFilters.assigned_to = assigned_to;
  if (search) {
    whereFilters.title = {
      contains: String(search),
    };
  }

  const [total, tasks] = await Promise.all([
    prisma.tasks.count({
      where: {
        project_id: project.id,
        deleted_at: null,
        ...whereFilters,
      },
    }),
    prisma.tasks.findForProject(
      project.id,
      whereFilters,
      orderField,
      orderDirection,
      (pageNumber - 1) * pageSize,
      pageSize
    ),
  ]);

  const serialized = tasks.map((task) => serializeTask(task, project.owner_id));

  return paginatedResponse(res, serialized, {
    page: pageNumber,
    per_page: pageSize,
    total,
    total_pages: Math.ceil(total / pageSize),
  });
});

// POST: /api/v1/projects/{slug}/tasks — Create task within project
const createTask = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const project = await getProjectBySlug(slug);

  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  const task = await prisma.tasks.create({
    data: {
      ...req.body,
      project_id: project.id,
    },
    include: { users: true },
  });

  await createActivityLog({
    subject_type: 'task',
    subject_id: task.id,
    user_id: req.user.id,
    action: 'created',
    properties: {
      name: task.title,
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to,
    },
  }).catch((error) => {
    console.error('Activity log failed:', error);
  });

  // Invalidate Redis cache for project stats
  await invalidateProjectStats(project.slug);

  broadcastTaskCreated(req, project.slug, serializeTask(task, project.owner_id));

  return successResponse(
    res,
    serializeTask(task, project.owner_id),
    'Task created successfully',
    201
  );
});

// GET: /api/v1/projects/{slug}/team-members — List all team members assigned to project
const teamMembers = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  const members = await prisma.team_members.findActiveForProject(project.id);

  const usersList = members.map((m) => m.users).filter(Boolean);
  const serializedUsers = usersList.map((user) => serializeUser(user));

  return successResponse(res, serializedUsers, 'Team members fetched successfully');
});

// GET: /api/v1/projects/managers — List all active users with role = manager or admin
const listManagers = asyncHandler(async (req, res) => {
  const managers = await prisma.users.findMany({
    where: {
      role: {
        in: ['manager', 'admin'],
      },
      is_active: true,
      deleted_at: null,
    },
    orderBy: {
      name: 'asc',
    },
  });

  const serialized = managers.map((user) => serializeUser(user));
  return successResponse(res, serialized, 'Managers fetched successfully');
});

// POST: /api/v1/projects/{slug}/team-members — Add a team member
const addTeamMember = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { user_id } = req.body;

  const project = req.project || (await getProjectBySlug(slug));
  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  const userId = Number(user_id);
  if (Number.isNaN(userId)) {
    return errorResponse(res, 'Invalid user ID', 400);
  }

  const targetUser = await prisma.users.findFirst({
    where: { id: userId, is_active: true, deleted_at: null },
  });

  if (!targetUser) {
    return errorResponse(res, 'User not found or inactive', 404);
  }

  // Check if already a member (including soft deleted)
  const existingMember = await prisma.team_members.findFirst({
    where: {
      project_id: project.id,
      user_id: userId,
    },
  });

  if (existingMember) {
    if (existingMember.deleted_at === null) {
      return errorResponse(res, 'User is already a member of this project', 400);
    }
    // Restore member
    await prisma.team_members.update({
      where: { id: existingMember.id },
      data: { deleted_at: null, updated_at: new Date() },
    });
  } else {
    // Create new member
    await prisma.team_members.create({
      data: {
        project_id: project.id,
        user_id: userId,
      },
    });
  }

  // Create Activity Log
  try {
    await createActivityLog({
      subject_type: 'projects',
      subject_id: project.id,
      user_id: req.user.id,
      action: 'add_member',
      properties: {
        member_id: userId,
        member_name: targetUser.name,
        member_email: targetUser.email,
        project_name: project.name,
      },
    });
  } catch (logError) {
    console.error('Failed to log activity:', logError);
  }

  return successResponse(res, serializeUser(targetUser), 'Member added successfully', 200);
});

// DELETE: /api/v1/projects/{slug}/team-members/{userId} — Remove a team member
const removeTeamMember = asyncHandler(async (req, res) => {
  const { slug, userId: userIdParam } = req.params;
  const project = req.project || (await getProjectBySlug(slug));
  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  const userId = Number(userIdParam);
  if (Number.isNaN(userId)) {
    return errorResponse(res, 'Invalid user ID', 400);
  }

  // Check if member exists in project
  const existingMember = await prisma.team_members.findFirst({
    where: {
      project_id: project.id,
      user_id: userId,
      deleted_at: null,
    },
    include: {
      users: true,
    },
  });

  if (!existingMember) {
    return errorResponse(res, 'Member not found in this project', 404);
  }

  // Soft delete team member
  await prisma.team_members.update({
    where: { id: existingMember.id },
    data: { deleted_at: new Date() },
  });

  // Create Activity Log
  try {
    await createActivityLog({
      subject_type: 'projects',
      subject_id: project.id,
      user_id: req.user.id,
      action: 'remove_member',
      properties: {
        member_id: userId,
        member_name: existingMember.users.name,
        member_email: existingMember.users.email,
        project_name: project.name,
      },
    });
  } catch (logError) {
    console.error('Failed to log activity:', logError);
  }

  return successResponse(res, null, 'Member removed successfully', 200);
});

// GET: /api/v1/projects/:slug/export-tasks - Export project tasks to CSV
const exportProjectTasks = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const project = await prisma.projects.findFirst({
    where: { slug, deleted_at: null },
  });

  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  // Fetch all tasks for this project that are not soft-deleted
  const tasks = await prisma.tasks.findMany({
    where: { project_id: project.id, deleted_at: null },
    include: {
      users: true, // to include assignee details
    },
    orderBy: {
      sort_order: 'asc',
    },
  });

  // Map task properties to columns
  const data = tasks.map((task) => ({
    ID: task.id,
    Title: task.title,
    Description: task.description || '',
    Status: task.status,
    Priority: task.priority,
    'Assigned To': task.users ? task.users.email : 'Unassigned',
    'Due Date': task.due_date ? task.due_date.toISOString().split('T')[0] : '',
    'Estimated Hours': task.estimated_hours ? task.estimated_hours.toString() : '',
    'Actual Hours': task.actual_hours ? task.actual_hours.toString() : '',
  }));

  const fields = [
    'ID',
    'Title',
    'Description',
    'Status',
    'Priority',
    'Assigned To',
    'Due Date',
    'Estimated Hours',
    'Actual Hours',
  ];

  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(data);

  res.header('Content-Type', 'text/csv');
  res.attachment(`${slug}-tasks.csv`);
  return res.send(csv);
});

export {
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
  exportProjectTasks,
};
