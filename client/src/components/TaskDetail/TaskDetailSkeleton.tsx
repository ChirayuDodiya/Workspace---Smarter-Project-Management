export function TaskDetailSkeleton() {
  return (
    <div className="bg-[#181818] border border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-5 animate-pulse select-none">
      {/* 1. Title */}
      <div className="space-y-1.5">
        <div className="h-3 bg-zinc-800 rounded w-10" />
        <div className="w-full h-10 bg-zinc-800/60 rounded-xl border border-zinc-800" />
      </div>

      {/* 2. Description */}
      <div className="space-y-1.5">
        <div className="h-3 bg-zinc-800 rounded w-20" />
        <div className="w-full h-20 bg-zinc-800/60 rounded-xl border border-zinc-800" />
      </div>

      {/* 3. Status & Priority */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="h-3 bg-zinc-800 rounded w-12" />
          <div className="w-full h-10 bg-zinc-800/60 rounded-xl border border-zinc-800" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 bg-zinc-800 rounded w-14" />
          <div className="w-full h-10 bg-zinc-800/60 rounded-xl border border-zinc-800" />
        </div>
      </div>

      {/* 4. Assigned To */}
      <div className="space-y-1.5">
        <div className="h-3 bg-zinc-800 rounded w-20" />
        <div className="w-full h-10 bg-zinc-800/60 rounded-xl border border-zinc-800" />
      </div>

      {/* 5. Due Date */}
      <div className="space-y-1.5">
        <div className="h-3 bg-zinc-800 rounded w-16" />
        <div className="w-full h-10 bg-zinc-800/60 rounded-xl border border-zinc-800" />
      </div>

      {/* 6. Hours */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="h-3 bg-zinc-800 rounded w-28" />
          <div className="w-full h-10 bg-zinc-800/60 rounded-xl border border-zinc-800" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 bg-zinc-800 rounded w-24" />
          <div className="w-full h-10 bg-zinc-800/60 rounded-xl border border-zinc-800" />
        </div>
      </div>

      <hr className="border-zinc-800" />

      {/* Delete button skeleton */}
      <div className="flex justify-end">
        <div className="w-32 h-9 bg-zinc-800/60 rounded-xl border border-zinc-800" />
      </div>
    </div>
  );
}

export default TaskDetailSkeleton;
