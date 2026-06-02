import { useDroppable } from '@dnd-kit/react';
import { CollisionPriority } from '@dnd-kit/abstract';
import type { ProjectTask } from '../types';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  id: string;
  label: string;
  tasks: ProjectTask[];
  hasMore: boolean;
  onSeeMore: () => void;
}

export function KanbanColumn({ id, label, tasks, hasMore, onSeeMore }: KanbanColumnProps) {
  const { ref, isDropTarget } = useDroppable({
    id,
    collisionPriority: CollisionPriority.Low,
  });

  return (
    <div
      ref={ref}
      className={`flex flex-col bg-[#121212] border rounded-3xl p-3 min-h-125 transition-all duration-200 ${
        isDropTarget
          ? 'border-emerald-500 shadow-lg shadow-emerald-500/5 bg-[#141d17]/40'
          : 'border-white'
      }`}
    >
      {/* Column Title */}
      <div className="flex items-center justify-center py-2 bg-[#043314] border border-white rounded-2xl text-white text-lg font-medium tracking-wide">
        {label}
      </div>

      {/* Task Cards List */}
      <div
        id={`column-list-${id}`}
        className="flex-1 flex flex-col gap-4 mt-4 overflow-y-auto pr-1"
      >
        {tasks.map((task, idx) => (
          <TaskCard key={task.id} task={task} index={idx} />
        ))}
        {tasks.length === 0 && (
          <div className="flex-1 flex flex-col justify-center items-center text-gray-500 border border-dashed border-[#2d2d2d] rounded-2xl p-4">
            <span className="text-sm font-semibold italic">No Tasks</span>
          </div>
        )}
      </div>

      {/* See More Link */}
      {hasMore && (
        <button
          type="button"
          onClick={onSeeMore}
          className="mt-4 py-1.5 text-emerald-400 hover:text-emerald-300 font-semibold text-sm text-center hover:underline cursor-pointer focus:outline-none border-t border-[#333]/40"
        >
          See More
        </button>
      )}
    </div>
  );
}

export default KanbanColumn;
