export function ProjectStatsSkeleton() {
  return (
    <div className="w-full sm:w-70 bg-[#181818] border border-zinc-800/80 rounded-2xl p-5 text-white text-left select-none shrink-0 animate-pulse">
      {/* Title placeholder */}
      <div className="h-3 bg-zinc-800 rounded-md w-2/5 mb-5" />

      {/* 2-column stat grid placeholders */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 bg-zinc-800/60 rounded-md w-3/4" />
            <div className="h-6 bg-zinc-800 rounded-md w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectStatsSkeleton;
