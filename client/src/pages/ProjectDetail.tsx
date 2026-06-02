import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import type { Project } from '../types';
import ProjectDetailsCard from '../components/ProjectDetailsCard';
import KanbanBoard from '../components/KanbanBoard';

export function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);

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
          <ProjectDetailsCard project={project} />

          {/* Add Task Button */}
          <button
            type="button"
            className="self-end h-10 px-6 bg-[#043314] border border-white hover:bg-[#074c1f] rounded-xl text-white text-xl font-medium tracking-wide transition-colors duration-200 cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-[#098032]"
          >
            Add Task
          </button>
        </div>

        {/* Kanban Board */}
        {slug && <KanbanBoard slug={slug} />}
      </div>
    </main>
  );
}

export default ProjectDetail;
