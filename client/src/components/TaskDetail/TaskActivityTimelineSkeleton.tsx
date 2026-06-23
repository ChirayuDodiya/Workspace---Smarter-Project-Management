export function TaskActivityTimelineSkeleton() {
  return (
    <div className="space-y-2 w-full text-left animate-pulse select-none">
      {/* Activity Timeline header */}
      <div className="h-6 bg-emerald-900/40 rounded w-1/4 mb-3" />

      {/* Activity Timeline container skeleton */}
      <div className="bg-[#1e1e1e]/95 border border-white/20 rounded-3xl sm:rounded-4xl p-5 sm:p-6 shadow-2xl min-h-40 flex flex-col justify-center">
        <div className="relative border-l border-emerald-800/20 ml-2 pl-4 space-y-5 py-1">
          {/* Connector Dot and row placeholders */}
          {[1, 2].map((i) => (
            <div key={i} className="relative text-left space-y-1">
              <div className="absolute -left-5.25 top-1.5 w-2.5 h-2.5 bg-emerald-800/40 rounded-full border border-[#1e1e1e]" />
              <div className="h-4 bg-[#2d2d2d] rounded-md w-3/5" />
              <div className="h-3 bg-[#252525] rounded-md w-1/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TaskActivityTimelineSkeleton;
