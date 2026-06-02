import { useSortable } from '@dnd-kit/react/sortable';
import { CollisionPriority } from '@dnd-kit/abstract';
import type { ProjectTask } from '../types';
import { formatDate } from '../utils/formatDate';

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

export function TaskCard({ task, index }: TaskCardProps) {
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

  return (
    <div
      ref={ref}
      id={`task-card-${task.id}`}
      className={`relative p-4 bg-[#1a1a1a] rounded-2xl border transition-all duration-200 select-none text-left cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-30' : ''
      } ${
        overdue
          ? 'border-red-500/80 shadow-md shadow-red-500/5'
          : 'border-[#333] hover:border-emerald-500/40'
      }`}
    >
      {/* Priority Badge in Top Right */}
      <span
        className={`absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${priorityClass}`}
      >
        {task.priority}
      </span>

      {/* Task Details */}
      <div className="space-y-2 mt-2 pr-20">
        <div className="flex gap-2">
          <span className="text-gray-400 font-bold text-sm tracking-wider">Title</span>
          <span className="text-white font-semibold text-sm line-clamp-2">{task.title}</span>
        </div>

        <div className="flex gap-2">
          <span className="text-gray-400 font-bold text-sm tracking-wider">Assign to</span>
          <span className="text-white font-semibold text-sm capitalize">{assigneeName}</span>
        </div>

        <div className="flex gap-2">
          <span className="text-gray-400 font-bold text-sm tracking-wider">Due date</span>
          <span className={`text-sm font-semibold ${overdue ? 'text-red-400' : 'text-white'}`}>
            {formattedDueDate}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TaskCard;
