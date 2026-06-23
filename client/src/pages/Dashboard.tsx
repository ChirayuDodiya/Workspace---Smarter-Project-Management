import { useState, useEffect } from 'react';
import Stats from '../components/Dashboard/Stats';
import ProjectCard from '../components/Dashboard/ProjectCard';
import ProjectCardSkeleton from '../components/Dashboard/ProjectCardSkeleton';
import AddProjectModal from '../components/Dashboard/AddProjectModal';
import api from '../services/api';
import type { Project } from '../types';

export function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Debounce search query to optimize API requests
  useEffect(() => {
    if (searchQuery === debouncedSearchQuery) {
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
      setProjects([]);
      setIsLoading(true);
      setError('');
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, debouncedSearchQuery]);

  // Fetch projects from backend whenever page, status filter, refreshKey, or debounced search query changes
  useEffect(() => {
    let active = true;
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setError('');
        const params: Record<string, string | number> = {
          page,
          per_page: 20,
        };

        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }

        if (debouncedSearchQuery) {
          params.search = debouncedSearchQuery;
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
      } catch (err: unknown) {
        if (active) {
          const axiosError = err as { response?: { data?: { message?: string } } };
          setError(axiosError.response?.data?.message || 'Failed to fetch projects');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void fetchProjects();
    return () => {
      active = false;
    };
  }, [page, debouncedSearchQuery, statusFilter, refreshKey]);

  return (
    <main className="p-4 sm:p-8 text-white min-h-full bg-[#121212] select-none">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 text-left">
        {/* Stats Component */}
        <div>
          <Stats key={refreshKey} />
        </div>

        {/* Projects Section */}
        <div className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <h2 className="text-2xl font-bold tracking-wide">Projects:</h2>

              {/* Quick Filters */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
                {/* Search Input */}
                <div className="relative w-full sm:w-64 md:w-80">
                  <input
                    type="text"
                    placeholder="search project"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (error) setError('');
                    }}
                    className="w-full h-10 px-4 bg-[#1e1e1e] border border-[#333] hover:border-zinc-700 focus:border-emerald-500/50 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none transition-colors"
                  />
                </div>

                {/* Status Dropdown */}
                <div className="relative w-full sm:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                      setProjects([]);
                      if (error) setError('');
                    }}
                    className="w-full sm:w-auto h-10 pl-4 pr-8 bg-[#1e1e1e] border border-[#333] hover:border-zinc-700 focus:border-emerald-500/50 rounded-lg text-gray-300 text-sm focus:outline-none transition-colors cursor-pointer appearance-none select-none font-semibold"
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
              className="h-10 w-full sm:w-auto px-6 bg-[#043314] border border-white hover:bg-[#074c1f] rounded-xl text-white text-base font-semibold tracking-wide transition-colors duration-200 cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-[#098032]"
            >
              Add Project
            </button>
          </div>

          {/* Warning/Error Message inside section */}
          {error && (
            <div className="text-red-400 text-sm font-bold bg-red-950/30 border border-red-500/40 rounded-xl py-2.5 px-4 mt-4 mb-2">
              {error}
            </div>
          )}

          {/* Projects Listing */}
          {projects.length === 0 && !isLoading ? (
            <div className="text-gray-500 text-sm italic">No projects found.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onDeleteSuccess={() => {
                      setPage(1);
                      setProjects([]);
                      setRefreshKey((prev) => prev + 1);
                    }}
                  />
                ))}
                {isLoading && (
                  <>
                    <ProjectCardSkeleton />
                    <ProjectCardSkeleton />
                    <ProjectCardSkeleton />
                    <ProjectCardSkeleton />
                  </>
                )}
              </div>

              {/* Pagination See More Button */}
              {hasMore && !isLoading && (
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
