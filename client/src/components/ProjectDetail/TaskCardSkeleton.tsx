export function TaskCardSkeleton() {
  return (
    <div className="relative p-4 bg-[#1a1a1a] rounded-2xl border border-[#333] animate-pulse select-none text-left">
      {/* Priority Badge placeholder */}
      <div className="absolute top-4 right-4 bg-[#2d2d2d] h-5 w-14 rounded-full" />

      {/* Task Details placeholders */}
      <div className="space-y-3 mt-2 pr-20">
        {/* Title */}
        <div className="flex gap-2 items-center">
          <span className="bg-[#2d2d2d] h-4.5 w-10 rounded" />
          <span className="bg-[#333] h-4.5 w-24 rounded" />
        </div>

        {/* Assignee */}
        <div className="flex gap-2 items-center">
          <span className="bg-[#2d2d2d] h-4.5 w-16 rounded" />
          <span className="bg-[#333] h-4.5 w-18 rounded" />
        </div>

        {/* Due date */}
        <div className="flex gap-2 items-center">
          <span className="bg-[#2d2d2d] h-4.5 w-16 rounded" />
          <span className="bg-[#333] h-4.5 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

export default TaskCardSkeleton;
