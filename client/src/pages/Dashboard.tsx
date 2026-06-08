import { useState, useEffect } from 'react';
import Stats from '../components/Stats';
import ProjectCard from '../components/ProjectCard';
import AddProjectModal from '../components/AddProjectModal';
import api from '../services/api';
import type { Project } from '../types';

export function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch projects from backend whenever page, search query, status filter, or refreshKey changes
  useEffect(() => {
    let active = true;
    const fetchProjects = async () => {
      try {
        const params: Record<string, string | number> = {
          page,
          per_page: 20,
        };

        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }

        if (searchQuery) {
          params.search = searchQuery;
        }

        const response = await api.get('/projects', { params });
        if (active) {
          if (response.data && response.data.success) {
            const fetched = response.data.data;
            const meta = response.data.pagination;

            setProjects((prev) => {
              if (page === 1) return fetched;
              const prevIds = new Set(prev.map((p) => p.id));
              const uniqueNew = fetched.filter((p: Project) => !prevIds.has(p.id));
              return [...prev, ...uniqueNew];
            });

            if (meta) {
              setHasMore(meta.page < meta.total_pages);
            } else {
              setHasMore(false);
            }
          }
        }
      } catch {
        // ignore error
      }
    };

    void fetchProjects();
    return () => {
      active = false;
    };
  }, [page, searchQuery, statusFilter, refreshKey]);

  return (
    <main className="p-8 text-white min-h-full bg-[#121212] select-none">
      <div className="max-w-7xl mx-auto space-y-8 text-left">
        {/* Stats Component */}
        <div>
          <Stats key={refreshKey} />
        </div>

        {/* Projects Section */}
        <div className="space-y-6 pt-4">
          <div className="flex justify-between items-center w-full">
            <div className="flex gap-2 items-center">
              <h2 className="text-2xl font-bold tracking-wide">Projects:</h2>

              {/* Quick Filters */}
              <div className="flex gap-4 items-center">
                {/* Search Input */}
                <div className="relative w-180 px-4">
                  <input
                    type="text"
                    placeholder="search project"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                      setProjects([]);
                    }}
                    className="w-full h-10 px-4 bg-[#1e1e1e] border border-[#333] hover:border-zinc-700 focus:border-emerald-500/50 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none transition-colors"
                  />
                </div>

                {/* Status Dropdown */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                      setProjects([]);
                    }}
                    className="h-10 pl-4 pr-8 bg-[#1e1e1e] border border-[#333] hover:border-zinc-700 focus:border-emerald-500/50 rounded-lg text-gray-300 text-sm focus:outline-none transition-colors cursor-pointer appearance-none select-none font-semibold"
                  >
                    <option value="all">status: all</option>
                    <option value="planning">planning</option>
                    <option value="active">active</option>
                    <option value="on_hold">on_hold</option>
                    <option value="completed">completed</option>
                    <option value="archived">archived</option>
                  </select>
                  {/* Arrow Indicator */}
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Project Button */}
            <button
              type="button"
              onClick={() => setIsAddProjectModalOpen(true)}
              className="h-10 px-6 bg-[#043314] border border-white hover:bg-[#074c1f] rounded-xl text-white text-base font-semibold tracking-wide transition-colors duration-200 cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-[#098032]"
            >
              Add Project
            </button>
          </div>

          {/* Projects Listing */}
          {projects.length === 0 ? (
            <div className="text-gray-500 text-sm italic">No projects found.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6 mt-4">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>

              {/* Pagination See More Button */}
              {hasMore && (
                <div className="flex justify-center pt-8 pb-12">
                  <button
                    onClick={() => setPage((prev) => prev + 1)}
                    className="px-8 py-2.5 bg-[#1e1e1e] hover:bg-[#2d2d2d] border border-[#333] hover:border-emerald-500/50 text-white rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer shadow-md hover:shadow-emerald-500/10 focus:outline-none"
                  >
                    See More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
        onProjectCreated={() => {
          setPage(1);
          setProjects([]);
          setRefreshKey((prev) => prev + 1);
        }}
      />
    </main>
  );
}

export default Dashboard;
