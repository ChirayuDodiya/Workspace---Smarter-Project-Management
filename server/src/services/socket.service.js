import prisma from '../prisma/client.js';

// Broadcasts an event to a specific project room
export const broadcastToProject = (req, projectSlug, event, data) => {
  const io = req.app.get('io');
  if (io) {
    io.to(`project:${projectSlug}`).emit(event, data);
  }
};

// Helper to construct notification message
const getNotificationMessage = (task, action, updaterName) => {
  const byWho = updaterName ? `by ${updaterName}` : '';
  if (action === 'status_changed') {
    return `Task "${task.title}" status changed to ${task.status.replace('_', ' ')} ${byWho}.`;
  }
  if (action === 'assigned') {
    return `Task "${task.title}" has been assigned to you ${byWho}.`;
  }
  return `Task "${task.title}" has been updated ${byWho}.`;
};

// Helper to notify assignees of updates
const notifyAssigneeOfUpdate = async (req, task, oldTask, actionType) => {
  try {
    const io = req.app.get('io');
    if (!io) return;

    const currentUserId = req.user?.id;
    const newAssigneeId = task.assigned_to?.id;
    const oldAssigneeId = oldTask?.assigned_to;

    // Check if we need to notify anyone
    const needsNewNotification = newAssigneeId && newAssigneeId !== currentUserId;
    const needsOldNotification =
      oldAssigneeId && oldAssigneeId !== newAssigneeId && oldAssigneeId !== currentUserId;

    if (!needsNewNotification && !needsOldNotification) return;

    const projectSlug = req.project?.slug;

    // Fetch updater's name from DB since jwt token only has id and role
    const updater = await prisma.users.findFirst({
      where: { id: currentUserId, deleted_at: null },
    });
    const updaterName = updater?.name || 'someone';

    // 1. Notify the new assignee
    if (needsNewNotification) {
      io.to(`user:${newAssigneeId}`).emit('task:assigned_notification', {
        task,
        projectSlug,
        updaterName,
        action: actionType,
        message: getNotificationMessage(task, actionType, updaterName),
      });
    }

    // 2. Notify the old assignee (reassignment)
    if (needsOldNotification) {
      io.to(`user:${oldAssigneeId}`).emit('task:assigned_notification', {
        task,
        projectSlug,
        updaterName,
        action: 'reassigned',
        message: `Task "${task.title}" has been reassigned to ${task.assigned_to ? task.assigned_to.name : 'unassigned'} by ${updaterName}.`,
      });
    }
  } catch (error) {
    console.error('Error sending task notification:', error);
  }
};

// Broadcasts when a task's status changes
export const broadcastTaskStatusChange = (req, projectSlug, task, oldTask) => {
  broadcastToProject(req, projectSlug, 'task:status_changed', task);
  notifyAssigneeOfUpdate(req, task, oldTask, 'status_changed');
};

// Broadcasts when a new comment is added
export const broadcastCommentAdded = async (req, projectSlug, comment) => {
  broadcastToProject(req, projectSlug, 'comment:added', comment);

  try {
    const currentUserId = req.user?.id;
    const taskAssigneeId = req.task?.assigned_to;

    if (taskAssigneeId && taskAssigneeId !== currentUserId) {
      const io = req.app.get('io');
      if (io) {
        const updater = await prisma.users.findFirst({
          where: { id: currentUserId, deleted_at: null },
        });
        const updaterName = updater?.name || 'someone';

        io.to(`user:${taskAssigneeId}`).emit('task:assigned_notification', {
          task: req.task,
          projectSlug,
          comment,
          updaterName,
          action: 'comment_added',
          message: `New comment added to your task "${req.task.title}" by ${updaterName}.`,
        });
      }
    }
  } catch (error) {
    console.error('Error sending comment notification:', error);
  }
};

// Broadcasts when a task is assigned or reassigned
export const broadcastTaskAssigned = (req, projectSlug, task, oldTask) => {
  broadcastToProject(req, projectSlug, 'task:assigned', task);
  notifyAssigneeOfUpdate(req, task, oldTask, 'assigned');
};

// Broadcasts when a new task is created
export const broadcastTaskCreated = (req, projectSlug, task) => {
  broadcastToProject(req, projectSlug, 'task:created', task);
};

// Broadcasts when a task is deleted
export const broadcastTaskDeleted = (req, projectSlug, taskId) => {
  broadcastToProject(req, projectSlug, 'task:deleted', { taskId });
};

// Broadcasts when a task is updated (e.g. title, desc, priority, etc)
export const broadcastTaskUpdated = (req, projectSlug, task, oldTask) => {
  broadcastToProject(req, projectSlug, 'task:updated', task);
  notifyAssigneeOfUpdate(req, task, oldTask, 'updated');
};

// Broadcasts when a comment is updated
export const broadcastCommentUpdated = (req, projectSlug, comment) => {
  broadcastToProject(req, projectSlug, 'comment:updated', comment);
};

// Broadcasts when a comment is deleted
export const broadcastCommentDeleted = (req, projectSlug, commentId) => {
  broadcastToProject(req, projectSlug, 'comment:deleted', { commentId });
};
