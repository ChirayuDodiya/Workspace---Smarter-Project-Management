import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client.js';

import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 3306,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 20, // Increased limit to prevent pool timeouts
});

const prisma = new PrismaClient({ adapter }).$extends({
  model: {
    projects: {
      async countNonDeleted(this: any) {
        return this.count({
          where: { deleted_at: null },
        });
      },
      async findPaginated(this: any, where: any, orderField: any, orderDirection: any, skip: number, take: number) {
        return this.findMany({
          where,
          include: {
            users: true, // Eager load the owner relation to prevent N+1 queries
          },
          orderBy: {
            [orderField]: orderDirection,
          },
          skip,
          take,
        });
      },
    },
    users: {
      async findPaginated(this: any, where: any, skip: number, take: number) {
        return this.findMany({
          where,
          orderBy: {
            name: 'asc',
          },
          skip,
          take,
        });
      },
    },
    tasks: {
      async countActive(this: any, userId: number) {
        return this.count({
          where: {
            assigned_to: userId,
            status: { in: ['todo', 'in_progress', 'in_review'] },
            deleted_at: null,
            projects: {
              deleted_at: null,
            },
          },
        });
      },
      async countOverdue(this: any, userId: number) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return this.count({
          where: {
            assigned_to: userId,
            due_date: { lt: today },
            status: { not: 'done' },
            deleted_at: null,
            projects: {
              deleted_at: null,
            },
          },
        });
      },
      async countCompletedThisWeek(this: any, userId: number, startOfWeek: Date) {
        return this.count({
          where: {
            assigned_to: userId,
            status: 'done',
            deleted_at: null,
            updated_at: { gte: startOfWeek },
            projects: {
              deleted_at: null,
            },
          },
        });
      },
      async findForProject(
        this: any,
        projectId: number,
        whereClause: any = {},
        orderField = 'sort_order',
        orderDirection = 'asc',
        skip = 0,
        take = 20
      ) {
        return this.findMany({
          where: {
            project_id: projectId,
            deleted_at: null,
            ...whereClause,
          },
          include: {
            users: true,
          },
          orderBy: {
            [orderField]: orderDirection,
          },
          skip,
          take,
        });
      },
      async getProjectSummaryStats(this: any, projectId: number) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [statusGroups, overdueCount] = await Promise.all([
          this.groupBy({
            by: ['status'],
            where: {
              project_id: projectId,
              deleted_at: null,
            },
            _count: { _all: true },
            _sum: { actual_hours: true },
          }),
          this.count({
            where: {
              project_id: projectId,
              deleted_at: null,
              due_date: {
                lt: today,
              },
              status: {
                not: 'done',
              },
            },
          }),
        ]);

        let totalTasks = 0;
        let totalHoursDone = 0;

        const statusCounts = statusGroups.reduce((acc: any, item: any) => {
          acc[item.status] = item._count._all;
          totalTasks += item._count._all;
          if (item.status === 'done' && item._sum.actual_hours) {
            totalHoursDone = Number(item._sum.actual_hours);
          }
          return acc;
        }, {});

        return {
          task_count_by_status: statusCounts,
          total_tasks: totalTasks,
          total_hours: totalHoursDone,
          overdue_count: overdueCount,
        };
      },
    },
    comments: {
      async findForTask(this: any, taskId: number) {
        return this.findMany({
          where: { task_id: taskId, deleted_at: null },
          include: {
            users: true,
          },
          orderBy: { created_at: 'asc' },
        });
      },
    },
    activity_logs: {
      async findForTask(this: any, taskId: number) {
        const comments = await prisma.comments.findMany({
          where: { task_id: taskId },
          select: { id: true },
        });
        const commentIds = comments.map((c) => c.id);

        const OR_clause: any[] = [{ subject_type: 'task', subject_id: taskId }];
        if (commentIds.length > 0) {
          OR_clause.push({ subject_type: 'comment', subject_id: { in: commentIds } });
        }

        return this.findMany({
          where: { OR: OR_clause },
          include: {
            users: true,
          },
          orderBy: { created_at: 'desc' },
        });
      },
    },
    team_members: {
      async findActiveForProject(this: any, projectId: number) {
        return this.findMany({
          where: {
            project_id: projectId,
            deleted_at: null,
            users: {
              is_active: true,
              deleted_at: null,
            },
          },
          include: {
            users: true,
          },
        });
      },
    },
  },
});

export default prisma;
