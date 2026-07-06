import { useState, useEffect } from 'react';
import api from '../../services/api';
import type { DashboardStats } from '../../types/dashboard';
import StatsSkeleton from './StatsSkeleton';

export function Stats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await api.get('/dashboard/stats');
        if (active && response.data && response.data.success) {
          setStats(response.data.data);
        }
      } catch (err: unknown) {
        if (active) {
          const axiosError = err as { response?: { data?: { message?: string } } };
          setError(axiosError.response?.data?.message || 'Failed to load stats');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void fetchStats();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  if (isLoading) {
    return <StatsSkeleton />;
  }

  if (error) {
    return (
      <div className="w-full bg-[#181818] border border-zinc-800 rounded-2xl p-6 text-white text-center flex flex-col justify-center items-center">
        <div className="text-red-400 text-sm font-semibold bg-red-950/30 border border-red-500/30 rounded-xl py-2.5 px-4 max-w-md">
          {error}
        </div>
        <button
          onClick={() => setRefreshKey((prev) => prev + 1)}
          className="mt-3 text-sm text-emerald-400 hover:text-emerald-300 transition-colors font-semibold cursor-pointer focus:outline-none"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full text-white select-none">
      {/* Total Projects Card */}
      <div className="bg-[#181818] border border-zinc-800/80 rounded-2xl p-5 shadow-md text-left">
        <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block mb-1">Total Projects</span>
        <h3 className="text-3xl font-bold tracking-tight text-white">{stats?.total_projects ?? 0}</h3>
      </div>

      {/* Active Tasks Card */}
      <div className="bg-[#181818] border border-zinc-800/80 rounded-2xl p-5 shadow-md text-left">
        <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block mb-1">Active Tasks</span>
        <h3 className="text-3xl font-bold tracking-tight text-white">{stats?.active_tasks ?? 0}</h3>
      </div>

      {/* Overdue Tasks Card */}
      <div className="bg-[#181818] border border-zinc-800/80 rounded-2xl p-5 shadow-md text-left">
        <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block mb-1">Overdue Tasks</span>
        <h3 className="text-3xl font-bold tracking-tight text-red-400">{stats?.overdue_tasks ?? 0}</h3>
      </div>

      {/* Completed Tasks Card */}
      <div className="bg-[#181818] border border-zinc-800/80 rounded-2xl p-5 shadow-md text-left">
        <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block mb-1">Completed Tasks</span>
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-3xl font-bold tracking-tight text-emerald-400">{stats?.completed_tasks ?? 0}</h3>
          <span className="text-[10px] text-zinc-500 lowercase font-medium select-none">(this week)</span>
        </div>
      </div>
    </div>
  );
}

export default Stats;
