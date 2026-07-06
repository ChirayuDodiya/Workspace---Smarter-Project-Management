import { useMemo, useState, useEffect } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import KanbanColumn from './KanbanColumn';
import ActualHoursPopUp from './ActualHoursPopUp';
import useKanbanTasks from '../../hooks/useKanbanTasks';
import useTaskReorder from '../../hooks/useTaskReorder';
import useTaskTransitions from '../../hooks/useTaskTransitions';

interface KanbanBoardProps {
  slug: string;
  onAddTask: () => void;
  onMembers: () => void;
}

export function KanbanBoard({ slug, onAddTask, onMembers }: KanbanBoardProps) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query changes to avoid aggressive server requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchInput]);

  // 1. Manage tasks and pagination states
  const {
    tasksByStatus,
    setTasksByStatus,
    hasMoreByStatus,
    handleSeeMore,
    refreshKey,
    setRefreshKey,
    isLoading,
  } = useKanbanTasks(slug, debouncedSearch);

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

  // useMemo is used here to memoize the static columns configuration array, preventing it from being re-allocated on every render of KanbanBoard.
  const columns = useMemo(
    () => [
      { id: 'todo' as const, label: 'todo' },
      { id: 'in_progress' as const, label: 'in_progress' },
      { id: 'in_review' as const, label: 'in_review' },
      { id: 'done' as const, label: 'done' },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Search Bar + Action Buttons Row */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search tasks by title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-10 pl-11 pr-16 bg-[#181818] border border-zinc-800 hover:border-zinc-700 focus:border-[#098032] focus:ring-1 focus:ring-[#098032]/30 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none transition-all shadow-sm"
          />
          {/* Search Icon */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {/* Clear button */}
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-300 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors duration-200"
            >
              clear
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <button
          type="button"
          onClick={onAddTask}
          className="h-10 px-5 bg-[#045c22] hover:bg-[#074c1f] rounded-xl text-white text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer shadow-md hover:shadow-[0_4px_12px_rgba(4,92,34,0.2)] focus:outline-none border border-transparent shrink-0"
        >
          Add Task
        </button>
        <button
          type="button"
          onClick={onMembers}
          className="h-10 px-5 bg-[#181818] hover:bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700 rounded-xl text-zinc-300 hover:text-white text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer shadow-sm focus:outline-none shrink-0"
        >
          Members
        </button>
      </div>

      <DragDropProvider key={refreshKey} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border border-zinc-800/60 rounded-2xl">
          {columns.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              tasks={tasksByStatus[col.id] || []}
              hasMore={hasMoreByStatus[col.id] || false}
              onSeeMore={handleSeeMore}
              isLoading={isLoading}
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
    </div>
  );
}

export default KanbanBoard;
