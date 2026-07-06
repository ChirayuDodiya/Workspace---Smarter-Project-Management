export function UserRowSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 py-4 sm:py-3.5 px-6 animate-pulse select-none">
      {/* User profile details skeleton */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Circular Avatar Placeholder */}
        <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700/50 shrink-0" />
        <div className="grow flex flex-col justify-center min-w-0 space-y-2">
          {/* Name placeholder */}
          <div className="h-4.5 bg-zinc-800 rounded-md w-1/3" />
          {/* Email placeholder */}
          <div className="h-3 bg-zinc-800/60 rounded-md w-1/2" />
        </div>
      </div>

      {/* Role & Actions Container for Mobile alignment */}
      <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto shrink-0">
        {/* Role selection dropdown skeleton */}
        <div className="w-40 sm:w-48">
          <div className="w-full h-9 bg-zinc-800 rounded-xl border border-zinc-800" />
        </div>

        {/* Soft delete/restore button skeleton */}
        <div className="w-24 flex justify-end gap-2">
          <div className="w-8 h-8 bg-zinc-800 rounded-lg border border-zinc-800" />
          <div className="w-8 h-8 bg-zinc-800 rounded-lg border border-zinc-800" />
        </div>
      </div>
    </div>
  );
}

export default UserRowSkeleton;
