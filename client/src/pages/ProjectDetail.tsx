import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { Project, User } from '../types';
import ProjectDetailsCard from '../components/ProjectDetail/ProjectDetailsCard';
import ProjectStats from '../components/ProjectDetail/ProjectStats';
import KanbanBoard from '../components/ProjectDetail/KanbanBoard';
import AddTaskModal from '../components/ProjectDetail/AddTaskModal';
import ProjectMembersModal from '../components/ProjectDetail/ProjectMembersModal';

import { socket } from '../services/socket';
import { useAuth } from '../hooks/useAuth';
import ProjectDetailsCardSkeleton from '../components/ProjectDetail/ProjectDetailsCardSkeleton';
import ProjectStatsSkeleton from '../components/ProjectDetail/ProjectStatsSkeleton';
import TaskCardSkeleton from '../components/ProjectDetail/TaskCardSkeleton';

export function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const { user } = useAuth();
  const [viewers, setViewers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch project details
  useEffect(() => {
    let active = true;
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await api.get(`/projects/${slug}`);
        if (active && response.data && response.data.success) {
          setProject(response.data.data.project);
        }
      } catch (err: unknown) {
        if (active) {
          const axiosError = err as { response?: { data?: { message?: string } } };
          setError(axiosError.response?.data?.message || 'Failed to fetch project details');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };
    if (slug) {
      void fetchProject();
    }
    return () => {
      active = false;
    };
  }, [slug, refreshKey]);

  // Join/leave project socket room on mount/unmount and track presence
  useEffect(() => {
    if (slug && user) {
      socket.emit('join:project', { projectSlug: slug, user });

      const handlePresence = (members: User[]) => {
        setViewers(members);
      };

      socket.on('project:presence', handlePresence);

      return () => {
        socket.off('project:presence', handlePresence);
        socket.emit('leave:project');
      };
    }
  }, [slug, user]);

  const handleProjectUpdated = (updatedProject: Project) => {
    setProject(updatedProject);
    if (updatedProject.slug !== slug) {
      navigate(`/projects/${updatedProject.slug}`, { replace: true });
    }
  };

  if (error) {
    return (
      <main className="p-8 text-white min-h-full bg-[#121212] select-none flex flex-col items-center justify-center text-center">
        <div className="max-w-md space-y-6">
          <div className="text-red-400 text-sm font-bold bg-red-950/30 border border-red-500/40 rounded-2xl py-4 px-6 shadow-md">
            {error}
          </div>
          <div className="flex gap-4 justify-center">
            <Link
              to="/"
              className="px-6 py-2.5 bg-[#1e1e1e] hover:bg-[#2d2d2d] border border-[#333] hover:border-zinc-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-md focus:outline-none"
            >
              Back to Dashboard
            </Link>
            <button
              onClick={() => setRefreshKey((prev) => prev + 1)}
              className="px-6 py-2.5 bg-[#043314] hover:bg-[#074c1f] border border-white/60 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-[#098032]"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading || !project) {
    return (
      <main className="p-4 sm:p-8 text-white min-h-full bg-[#121212] select-none">
        <div className="mx-auto space-y-6 sm:space-y-8 text-left">
          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 w-full">
            <div className="flex flex-col xl:flex-row items-start gap-6 w-full xl:w-auto">
              {/* Back button skeleton */}
              <div className="w-10 h-9 bg-zinc-800/60 border border-zinc-800 rounded-xl animate-pulse" />

              <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
                {/* Project Details Card Skeleton */}
                <ProjectDetailsCardSkeleton />

                {/* Project Statistics Skeleton */}
                <ProjectStatsSkeleton />
              </div>
            </div>
          </div>

          {/* Kanban Board Skeleton */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              {/* Search input placeholder */}
              <div className="w-full max-w-md h-11 bg-[#1a1a1a] border border-[#333] rounded-xl animate-pulse" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border border-zinc-800/60 rounded-2xl">
              {['todo', 'in_progress', 'in_review', 'done'].map((status) => (
                <div
                  key={status}
                  className="flex flex-col bg-[#121212] border border-white/20 rounded-3xl p-3 min-h-125 animate-pulse"
                >
                  <div className="h-9 bg-[#043314]/30 border border-white/20 rounded-2xl flex items-center justify-center text-zinc-500 font-semibold capitalize">
                    {status}
                  </div>
                  <div className="flex-1 flex flex-col gap-4 mt-4">
                    <TaskCardSkeleton />
                    <TaskCardSkeleton />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-8 text-white min-h-full bg-[#121212] select-none">
      <div className="mx-auto space-y-5 sm:space-y-6 text-left">

        {/* Top Bar: Back | Viewers | (spacer) | Action Buttons */}
        <div className="flex items-center gap-3 w-full">
          {/* Back button */}
          <Link
            to="/"
            className="flex items-center justify-center w-9 h-9 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white text-base font-medium transition-all duration-150 cursor-pointer shadow-sm focus:outline-none shrink-0"
            title="Back to Dashboard"
          >
            ←
          </Link>

          {/* Active Viewers presence badge */}
          {viewers.length > 0 && (
            <div className="h-9 flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/80 px-3 rounded-xl select-none shadow-sm">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Viewing
              </span>
              <span className="text-xs font-semibold text-emerald-400 truncate max-w-48">
                {viewers.map((v) => v.name).join(', ')}
              </span>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />
        </div>

        {/* Project Info Row: Details Card + Stats Card */}
        <div className="flex flex-col sm:flex-row gap-4">
          <ProjectDetailsCard project={project} onProjectUpdated={handleProjectUpdated} />
          {slug && <ProjectStats slug={slug} />}
        </div>

        {/* Kanban Board */}
        {slug && (
          <KanbanBoard
            slug={slug}
            onAddTask={() => setIsAddTaskModalOpen(true)}
            onMembers={() => setIsMembersModalOpen(true)}
          />
        )}

        {/* Add Task Modal */}
        {slug && (
          <AddTaskModal
            isOpen={isAddTaskModalOpen}
            onClose={() => setIsAddTaskModalOpen(false)}
            slug={slug}
          />
        )}

        {/* Project Members Modal */}
        {slug && (
          <ProjectMembersModal
            isOpen={isMembersModalOpen}
            onClose={() => setIsMembersModalOpen(false)}
            slug={slug}
          />
        )}
      </div>
    </main>
  );
}

export default ProjectDetail;
