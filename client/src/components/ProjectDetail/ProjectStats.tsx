import { useState, useEffect } from 'react';
import api from '../../services/api';
import type { ProjectStatsData } from '../../types';
import ProjectStatsSkeleton from './ProjectStatsSkeleton';

interface ProjectStatsProps {
  slug: string;
}

export function ProjectStats({ slug }: ProjectStatsProps) {
  const [stats, setStats] = useState<ProjectStatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/projects/${slug}/stats`);
        if (active && response.data && response.data.success) {
          setStats(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch project stats:', err);
        if (active) {
          setError('Failed to load project statistics.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (slug) {
      void fetchStats();
    }

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return <ProjectStatsSkeleton />;
  }

  if (error || !stats) {
    return (
      <div className="w-full sm:w-70 bg-[#181818] border border-zinc-800/80 rounded-2xl p-5 text-white text-left select-none shrink-0 flex flex-col justify-center min-h-40">
        <span className="text-red-400 text-sm font-semibold">{error || 'No statistics available.'}</span>
      </div>
    );
  }

  const { task_count_by_status = {}, total_hours, overdue_count } = stats;

  const todo = task_count_by_status.todo || 0;
  const inProgress = task_count_by_status.in_progress || 0;
  const inReview = task_count_by_status.in_review || 0;
  const done = task_count_by_status.done || 0;

  return (
    <div className="w-full sm:w-70 bg-[#181818] border border-zinc-800/80 rounded-2xl p-5 text-white text-left select-none shrink-0">
      <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Project Stats</h2>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        <div>
          <span className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Logged Hours</span>
          <span className="text-white font-bold text-lg">
            {Number(total_hours) > 0 ? parseFloat(total_hours).toFixed(1).replace(/\.0$/, '') : '0'}h
          </span>
        </div>

        <div>
          <span className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Overdue</span>
          <span className={`font-bold text-lg ${overdue_count > 0 ? 'text-red-400' : 'text-white'}`}>
            {overdue_count}
          </span>
        </div>

        <div>
          <span className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-0.5">To Do</span>
          <span className="text-white font-bold text-lg">{todo}</span>
        </div>

        <div>
          <span className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-0.5">In Progress</span>
          <span className="text-white font-bold text-lg">{inProgress}</span>
        </div>

        <div>
          <span className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-0.5">In Review</span>
          <span className="text-white font-bold text-lg">{inReview}</span>
        </div>

        <div>
          <span className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Completed</span>
          <span className="text-emerald-400 font-bold text-lg">{done}</span>
        </div>
      </div>
    </div>
  );
}

export default ProjectStats;
