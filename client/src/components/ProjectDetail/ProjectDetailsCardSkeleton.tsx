export function ProjectDetailsCardSkeleton() {
  return (
    <div className="w-full sm:w-[320px] bg-[#1e1e1e] border border-[#333]/40 rounded-3xl p-6 text-white text-left font-sans select-none min-h-62.5 flex flex-col justify-between animate-pulse">
      {/* Project title placeholder */}
      <div>
        <div className="h-7 bg-[#2d2d2d] rounded-md w-3/4 mb-6" />

        {/* Project detail fields placeholder */}
        <div className="space-y-4">
          {/* Status field */}
          <div className="flex gap-2 items-center">
            <div className="h-4.5 bg-[#2d2d2d] rounded-md w-16" />
            <div className="h-4.5 bg-[#2d2d2d] rounded-md w-24" />
          </div>
          {/* Dates field */}
          <div className="flex gap-2 items-center">
            <div className="h-4.5 bg-[#2d2d2d] rounded-md w-14" />
            <div className="h-4.5 bg-[#2d2d2d] rounded-md w-40" />
          </div>
          {/* Owner field */}
          <div className="flex gap-2 items-center">
            <div className="h-4.5 bg-[#2d2d2d] rounded-md w-16" />
            <div className="h-4.5 bg-[#2d2d2d] rounded-md w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailsCardSkeleton;
