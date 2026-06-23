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

  return (
    <Link
      to={`/projects/${project.slug}`}
      className="p-6 bg-[#1e1e1e] border border-[#333] hover:border-emerald-500/50 rounded-2xl transition-all duration-200 select-none flex flex-col justify-between min-h-40 h-auto sm:h-40 group cursor-pointer text-left"
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex gap-2">
            <div className="text-emerald-500 group-hover:text-emerald-400 transition-colors">
              Name:
            </div>
            <div className="text-white">{project.name}</div>
          </div>

          <div className="flex gap-2">
            <div className="text-emerald-500 group-hover:text-emerald-400 transition-colors">
              Slug:
            </div>
            <div className="text-white">{project.slug}</div>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 text-xs font-semibold rounded-lg bg-[#3a1515] border border-red-500/35 hover:bg-[#541e1e] hover:border-red-400 text-red-400 transition-colors cursor-pointer select-none focus:outline-none flex items-center justify-center"
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
          <span
            className={`px-3 py-1 text-md font-semibold rounded-full capitalize bg-[#2d2d2d] text-zinc-300 border border-zinc-700/60`}
          >
            {project.status}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center text-emerald-500 text-md font-semibold mb-1.5">
          <span>Progress Bar:</span>
          <span className="text-white">{progressPercent}%</span>
        </div>
        <div className="w-full bg-[#2d2d2d] h-2.5 rounded-full overflow-hidden border border-zinc-800">
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
