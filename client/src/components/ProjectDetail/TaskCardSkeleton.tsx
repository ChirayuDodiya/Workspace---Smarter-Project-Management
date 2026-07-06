export function TaskCardSkeleton() {
  return (
    <div className="relative p-4 bg-[#181818] rounded-2xl border border-zinc-800/80 animate-pulse select-none text-left">
      {/* Priority Badge placeholder */}
      <div className="absolute top-3.5 right-3.5 bg-zinc-800 h-5 w-14 rounded-full" />

      {/* Title placeholder */}
      <div className="bg-zinc-800 h-4 w-4/5 rounded mb-3 pr-20" />

      {/* Meta rows */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="bg-zinc-800/60 h-3 w-14 rounded" />
          <div className="bg-zinc-800 h-3 w-24 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-zinc-800/60 h-3 w-7 rounded" />
          <div className="bg-zinc-800 h-3 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

export default TaskCardSkeleton;
