import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import type { Project, ProjectTask } from '../types';
import ProjectDetailsCard from '../components/ProjectDetailsCard';
import TaskCard from '../components/TaskCard';

export function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);

  // Tasks state per column status
  const [tasksByStatus, setTasksByStatus] = useState<Record<string, ProjectTask[]>>({
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
  });

  const [pagesByStatus, setPagesByStatus] = useState<Record<string, number>>({
    todo: 1,
    in_progress: 1,
    in_review: 1,
    done: 1,
  });

  const [hasMoreByStatus, setHasMoreByStatus] = useState<Record<string, boolean>>({
    todo: false,
    in_progress: false,
    in_review: false,
    done: false,
  });

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

  // Fetch tasks for a specific column status
  const fetchTasksForStatus = async (status: string, page: number) => {
    try {
      const response = await api.get(`/projects/${slug}/tasks`, {
        params: {
          status,
          page,
          per_page: 10,
        },
      });

      if (response.data && response.data.success) {
        const fetched = response.data.data;
        const meta = response.data.pagination;

        setTasksByStatus((prev) => {
          const currentList = prev[status] || [];
          if (page === 1) {
            return { ...prev, [status]: fetched };
          }
          const existingIds = new Set(currentList.map((t) => t.id));
          const uniqueNew = fetched.filter((t: ProjectTask) => !existingIds.has(t.id));
          return { ...prev, [status]: [...currentList, ...uniqueNew] };
        });

        if (meta) {
          setHasMoreByStatus((prev) => ({
            ...prev,
            [status]: meta.page < meta.total_pages,
          }));
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (slug) {
      const timer = setTimeout(() => {
        void fetchTasksForStatus('todo', 1);
        void fetchTasksForStatus('in_progress', 1);
        void fetchTasksForStatus('in_review', 1);
        void fetchTasksForStatus('done', 1);
      }, 0);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleSeeMore = (status: string) => {
    const nextPage = (pagesByStatus[status] || 1) + 1;
    setPagesByStatus((prev) => ({ ...prev, [status]: nextPage }));
    void fetchTasksForStatus(status, nextPage);
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
          <ProjectDetailsCard project={project} />

          {/* Add Task Button */}

          <button
            type="button"
            className="self-end h-10 px-6 bg-[#043314] border border-white hover:bg-[#074c1f] rounded-xl text-white text-xl font-medium tracking-wide transition-colors duration-200 cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-[#098032]"
          >
            Add Task
          </button>
        </div>

        {/* Kanban Board Columns */}
        <div className="grid grid-cols-4 gap-6 pt-4 border border-white rounded-2xl">
          {[
            { id: 'todo', label: 'todo' },
            { id: 'in_progress', label: 'in_progress' },
            { id: 'in_review', label: 'in_review' },
            { id: 'done', label: 'done' },
          ].map((col) => {
            const tasks = tasksByStatus[col.id] || [];
            return (
              <div
                key={col.id}
                className="flex flex-col bg-[#121212] border border-white rounded-3xl p-3 min-h-125"
              >
                {/* Column Header */}
                <div className="flex items-center justify-center py-2 bg-[#043314] border border-white rounded-2xl text-white text-lg font-medium tracking-wide">
                  {col.label}
                </div>

                {/* Task Cards List */}
                <div className="flex-1 flex flex-col gap-4 mt-4 overflow-y-auto pr-1">
                  {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {tasks.length === 0 && (
                    <div className="flex-1 flex flex-col justify-center items-center text-gray-500 border border-dashed border-[#2d2d2d] rounded-2xl p-4">
                      <span className="text-sm font-semibold italic">No Tasks</span>
                    </div>
                  )}
                </div>

                {/* See More Footer Link */}
                {hasMoreByStatus[col.id] && (
                  <button
                    type="button"
                    onClick={() => handleSeeMore(col.id)}
                    className="mt-4 py-1.5 text-emerald-400 hover:text-emerald-300 font-semibold text-sm text-center hover:underline cursor-pointer focus:outline-none border-t border-[#333]/40"
                  >
                    See More
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default ProjectDetail;
