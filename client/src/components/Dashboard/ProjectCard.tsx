import { Link } from 'react-router-dom';
import api from '../../services/api';
import type { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  onDeleteSuccess: () => void;
}

export function ProjectCard({ project, onDeleteSuccess }: ProjectCardProps) {
  const totalTasks = project.task_count || 0;
  const completedTasks = project.completed_tasks || 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm(`Are you sure you want to delete project "${project.name}"?`)) {
      try {
        const response = await api.delete(`/projects/${project.slug}`);
        if (response.data && response.data.success) {
          onDeleteSuccess();
        }
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        const msg = axiosError.response?.data?.message || 'Failed to delete project.';
        alert(msg);
      }
    }
  };

  const handleDownloadCSV = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await api.get(`/projects/${project.slug}/export-tasks`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${project.slug}-tasks.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error('Failed to download CSV:', err);
      alert('Failed to download tasks CSV.');
    }
  };

  const getStatusColor = (_status: string) => {
    return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
  };

  return (
    <Link
      to={`/projects/${project.slug}`}
      className="p-5 bg-[#181818] border border-zinc-800/80 hover:border-zinc-700/80 hover:shadow-lg rounded-2xl transition-all duration-200 select-none flex flex-col justify-between min-h-42 group cursor-pointer text-left"
    >
      <div className="flex justify-between items-start gap-4">
        {/* Project Name and Description */}
        <div className="min-w-0 grow">
          <h3 className="text-white text-lg font-bold tracking-tight group-hover:text-emerald-400 transition-colors duration-150 truncate">
            {project.name}
          </h3>
          <p className="text-zinc-500 text-xs mt-1 line-clamp-2 leading-relaxed h-8">
            {project.description || 'No description provided.'}
          </p>
        </div>

        {/* Action Controls & Status */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider select-none ${getStatusColor(
              project.status
            )}`}
          >
            {project.status.replace('_', ' ')}
          </span>
          <div className="flex gap-1.5 items-center">
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-850 hover:border-emerald-500/30 text-zinc-500 hover:text-emerald-400 transition-colors cursor-pointer select-none focus:outline-none flex items-center justify-center"
              title="Download Tasks CSV"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-850 hover:border-red-500/30 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer select-none focus:outline-none flex items-center justify-center"
              title="Delete Project"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mt-4">
        <div className="flex justify-between items-center text-xs font-semibold text-zinc-400 mb-1.5">
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
            </svg>
            <span>{completedTasks}/{totalTasks} Tasks</span>
          </div>
          <span className="text-zinc-200">{progressPercent}%</span>
        </div>
        <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-950">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

export default ProjectCard;
