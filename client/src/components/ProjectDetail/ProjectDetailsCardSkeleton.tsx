export function ProjectDetailsCardSkeleton() {
  return (
    <div className="w-full sm:w-75 bg-[#181818] border border-zinc-800/80 rounded-2xl p-5 text-white text-left select-none shrink-0 animate-pulse">
      {/* Project title placeholder */}
      <div className="h-6 bg-zinc-800 rounded-md w-3/4 mb-5" />

      {/* Project detail fields placeholder */}
      <div className="space-y-4">
        {/* Status field */}
        <div className="space-y-1.5">
          <div className="h-3 bg-zinc-800/60 rounded-md w-12" />
          <div className="h-4 bg-zinc-800 rounded-md w-20" />
        </div>
        {/* Dates field */}
        <div className="space-y-1.5">
          <div className="h-3 bg-zinc-800/60 rounded-md w-10" />
          <div className="h-4 bg-zinc-800 rounded-md w-44" />
        </div>
        {/* Owner field */}
        <div className="space-y-1.5">
          <div className="h-3 bg-zinc-800/60 rounded-md w-12" />
          <div className="h-4 bg-zinc-800 rounded-md w-28" />
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailsCardSkeleton;
