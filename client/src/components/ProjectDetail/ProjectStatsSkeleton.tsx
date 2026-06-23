export function ProjectStatsSkeleton() {
  return (
    <div className="w-full sm:w-[320px] bg-[#1e1e1e] border border-[#333]/40 rounded-3xl p-6 text-white text-left font-sans select-none min-h-62.5 flex flex-col justify-between animate-pulse">
      <div>
        {/* Project Stats title placeholder */}
        <div className="h-6.5 bg-[#2d2d2d] rounded-md w-2/5 mb-6" />

        {/* Statistics list placeholders */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-4.5 bg-[#2d2d2d] rounded-md w-1/2" />
            <div className="h-4.5 bg-[#2d2d2d] rounded-md w-8" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-4.5 bg-[#2d2d2d] rounded-md w-3/5" />
            <div className="h-4.5 bg-[#2d2d2d] rounded-md w-8" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-4.5 bg-[#2d2d2d] rounded-md w-2/5" />
            <div className="h-4.5 bg-[#2d2d2d] rounded-md w-8" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-4.5 bg-[#2d2d2d] rounded-md w-1/2" />
            <div className="h-4.5 bg-[#2d2d2d] rounded-md w-8" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-4.5 bg-[#2d2d2d] rounded-md w-1/2" />
            <div className="h-4.5 bg-[#2d2d2d] rounded-md w-8" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-4.5 bg-[#2d2d2d] rounded-md w-2/5" />
            <div className="h-4.5 bg-[#2d2d2d] rounded-md w-8" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectStatsSkeleton;
