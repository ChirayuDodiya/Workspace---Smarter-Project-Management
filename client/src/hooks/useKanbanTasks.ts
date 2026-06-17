import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import type { ProjectTask } from '../types';
import { socket } from '../services/socket';

export function useKanbanTasks(slug: string, search: string = '') {
  const [tasksByStatus, setTasksByStatus] = useState<Record<ProjectTask['status'], ProjectTask[]>>({
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
  });

  const pagesByStatusRef = useRef<Record<ProjectTask['status'], number>>({
    todo: 1,
    in_progress: 1,
    in_review: 1,
    done: 1,
  });

  const [hasMoreByStatus, setHasMoreByStatus] = useState<Record<ProjectTask['status'], boolean>>({
    todo: false,
    in_progress: false,
    in_review: false,
    done: false,
  });

  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch tasks for a specific column status
  const fetchTasksForStatus = useCallback(
    async (status: ProjectTask['status'], page: number) => {
      try {
        const response = await api.get(`/projects/${slug}/tasks`, {
          params: {
            status,
            page,
            per_page: 5,
            sortBy: 'sort_order',
            order: 'asc',
            search: search || undefined,
          },
        });

        if (response.data && response.data.success) {
          const fetched = response.data.data;
          const meta = response.data.pagination;

          setTasksByStatus((prev) => {
            const currentList = prev[status] || [];
            if (page === 1) {
              return { ...prev, [status]: fetched };
            }
            const existingIds = new Set(currentList.map((t) => t.id));
            const uniqueNew = fetched.filter((t: ProjectTask) => !existingIds.has(t.id));
            return { ...prev, [status]: [...currentList, ...uniqueNew] };
          });

          if (meta) {
            setHasMoreByStatus((prev) => ({
              ...prev,
              [status]: meta.page < meta.total_pages,
            }));
          }
        }
      } catch {
        // ignore
      }
    },
    [slug, search]
  );

  // Fetch first page of tasks for all columns on mount or slug/search/refreshKey change
  useEffect(() => {
    if (slug) {
      pagesByStatusRef.current = {
        todo: 1,
        in_progress: 1,
        in_review: 1,
        done: 1,
      };
      const loadAll = async () => {
        setIsLoading(true);
        try {
          await Promise.all([
            fetchTasksForStatus('todo', 1),
            fetchTasksForStatus('in_progress', 1),
            fetchTasksForStatus('in_review', 1),
            fetchTasksForStatus('done', 1),
          ]);
        } finally {
          setIsLoading(false);
        }
      };
      void loadAll();
    }
  }, [slug, fetchTasksForStatus, refreshKey]);

  // Listen to real-time status change, assignment, updates, creation, and deletion
  useEffect(() => {
    if (!slug) return;

    const handleStatusChanged = (updatedTask: ProjectTask) => {
      setTasksByStatus((prev) => {
        const cleaned: Record<ProjectTask['status'], ProjectTask[]> = {
          todo: prev.todo.filter((t) => t.id !== updatedTask.id),
          in_progress: prev.in_progress.filter((t) => t.id !== updatedTask.id),
          in_review: prev.in_review.filter((t) => t.id !== updatedTask.id),
          done: prev.done.filter((t) => t.id !== updatedTask.id),
        };
        cleaned[updatedTask.status] = [updatedTask, ...cleaned[updatedTask.status]];
        return cleaned;
      });
    };

    const handleTaskUpdated = (updatedTask: ProjectTask) => {
      setTasksByStatus((prev) => {
        const cleaned: Record<ProjectTask['status'], ProjectTask[]> = {
          todo: prev.todo.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
          in_progress: prev.in_progress.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
          in_review: prev.in_review.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
          done: prev.done.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
        };
        return cleaned;
      });
    };

    const handleTaskCreated = (newTask: ProjectTask) => {
      setTasksByStatus((prev) => {
        const currentList = prev[newTask.status] || [];
        if (currentList.some((t) => t.id === newTask.id)) return prev;
        return {
          ...prev,
          [newTask.status]: [newTask, ...currentList],
        };
      });
    };

    const handleTaskDeleted = ({ taskId }: { taskId: number }) => {
      setTasksByStatus((prev) => {
        const cleaned: Record<ProjectTask['status'], ProjectTask[]> = {
          todo: prev.todo.filter((t) => t.id !== taskId),
          in_progress: prev.in_progress.filter((t) => t.id !== taskId),
          in_review: prev.in_review.filter((t) => t.id !== taskId),
          done: prev.done.filter((t) => t.id !== taskId),
        };
        return cleaned;
      });
    };

    socket.on('task:status_changed', handleStatusChanged);
    socket.on('task:assigned', handleTaskUpdated);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);

    return () => {
      socket.off('task:status_changed', handleStatusChanged);
      socket.off('task:assigned', handleTaskUpdated);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
    };
  }, [slug]);

  // useCallback is used here to memoize the handleSeeMore callback, ensuring that its reference remains stable across renders and does not cause children (like KanbanColumn) to unnecessarily re-render.
  const handleSeeMore = useCallback(
    (status: ProjectTask['status']) => {
      const nextPage = (pagesByStatusRef.current[status] || 1) + 1;
      pagesByStatusRef.current[status] = nextPage;
      void fetchTasksForStatus(status, nextPage);
    },
    [fetchTasksForStatus]
  );

  return {
    tasksByStatus,
    setTasksByStatus,
    hasMoreByStatus,
    handleSeeMore,
    refreshKey,
    setRefreshKey,
    isLoading,
  };
}

export default useKanbanTasks;
