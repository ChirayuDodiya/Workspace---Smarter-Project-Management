export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full animate-pulse select-none">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-[#181818] border border-zinc-800/80 rounded-2xl p-5 shadow-md text-left">
          <div className="space-y-3 grow">
            <div className="h-3.5 bg-zinc-800 rounded-md w-2/3" />
            <div className="h-7 bg-zinc-800/60 rounded-md w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatsSkeleton;
