export function ProjectCardSkeleton() {
  return (
    <div className="p-5 bg-[#181818] border border-zinc-800/80 rounded-2xl min-h-42 flex flex-col justify-between animate-pulse select-none text-left">
      <div className="flex justify-between items-start gap-4">
        {/* Name and Description skeletons */}
        <div className="space-y-2 grow">
          <div className="bg-zinc-800 h-5 w-2/5 rounded" />
          <div className="space-y-1">
            <div className="bg-zinc-800/50 h-3 w-4/5 rounded" />
            <div className="bg-zinc-800/50 h-3 w-3/5 rounded" />
          </div>
        </div>

        {/* Status and Action Buttons placeholder */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="bg-zinc-800/50 h-5 w-16 rounded-full" />
          <div className="flex gap-1.5">
            <div className="bg-zinc-850 h-7.5 w-7.5 rounded-lg" />
            <div className="bg-zinc-850 h-7.5 w-7.5 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Progress placeholder */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-center">
          <div className="bg-zinc-800 h-3.5 w-24 rounded" />
          <div className="bg-zinc-800 h-3.5 w-8 rounded" />
        </div>
        <div className="w-full bg-zinc-900 h-2 rounded-full border border-zinc-950" />
      </div>
    </div>
  );
}

export default ProjectCardSkeleton;
