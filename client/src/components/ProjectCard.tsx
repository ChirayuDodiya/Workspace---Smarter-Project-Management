import { Link } from 'react-router-dom';
import api from '../services/api';
import type { Project } from '../types';

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
      className="p-6 bg-[#1e1e1e] border border-[#333] hover:border-emerald-500/50 rounded-2xl transition-all duration-200 select-none flex flex-col justify-between h-40 group cursor-pointer text-left"
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
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-950/40 border border-red-500/50 hover:bg-red-900/60 hover:border-red-400 text-red-200 transition-colors cursor-pointer select-none focus:outline-none"
          >
            del
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
