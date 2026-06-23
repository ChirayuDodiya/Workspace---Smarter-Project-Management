export function StatsSkeleton() {
  return (
    <div className="w-full sm:w-75 bg-[#052b14] border border-white/60 rounded-[1.8rem] p-6 text-white select-none min-h-55 animate-pulse">
      {/* Title skeleton */}
      <div className="h-7 bg-[#0b3d1f] rounded-md w-1/3 mb-6" />

      {/* Items list skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-5 bg-[#0b3d1f] rounded-md w-1/2" />
          <div className="h-5 bg-[#0b3d1f] rounded-md w-8" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-5 bg-[#0b3d1f] rounded-md w-2/5" />
          <div className="h-5 bg-[#0b3d1f] rounded-md w-8" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-5 bg-[#0b3d1f] rounded-md w-1/2" />
          <div className="h-5 bg-[#0b3d1f] rounded-md w-8" />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <div className="h-5 bg-[#0b3d1f] rounded-md w-3/5" />
            <div className="h-5 bg-[#0b3d1f] rounded-md w-8" />
          </div>
          <div className="h-3.5 bg-[#0b3d1f] rounded-md w-12" />
        </div>
      </div>
    </div>
  );
}

export default StatsSkeleton;
