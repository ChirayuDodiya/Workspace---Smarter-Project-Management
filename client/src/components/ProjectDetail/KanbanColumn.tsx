import { memo } from 'react';
import { useDroppable } from '@dnd-kit/react';
import { CollisionPriority } from '@dnd-kit/abstract';
import type { ProjectTask } from '../../types';
import TaskCard from './TaskCard';
import TaskCardSkeleton from './TaskCardSkeleton';

interface KanbanColumnProps {
  id: string;
  label: string;
  tasks: ProjectTask[];
  hasMore: boolean;
  onSeeMore: (status: ProjectTask['status']) => void;
  isLoading?: boolean;
}

// React.memo is used here to avoid re-rendering the entire KanbanColumn component and all its nested children (like TaskCards) unless its inputs (id, label, tasks list, hasMore, or the onSeeMore handler) actually change.
export const KanbanColumn = memo(function KanbanColumn({
  id,
  label,
  tasks,
  hasMore,
  onSeeMore,
  isLoading = false,
}: KanbanColumnProps) {
  const { ref, isDropTarget } = useDroppable({
    id,
    collisionPriority: CollisionPriority.Low,
  });

  const columnLabels: Record<string, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    in_review: 'In Review',
    done: 'Done',
  };

  return (
    <div
      ref={ref}
      className={`flex flex-col rounded-2xl p-3 min-h-125 transition-all duration-200 ${
        isDropTarget
          ? 'bg-emerald-950/10 border border-emerald-500/40 shadow-lg shadow-emerald-500/5'
          : 'bg-[#181818] border border-zinc-800/80'
      }`}
    >
      {/* Column Title */}
      <div className="flex items-center justify-center py-2 bg-zinc-900/80 border border-zinc-800/80 rounded-xl text-zinc-300 text-sm font-bold tracking-wide">
        {columnLabels[label] || label}
      </div>

      {/* Task Cards List */}
      <div
        id={`column-list-${id}`}
        className="flex-1 flex flex-col gap-3 mt-3 overflow-y-auto pr-0.5"
      >
        {tasks.map((task, idx) => (
          <TaskCard key={task.id} task={task} index={idx} />
        ))}
        {isLoading && (
          <>
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </>
        )}
        {tasks.length === 0 && !isLoading && (
          <div className="flex-1 flex flex-col justify-center items-center text-zinc-700 border border-dashed border-zinc-800 rounded-xl p-4">
            <span className="text-xs font-semibold italic">No tasks</span>
          </div>
        )}
      </div>

      {/* See More Link */}
      {hasMore && !isLoading && (
        <button
          type="button"
          onClick={() => onSeeMore(id as ProjectTask['status'])}
          className="mt-3 py-1.5 text-emerald-400 hover:text-emerald-300 font-semibold text-xs text-center hover:underline cursor-pointer focus:outline-none border-t border-zinc-800/60"
        >
          See More
        </button>
      )}
    </div>
  );
});

export default KanbanColumn;
