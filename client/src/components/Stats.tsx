import { useState, useEffect } from 'react';
import api from '../services/api';
import type { DashboardStats } from '../types/dashboard';

export function Stats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        if (active && response.data && response.data.success) {
          setStats(response.data.data);
        }
      } catch {
        // ignore error
      }
    };

    void fetchStats();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="w-75 bg-[#052b14] border border-white/60 rounded-[1.8rem] p-6 text-white select-none min-h-55">
      <h2 className="text-xl font-bold mb-4">Stats:</h2>
      <div className="space-y-4 text-base font-semibold">
        <div className="flex gap-2">
          <div className="text-gray-300 text-xl">Total Projects:</div>
          <div className="text-xl">{stats?.total_projects ?? 0}</div>
        </div>
        <div className="flex gap-2">
          <div className="text-gray-300 text-xl">Active tasks:</div>
          <div className="text-xl">{stats?.active_tasks ?? 0}</div>
        </div>
        <div className="flex gap-2">
          <div className="text-gray-300 text-xl">Overdue tasks:</div>
          <div className="text-xl text-red-400">{stats?.overdue_tasks ?? 0}</div>
        </div>
        <div>
          <div className="flex gap-2">
            <div className="text-gray-300 text-xl">Tasks completed:</div>
            <div className="text-xl text-emerald-400">{stats?.completed_tasks ?? 0}</div>
          </div>
          <div className="text-xs text-gray-400 leading-none">(this week)</div>
        </div>
      </div>
    </div>
  );
}

export default Stats;
