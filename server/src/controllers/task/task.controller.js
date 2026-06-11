import { successResponse, errorResponse } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import prisma from '../../prisma/client.js';
import { serializeTask } from '../../serializers/task.serializer.js';
import { serializeComment } from '../../serializers/comment.serializer.js';
import { serializeActivity } from '../../serializers/activity.serializer.js';
import { createActivityLog } from '../../services/activity.service.js';
import {
  broadcastTaskStatusChange,
  broadcastTaskAssigned,
  broadcastCommentAdded,
  broadcastTaskDeleted,
  broadcastTaskUpdated,
} from '../../services/socket.service.js';

// PUT: /api/v1/tasks/{id} — Update task
const updateTask = asyncHandler(async (req, res) => {
  const task = req.task;
  const taskId = task.id;
  const updateData = { ...req.body, updated_at: new Date() };

  const updatedTask = await prisma.tasks.update({
    where: { id: taskId },
    data: updateData,
    include: { users: true },
  });

  await createActivityLog({
    subject_type: 'task',
    subject_id: updatedTask.id,
    user_id: req.user.id,
    action: 'updated',
    properties: {
      changes: updateData,
    },
  }).catch((error) => {
    console.error('Activity log failed:', error);
  });

  broadcastTaskUpdated(req, req.project.slug, serializeTask(updatedTask), req.task);

  return successResponse(res, serializeTask(updatedTask), 'Task updated successfully');
});

// PATCH: /api/v1/tasks/{id}/status — Change status only (with transition validation)
const changeTaskStatus = asyncHandler(async (req, res) => {
  const task = req.task;
  const taskId = task.id;
  const { status, actual_hours } = req.body;

  if (status !== task.status) {
    const statuses = ['todo', 'in_progress', 'in_review', 'done'];
    const currentIdx = statuses.indexOf(task.status);
    const newIdx = statuses.indexOf(status);

    if (newIdx > currentIdx + 1) {
      return errorResponse(res, `Invalid status transition from ${task.status} to ${status}`, 400);
    }
  }

  if (status === 'done') {
    const actualHours = actual_hours !== undefined ? actual_hours : task.actual_hours;
    if (actualHours === null || actualHours === undefined) {
      return errorResponse(res, 'Actual hours are required when moving task to done', 400);
    }
  }

  const updateData = { status, updated_at: new Date() };
  if (actual_hours !== undefined) {
    updateData.actual_hours = actual_hours;
  }

  const updatedTask = await prisma.tasks.update({
    where: { id: taskId },
    data: updateData,
    include: { users: true },
  });

  await createActivityLog({
    subject_type: 'task',
    subject_id: updatedTask.id,
    user_id: req.user.id,
    action: 'updated',
    properties: {
      changes: updateData,
    },
  }).catch((error) => {
    console.error('Activity log failed:', error);
  });

  broadcastTaskStatusChange(req, req.project.slug, serializeTask(updatedTask), req.task);

  return successResponse(res, serializeTask(updatedTask), 'Task status updated successfully');
});

// PATCH: /api/v1/tasks/{id}/assign — Assign/reassign task to a user
const assignTask = asyncHandler(async (req, res) => {
  const task = req.task;
  const taskId = task.id;
  const { assigned_to } = req.body;

  if (assigned_to !== undefined && assigned_to !== null) {
    const user = await prisma.users.findFirst({
      where: { id: assigned_to, deleted_at: null, is_active: true },
    });

    if (!user) {
      return errorResponse(res, 'Assigned user not found or is inactive', 400);
    }
  }

  const updatedTask = await prisma.tasks.update({
    where: { id: taskId },
    data: { assigned_to, updated_at: new Date() },
    include: { users: true },
  });

  await createActivityLog({
    subject_type: 'task',
    subject_id: updatedTask.id,
    user_id: req.user.id,
    action: 'updated',
    properties: {
      changes: { assigned_to },
    },
  }).catch((error) => {
    console.error('Activity log failed:', error);
  });

  broadcastTaskAssigned(req, req.project.slug, serializeTask(updatedTask), req.task);

  return successResponse(res, serializeTask(updatedTask), 'Task assignment updated successfully');
});

// POST: /api/v1/tasks/reorder — Bulk update sort_order for drag-and-drop
const reorderTasks = asyncHandler(async (req, res) => {
  const tasks = req.body;

  if (!Array.isArray(tasks)) {
    return errorResponse(res, 'Request body must be an array', 400);
  }

  try {
    await prisma.$transaction(
      tasks.map((t) =>
        prisma.tasks.update({
          where: { id: t.id },
          data: { sort_order: t.sort_order },
        })
      )
    );
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }

  return successResponse(res, null, 'Tasks reordered successfully');
});

// DELETE: /api/v1/tasks/{id} — Soft delete
const deleteTask = asyncHandler(async (req, res) => {
  const task = req.task;
  const taskId = task.id;

  const deletedTask = await prisma.tasks.update({
    where: { id: taskId },
    data: { deleted_at: new Date() },
  });

  await createActivityLog({
    subject_type: 'task',
    subject_id: deletedTask.id,
    user_id: req.user.id,
    action: 'deleted',
    properties: {
      name: deletedTask.title,
    },
  }).catch((error) => {
    console.error('Activity log failed:', error);
  });

  broadcastTaskDeleted(req, req.project.slug, taskId);

  return successResponse(res, null, 'Task deleted successfully');
});

// GET: /api/v1/tasks/{id}/comments — Threaded list (parent + replies nested)
const listTaskComments = asyncHandler(async (req, res) => {
  const task = req.task;
  const taskId = task.id;

  const comments = await prisma.comments.findMany({
    where: { task_id: taskId, deleted_at: null },
    include: { users: true },
    orderBy: { created_at: 'asc' },
  });

  const serializedComments = comments.map((c) => ({
    ...serializeComment({ ...c, user: c.users }),
    replies: [],
  }));

  const commentMap = {};
  serializedComments.forEach((c) => {
    commentMap[c.id] = c;
  });

  const rootComments = [];
  serializedComments.forEach((c) => {
    if (c.parent_id) {
      const parent = commentMap[c.parent_id];
      if (parent) {
        parent.replies.push(c);
      } else {
        rootComments.push(c);
      }
    } else {
      rootComments.push(c);
    }
  });

  return successResponse(res, rootComments);
});

// POST: /api/v1/tasks/{id}/comments — Add comment (with optional parent_id for replies)
const createTaskComment = asyncHandler(async (req, res) => {
  const task = req.task;
  const taskId = task.id;
  const { body, parent_id } = req.body;

  if (parent_id) {
    const parentComment = await prisma.comments.findFirst({
      where: { id: parent_id, task_id: taskId, deleted_at: null },
    });

    if (!parentComment) {
      return errorResponse(res, 'Parent comment not found or does not belong to this task', 400);
    }
  }

  const comment = await prisma.comments.create({
    data: {
      task_id: taskId,
      user_id: req.user.id,
      body,
      parent_id,
    },
    include: { users: true },
  });

  await createActivityLog({
    subject_type: 'comment',
    subject_id: comment.id,
    user_id: req.user.id,
    action: 'created',
    properties: {
      name: comment.body,
    },
  }).catch((error) => {
    console.error('Activity log failed:', error);
  });

  broadcastCommentAdded(
    req,
    req.project.slug,
    serializeComment({ ...comment, user: comment.users })
  );

  return successResponse(
    res,
    serializeComment({ ...comment, user: comment.users }),
    'Comment added successfully',
    201
  );
});

// GET: /api/v1/tasks/{id}/activities — Recent changes / timeline
const listTaskActivities = asyncHandler(async (req, res) => {
  const task = req.task;
  const taskId = task.id;

  const taskComments = await prisma.comments.findMany({
    where: { task_id: taskId },
    select: { id: true },
  });
  const commentIds = taskComments.map((c) => c.id);

  const OR_clause = [{ subject_type: 'task', subject_id: taskId }];
  if (commentIds.length > 0) {
    OR_clause.push({ subject_type: 'comment', subject_id: { in: commentIds } });
  }

  const logs = await prisma.activity_logs.findMany({
    where: { OR: OR_clause },
    include: { users: true },
    orderBy: { created_at: 'desc' },
  });

  const serializedLogs = logs.map(serializeActivity);

  return successResponse(res, serializedLogs, 'Task activities retrieved successfully');
});

// GET: /api/v1/tasks/{id} — Get single task details
const showTask = asyncHandler(async (req, res) => {
  return successResponse(res, serializeTask(req.task), 'Task details retrieved successfully');
});

export {
  updateTask,
  changeTaskStatus,
  assignTask,
  reorderTasks,
  deleteTask,
  listTaskComments,
  createTaskComment,
  listTaskActivities,
  showTask,
};
