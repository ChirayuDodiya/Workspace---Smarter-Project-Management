import { memo } from 'react';
import { useSortable } from '@dnd-kit/react/sortable';
import { CollisionPriority } from '@dnd-kit/abstract';
import { useNavigate, useParams } from 'react-router-dom';
import type { ProjectTask } from '../../types';
import { formatDate } from '../../utils/formatDate';

interface TaskCardProps {
  task: ProjectTask;
  index: number;
}

const isOverdue = (task: ProjectTask) => {
  if (task.status === 'done' || !task.due_date) return false;

  const due = new Date(task.due_date);
  due.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return due < today;
};

// React.memo is used here to prevent unnecessary re-renders of the TaskCard component when other cards are dragged, reordered, or when state in the parent Kanban column/board updates, unless this specific card's task or index changes.
export const TaskCard = memo(function TaskCard({ task, index }: TaskCardProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { ref, isDragging } = useSortable({
    id: task.id,
    index,
    group: task.status,
    collisionPriority: CollisionPriority.High,
  });

  const overdue = isOverdue(task);
  const formattedDueDate = formatDate(task.due_date || null);
  const assigneeName = task.assigned_to?.name || 'Unassigned';

  const priorityStyles: Record<string, string> = {
    low: 'bg-[#043314]/30 border border-emerald-500 text-emerald-400',
    medium: 'bg-yellow-500/10 border border-yellow-500 text-yellow-400',
    high: 'bg-[#4c1c1c]/30 border border-[#b85c5c] text-[#e08b8b]',
    critical: 'bg-purple-500/10 border border-purple-500 text-purple-400',
  };

  const priorityClass =
    priorityStyles[task.priority] || 'bg-zinc-800 border border-zinc-700 text-zinc-300';

  const handleCardClick = () => {
    navigate(`/projects/${slug}/tasks/${task.id}`);
  };

  return (
    <div
      ref={ref}
      id={`task-card-${task.id}`}
      onClick={handleCardClick}
      className={`relative p-4 bg-[#181818] rounded-2xl border transition-all duration-200 select-none text-left cursor-pointer ${
        isDragging ? 'opacity-30' : ''
      } ${overdue ? 'border-red-500/70 shadow-md shadow-red-500/5' : 'border-zinc-800/80 hover:border-zinc-700/80 hover:shadow-md'}`}
    >
      {/* Priority Badge in Top Right */}
      <span
        className={`absolute top-3.5 right-3.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${priorityClass}`}
      >
        {task.priority}
      </span>

      {/* Task Title */}
      <p className="text-sm font-bold text-white line-clamp-2 pr-20 mb-3 leading-snug">{task.title}</p>

      {/* Task Meta */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wide shrink-0">Assignee</span>
          <span className="text-zinc-300 text-xs font-semibold capitalize truncate">{assigneeName}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wide shrink-0">Due</span>
          <span className={`text-xs font-semibold ${overdue ? 'text-red-400' : 'text-zinc-300'}`}>
            {formattedDueDate}
          </span>
        </div>
      </div>
    </div>
  );
});

export default TaskCard;
