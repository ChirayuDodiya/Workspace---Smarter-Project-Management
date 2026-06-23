export function TaskCommentsSkeleton() {
  return (
    <div className="space-y-2 w-full text-left animate-pulse select-none">
      {/* Comments section header */}
      <div className="h-7.5 bg-emerald-900/40 rounded w-1/4 mb-3" />

      {/* Comments container skeleton */}
      <div className="bg-[#1e1e1e]/95 border border-white/20 rounded-3xl sm:rounded-4xl p-4 sm:p-6 shadow-2xl h-120 sm:h-150 flex flex-col justify-between">
        {/* Comment list skeleton */}
        <div className="flex-1 space-y-4 mb-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-3.5 bg-[#121212]/50 border border-white/5 rounded-2xl space-y-2.5"
            >
              <div className="flex justify-between items-center">
                <div className="h-3.5 bg-[#2d2d2d] rounded-md w-1/4" />
                <div className="h-3 bg-[#202020] rounded-md w-16" />
              </div>
              <div className="h-4 bg-[#2d2d2d] rounded-md w-4/5 pl-1" />
            </div>
          ))}
        </div>

        {/* Input box placeholder */}
        <div className="flex gap-2 items-center mt-auto">
          <div className="flex-1 h-11 bg-[#2d2d2d] rounded-xl border border-zinc-800" />
          <div className="w-11 h-11 bg-[#2d2d2d] rounded-xl border border-zinc-800" />
        </div>
      </div>
    </div>
  );
}

export default TaskCommentsSkeleton;
