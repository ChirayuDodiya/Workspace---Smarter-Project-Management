import { useState, useCallback } from 'react';
import type { DragEndEvent } from '@dnd-kit/react';
import api from '../services/api';
import type { ProjectTask } from '../types';

interface PendingTransition {
  taskId: number;
  sourceStatus: ProjectTask['status'];
  destStatus: ProjectTask['status'];
  targetIndex: number;
  taskTitle: string;
}

interface UseTaskTransitionsProps {
  tasksByStatus: Record<ProjectTask['status'], ProjectTask[]>;
  setTasksByStatus: React.Dispatch<
    React.SetStateAction<Record<ProjectTask['status'], ProjectTask[]>>
  >;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  executeReorder: (
    status: ProjectTask['status'],
    taskId: number,
    targetIndex: number,
    currentTasks: ProjectTask[]
  ) => Promise<void>;
}

export function useTaskTransitions({
  tasksByStatus,
  setTasksByStatus,
  setRefreshKey,
  executeReorder,
}: UseTaskTransitionsProps) {
  const [isActualHoursPopUpOpen, setIsActualHoursPopUpOpen] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<PendingTransition | null>(null);

  const revertDOM = useCallback((taskId: number, sourceStatus: ProjectTask['status']) => {
    // @dnd-kit/dom physically reparents draggable elements during drag.
    // Before React reconciliation runs, we restore the node to its
    // original parent so React's expected DOM tree matches the actual DOM.
    // This prevents React 19 removeChild() NotFoundError crashes.
    const cardElement = document.getElementById(`task-card-${taskId}`);
    const originalParent = document.getElementById(`column-list-${sourceStatus}`);
    if (originalParent && cardElement && cardElement.parentNode !== originalParent) {
      originalParent.appendChild(cardElement);
    }
  }, []);

  const executeStatusChange = useCallback(
    async (
      taskId: number,
      sourceStatus: ProjectTask['status'],
      destStatus: ProjectTask['status'],
      targetIndex: number,
      actualHours?: number
    ) => {
      const sourceList = [...tasksByStatus[sourceStatus]];
      const destList = [...tasksByStatus[destStatus]];

      const taskIndex = sourceList.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return;

      const [dragTask] = sourceList.splice(taskIndex, 1);
      const updatedTask: ProjectTask = {
        ...dragTask,
        status: destStatus,
      };

      destList.splice(targetIndex, 0, updatedTask);

      setTasksByStatus((prev) => ({
        ...prev,
        [sourceStatus]: sourceList,
        [destStatus]: destList,
      }));

      try {
        const payload: { status: ProjectTask['status']; actual_hours?: number } = {
          status: destStatus,
        };
        if (actualHours !== undefined) {
          payload.actual_hours = actualHours;
        }
        await api.patch(`/tasks/${taskId}/status`, payload);
      } catch {
        setRefreshKey((prev) => prev + 1);
        alert('Failed to update task status on the server. Reverting.');
      }
    },
    [tasksByStatus, setTasksByStatus, setRefreshKey]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (event.canceled) return;

      const { source, target } = event.operation;
      if (!source || !target) return;

      const sortableSource = source as unknown as {
        sortable?: {
          initialGroup: ProjectTask['status'];
          group: ProjectTask['status'];
          index: number;
        };
      };
      if (!sortableSource.sortable) return;

      const taskId = Number(source.id);
      const targetId = target.id;
      const sourceStatus = sortableSource.sortable.initialGroup as ProjectTask['status'];

      let destStatus: ProjectTask['status'];
      let targetIndex: number;

      if (typeof targetId === 'string') {
        destStatus = targetId as ProjectTask['status'];
        targetIndex = tasksByStatus[destStatus].length;
      } else {
        destStatus = sortableSource.sortable.group as ProjectTask['status'];
        targetIndex = sortableSource.sortable.index;
      }

      let dragTask: ProjectTask | null = null;
      const task = tasksByStatus[sourceStatus]?.find((t) => t.id === taskId);
      if (task) {
        dragTask = task;
      }

      if (!dragTask) return;

      const statuses: ProjectTask['status'][] = ['todo', 'in_progress', 'in_review', 'done'];
      const title = dragTask.title;

      setTimeout(() => {
        revertDOM(taskId, sourceStatus);

        if (sourceStatus !== destStatus) {
          const sourceIdx = statuses.indexOf(sourceStatus);
          const destIdx = statuses.indexOf(destStatus);

          if (destIdx > sourceIdx + 1) {
            alert(`Invalid status transition from "${sourceStatus}" to "${destStatus}"`);
            setRefreshKey((prev) => prev + 1);
            return;
          }

          if (destStatus === 'done') {
            setPendingTransition({
              taskId,
              sourceStatus,
              destStatus,
              targetIndex,
              taskTitle: title,
            });
            setIsActualHoursPopUpOpen(true);
          } else {
            void executeStatusChange(taskId, sourceStatus, destStatus, targetIndex);
          }
        } else {
          void executeReorder(sourceStatus, taskId, targetIndex, tasksByStatus[sourceStatus]);
        }
      }, 0);
    },
    [tasksByStatus, revertDOM, setRefreshKey, executeStatusChange, executeReorder]
  );

  const handleHoursSubmit = useCallback(
    async (hours: number) => {
      setIsActualHoursPopUpOpen(false);
      if (pendingTransition) {
        const { taskId, sourceStatus, destStatus, targetIndex } = pendingTransition;
        revertDOM(taskId, sourceStatus);
        await executeStatusChange(taskId, sourceStatus, destStatus, targetIndex, hours);
        setPendingTransition(null);
      }
    },
    [pendingTransition, revertDOM, executeStatusChange]
  );

  const handleHoursCancel = useCallback(() => {
    setIsActualHoursPopUpOpen(false);
    if (pendingTransition) {
      const { taskId, sourceStatus } = pendingTransition;
      revertDOM(taskId, sourceStatus);
      setPendingTransition(null);
    }
    setRefreshKey((prev) => prev + 1);
  }, [pendingTransition, revertDOM, setRefreshKey]);

  return {
    isActualHoursPopUpOpen,
    pendingTransition,
    handleDragEnd,
    handleHoursSubmit,
    handleHoursCancel,
  };
}

export default useTaskTransitions;
