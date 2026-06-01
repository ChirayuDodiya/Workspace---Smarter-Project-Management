import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import prisma from '../../prisma/client.js';
import { serializeUser } from '../../serializers/user.serializer.js';
import { serializeProject } from '../../serializers/project.serializer.js';
import { serializeTask } from '../../serializers/task.serializer.js';
import { createActivityLog } from '../../services/activity.service.js';
import { buildSlug } from '../../services/slug.service.js';

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
    prisma.projects.findMany({
      where,
      include: {
        users: true,
      },
      orderBy: { [orderField]: orderDirection },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
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
      owner_id: req.user.id,
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

  const taskStats = await prisma.tasks.groupBy({
    by: ['status'],
    where: {
      project_id: project.id,
      deleted_at: null,
    },
    _count: {
      _all: true,
    },
  });

  const aggregate = await prisma.tasks.aggregate({
    where: {
      project_id: project.id,
      deleted_at: null,
    },
    _count: { _all: true },
    _sum: {
      actual_hours: true,
    },
  });

  const overdueCount = await prisma.tasks.count({
    where: {
      project_id: project.id,
      deleted_at: null,
      due_date: {
        lt: new Date(),
      },
      status: {
        not: 'done',
      },
    },
  });

  const statusCounts = taskStats.reduce((acc, item) => {
    acc[item.status] = item._count._all;
    return acc;
  }, {});

  const summary = {
    total_tasks: aggregate._count._all,
    total_hours: aggregate._sum.actual_hours ? aggregate._sum.actual_hours.toString() : '0',
    overdue_count: overdueCount,
    status_counts: statusCounts,
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
  const project = await getProjectBySlug(slug);

  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  const statusGroups = await prisma.tasks.groupBy({
    by: ['status'],
    where: {
      project_id: project.id,
      deleted_at: null,
    },
    _count: { _all: true },
  });

  const totalHours = await prisma.tasks.aggregate({
    where: {
      project_id: project.id,
      deleted_at: null,
    },
    _sum: {
      actual_hours: true,
    },
  });

  const overdueCount = await prisma.tasks.count({
    where: {
      project_id: project.id,
      deleted_at: null,
      due_date: {
        lt: new Date(),
      },
      status: {
        not: 'done',
      },
    },
  });

  const statusCounts = statusGroups.reduce((acc, item) => {
    acc[item.status] = item._count._all;
    return acc;
  }, {});

  return successResponse(res, {
    task_count_by_status: statusCounts,
    total_hours: totalHours._sum.actual_hours ? totalHours._sum.actual_hours.toString() : '0',
    overdue_count: overdueCount,
  });
});

// GET: /api/v1/projects/{slug}/tasks — List with filtering (status, priority, assigned_to), sorting, pagination
const listTasks = asyncHandler(async (req, res) => {
  const {
    status,
    priority,
    assigned_to,
    page = 1,
    per_page = 20,
    sortBy = 'created_at',
    order = 'desc',
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

  const where = {
    deleted_at: null,
  };

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  if (assigned_to) {
    where.assigned_to = assigned_to;
  }

  const [total, tasks] = await Promise.all([
    prisma.tasks.count({
      where,
    }),
    prisma.tasks.findMany({
      where,
      include: {
        users: true,
      },
      orderBy: {
        [orderField]: orderDirection,
      },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const serialized = tasks.map((task) => serializeTask(task));

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

  return successResponse(res, serializeTask(task), 'Task created successfully', 201);
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
};
