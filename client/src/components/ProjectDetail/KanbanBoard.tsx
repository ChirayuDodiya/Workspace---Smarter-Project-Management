import { DragDropProvider } from '@dnd-kit/react';
import KanbanColumn from './KanbanColumn';
import ActualHoursPopUp from './ActualHoursPopUp';
import useKanbanTasks from '../../hooks/useKanbanTasks';
import useTaskReorder from '../../hooks/useTaskReorder';
import useTaskTransitions from '../../hooks/useTaskTransitions';

interface KanbanBoardProps {
  slug: string;
}

export function KanbanBoard({ slug }: KanbanBoardProps) {
  // 1. Manage tasks and pagination states
  const {
    tasksByStatus,
    setTasksByStatus,
    hasMoreByStatus,
    handleSeeMore,
    refreshKey,
    setRefreshKey,
  } = useKanbanTasks(slug);

  // 2. Manage tasks reordering logic
  const { executeReorder } = useTaskReorder(setTasksByStatus, setRefreshKey);

  // 3. Manage tasks transitions logic (including Drag & Drop end hook)
  const {
    isActualHoursPopUpOpen,
    pendingTransition,
    handleDragEnd,
    handleHoursSubmit,
    handleHoursCancel,
  } = useTaskTransitions({
    tasksByStatus,
    setTasksByStatus,
    setRefreshKey,
    executeReorder,
  });

  return (
    <DragDropProvider key={refreshKey} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-4 gap-6 pt-4 border border-white rounded-2xl">
        {[
          { id: 'todo' as const, label: 'todo' },
          { id: 'in_progress' as const, label: 'in_progress' },
          { id: 'in_review' as const, label: 'in_review' },
          { id: 'done' as const, label: 'done' },
        ].map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            label={col.label}
            tasks={tasksByStatus[col.id] || []}
            hasMore={hasMoreByStatus[col.id] || false}
            onSeeMore={() => handleSeeMore(col.id)}
          />
        ))}
      </div>

      <ActualHoursPopUp
        isOpen={isActualHoursPopUpOpen}
        onClose={handleHoursCancel}
        onSubmit={handleHoursSubmit}
        taskTitle={pendingTransition?.taskTitle || ''}
      />
    </DragDropProvider>
  );
}

export default KanbanBoard;
