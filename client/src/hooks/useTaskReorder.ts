import { useCallback } from 'react';
import api from '../services/api';
import type { ProjectTask } from '../types';

export function useTaskReorder(
  setTasksByStatus: React.Dispatch<
    React.SetStateAction<Record<ProjectTask['status'], ProjectTask[]>>
  >,
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>
) {
  // Execute task reordering (POST /tasks/reorder)
  const executeReorder = useCallback(
    async (
      status: ProjectTask['status'],
      taskId: number,
      targetIndex: number,
      currentTasks: ProjectTask[]
    ) => {
      const list = [...currentTasks];
      const sourceIdx = list.findIndex((t) => t.id === taskId);
      if (sourceIdx === -1 || sourceIdx === targetIndex) return;

      const [dragTask] = list.splice(sourceIdx, 1);
      list.splice(targetIndex, 0, dragTask);

      setTasksByStatus((prev) => ({
        ...prev,
        [status]: list,
      }));

      try {
        const payload = list.map((task, idx) => ({
          id: task.id,
          sort_order: idx,
        }));
        await api.post('/tasks/reorder', payload);
      } catch {
        // Revert sorting by incrementing refreshKey to force a refetch
        setRefreshKey((prev) => prev + 1);
        alert('Failed to reorder tasks on the server. Reverting.');
      }
    },
    [setTasksByStatus, setRefreshKey]
  );

  return { executeReorder };
}

export default useTaskReorder;
