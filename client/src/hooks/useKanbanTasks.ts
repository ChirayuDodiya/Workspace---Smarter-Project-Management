import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { ProjectTask } from '../types';

export function useKanbanTasks(slug: string) {
  const [tasksByStatus, setTasksByStatus] = useState<Record<ProjectTask['status'], ProjectTask[]>>({
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
  });

  const [pagesByStatus, setPagesByStatus] = useState<Record<ProjectTask['status'], number>>({
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
    [slug]
  );

  // Fetch first page of tasks for all columns on mount or slug/refreshKey change
  useEffect(() => {
    if (slug) {
      const timer = setTimeout(() => {
        void fetchTasksForStatus('todo', 1);
        void fetchTasksForStatus('in_progress', 1);
        void fetchTasksForStatus('in_review', 1);
        void fetchTasksForStatus('done', 1);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [slug, fetchTasksForStatus, refreshKey]);

  const handleSeeMore = (status: ProjectTask['status']) => {
    const nextPage = (pagesByStatus[status] || 1) + 1;
    setPagesByStatus((prev) => ({ ...prev, [status]: nextPage }));
    void fetchTasksForStatus(status, nextPage);
  };

  return {
    tasksByStatus,
    setTasksByStatus,
    hasMoreByStatus,
    handleSeeMore,
    refreshKey,
    setRefreshKey,
  };
}

export default useKanbanTasks;
