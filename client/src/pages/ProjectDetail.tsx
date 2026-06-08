import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { Project } from '../types';
import ProjectDetailsCard from '../components/ProjectDetailsCard';
import KanbanBoard from '../components/KanbanBoard';
import AddTaskModal from '../components/AddTaskModal';

export function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [boardKey, setBoardKey] = useState(0);

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
        <div className="flex items-start gap-6">
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

          {/* Add Task Button */}
          <button
            type="button"
            onClick={() => setIsAddTaskModalOpen(true)}
            className="self-end h-10 px-6 bg-[#043314] border border-white hover:bg-[#074c1f] rounded-xl text-white text-xl font-medium tracking-wide transition-colors duration-200 cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-[#098032]"
          >
            Add Task
          </button>
        </div>

        {/* Kanban Board */}
        {slug && <KanbanBoard key={boardKey} slug={slug} />}

        {/* Add Task Modal */}
        {slug && (
          <AddTaskModal
            isOpen={isAddTaskModalOpen}
            onClose={() => setIsAddTaskModalOpen(false)}
            onTaskCreated={() => setBoardKey((prev) => prev + 1)}
            slug={slug}
          />
        )}
      </div>
    </main>
  );
}

export default ProjectDetail;
