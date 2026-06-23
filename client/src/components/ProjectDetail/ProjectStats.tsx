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
      <div className="w-full sm:w-[320px] bg-[#1e1e1e] border border-[#333] rounded-3xl p-6 text-white text-left font-sans select-none min-h-62.5 flex flex-col justify-center">
        <span className="text-red-400 font-semibold">{error || 'No statistics available.'}</span>
      </div>
    );
  }

  const { task_count_by_status = {}, total_hours, overdue_count } = stats;

  const todo = task_count_by_status.todo || 0;
  const inProgress = task_count_by_status.in_progress || 0;
  const inReview = task_count_by_status.in_review || 0;
  const done = task_count_by_status.done || 0;

  return (
    <div className="w-full sm:w-[320px] bg-[#1e1e1e] border border-[#333] rounded-3xl p-6 text-white text-left font-sans select-none">
      <h2 className="text-xl font-bold text-white mb-2">Project Stats</h2>

      <div className="space-y-2.5 font-semibold text-white">
        <div>
          <span className="text-emerald-400">Logged Hours: </span>
          <span>
            {Number(total_hours) > 0 ? parseFloat(total_hours).toFixed(1).replace(/\.0$/, '') : '0'}
            h
          </span>
        </div>

        <div>
          <span className="text-emerald-400">Overdue Tasks: </span>
          <span className={overdue_count > 0 ? 'text-red-400' : ''}>{overdue_count}</span>
        </div>

        <div>
          <span className="text-emerald-400">Todo Tasks: </span>
          <span>{todo}</span>
        </div>

        <div>
          <span className="text-emerald-400">In Progress: </span>
          <span>{inProgress}</span>
        </div>

        <div>
          <span className="text-emerald-400">In Review: </span>
          <span>{inReview}</span>
        </div>

        <div>
          <span className="text-emerald-400">Completed: </span>
          <span>{done}</span>
        </div>
      </div>
    </div>
  );
}

export default ProjectStats;
