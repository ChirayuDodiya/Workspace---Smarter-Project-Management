export function TaskDetailSkeleton() {
  return (
    <div className="max-w-2xl bg-[#1e1e1e]/95 border border-white/20 rounded-3xl sm:rounded-4xl p-5 sm:p-8 shadow-2xl space-y-6 animate-pulse select-none">
      {/* 1. Title Row Skeleton */}
      <div className="space-y-1">
        <div className="h-4 bg-emerald-900/40 rounded w-12" />
        <div className="w-full h-11 bg-[#2d2d2d] rounded-xl border border-zinc-800" />
      </div>

      {/* 2. Description Row Skeleton */}
      <div className="space-y-1">
        <div className="h-4 bg-emerald-900/40 rounded w-20" />
        <div className="w-full h-24 bg-[#2d2d2d] rounded-2xl border border-zinc-800" />
      </div>

      {/* 3. Status & Priority Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-1">
          <div className="h-4 bg-emerald-900/40 rounded w-14" />
          <div className="w-full h-11 bg-[#2d2d2d] rounded-xl border border-zinc-800" />
        </div>
        <div className="space-y-1">
          <div className="h-4 bg-emerald-900/40 rounded w-14" />
          <div className="w-full h-11 bg-[#2d2d2d] rounded-xl border border-zinc-800" />
        </div>
      </div>

      {/* 4. Assigned To Skeleton */}
      <div className="space-y-1">
        <div className="h-4 bg-emerald-900/40 rounded w-20" />
        <div className="w-full h-11 bg-[#2d2d2d] rounded-xl border border-zinc-800" />
      </div>

      {/* 5. Due Date Skeleton */}
      <div className="space-y-1">
        <div className="h-4 bg-emerald-900/40 rounded w-16" />
        <div className="w-full h-11 bg-[#2d2d2d] rounded-xl border border-zinc-800" />
      </div>

      {/* 6. Estimated Hours & Actual Hours Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-1">
          <div className="h-4 bg-emerald-900/40 rounded w-28" />
          <div className="w-full h-11 bg-[#2d2d2d] rounded-xl border border-zinc-800" />
        </div>
        <div className="space-y-1">
          <div className="h-4 bg-emerald-900/40 rounded w-24" />
          <div className="w-full h-11 bg-[#2d2d2d] rounded-xl border border-zinc-800" />
        </div>
      </div>

      {/* Divider */}
      <hr className="border-white/10" />

      {/* Delete button skeleton */}
      <div className="flex justify-end pt-2">
        <div className="w-36 h-9 bg-[#2d2d2d] rounded-xl border border-zinc-800" />
      </div>
    </div>
  );
}

export default TaskDetailSkeleton;
