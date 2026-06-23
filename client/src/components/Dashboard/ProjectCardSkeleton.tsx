export function ProjectCardSkeleton() {
  return (
    <div className="p-6 bg-[#1e1e1e] border border-[#333] rounded-2xl min-h-40 h-auto sm:h-40 flex flex-col justify-between animate-pulse select-none text-left">
      <div className="flex justify-between items-start">
        <div className="space-y-3 w-1/2">
          {/* Name placeholder */}
          <div className="flex gap-2 items-center">
            <div className="bg-[#2d2d2d] h-4 w-12 rounded" />
            <div className="bg-[#333] h-4 w-28 rounded" />
          </div>
          {/* Slug placeholder */}
          <div className="flex gap-2 items-center">
            <div className="bg-[#2d2d2d] h-4 w-10 rounded" />
            <div className="bg-[#333] h-4 w-20 rounded" />
          </div>
        </div>

        {/* Status placeholder */}
        <div className="bg-[#2d2d2d] h-7 w-20 rounded-full border border-zinc-800" />
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-center">
          <div className="bg-[#2d2d2d] h-4 w-24 rounded" />
          <div className="bg-[#2d2d2d] h-4 w-8 rounded" />
        </div>
        <div className="w-full bg-[#2d2d2d] h-2.5 rounded-full border border-zinc-800" />
      </div>
    </div>
  );
}

export default ProjectCardSkeleton;
