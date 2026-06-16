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

export function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const { user } = useAuth();
  const [viewers, setViewers] = useState<User[]>([]);

  // Fetch project details
  useEffect(() => {
    let active = true;
    const fetchProject = async () => {
      try {
        const response = await api.get(`/projects/${slug}`);
        if (active && response.data && response.data.success) {
          setProject(response.data.data.project);
        }
      } catch {
        // ignore error
      }
    };
    if (slug) {
      void fetchProject();
    }
    return () => {
      active = false;
    };
  }, [slug]);

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

  if (!project) {
    return null;
  }

  return (
    <main className="p-2 text-white min-h-full bg-[#121212] select-none">
      <div className=" mx-auto space-y-8 text-left">
        <div className="flex flex-wrap items-start gap-6">
          {/* Back button */}
          <Link
            to="/"
            className="flex items-center justify-center w-12 h-10 bg-[#043314] border border-white hover:bg-[#074c1f] rounded-xl text-white text-xl font-medium tracking-wide transition-colors duration-200 cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-[#098032]"
            title="Back to Dashboard"
          >
            &lt;-
          </Link>

          {/* Project Details Card */}
          <ProjectDetailsCard project={project} onProjectUpdated={handleProjectUpdated} />

          {/* Project Statistics */}
          {slug && <ProjectStats slug={slug} />}

          {/* Active Viewers presence */}

          {viewers.length > 0 && (
            <div className="self-end h-10 flex items-center gap-2 mr-4 bg-[#1a1a1e]/60 border border-neutral-800/80 px-4 rounded-full select-none shadow-sm">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Viewing:
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                {viewers.map((v) => v.name).join(', ')}
              </span>
            </div>
          )}

          {/* Add Task Button */}
          <button
            type="button"
            onClick={() => setIsAddTaskModalOpen(true)}
            className="self-end h-10 px-6 bg-[#043314] border border-white hover:bg-[#074c1f] rounded-xl text-white text-xl font-medium tracking-wide transition-colors duration-200 cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-[#098032]"
          >
            Add Task
          </button>

          {/* Member List Button */}
          <button
            type="button"
            onClick={() => setIsMembersModalOpen(true)}
            className="self-end h-10 px-6 bg-[#1e1e1e] border border-white hover:bg-[#2d2d2d] rounded-xl text-white text-xl font-medium tracking-wide transition-colors duration-200 cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-[#333]"
          >
            member list
          </button>
        </div>

        {/* Kanban Board */}
        {slug && <KanbanBoard slug={slug} />}

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
