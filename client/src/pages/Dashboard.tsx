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
              <h2 className="text-2xl font-bold tracking-tight">Projects</h2>

              {/* Quick Filters */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
                {/* Search Input */}
                <div className="relative w-full sm:w-64 md:w-80">
                  <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-zinc-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search projects"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (error) setError('');
                    }}
                    className="w-full h-10 pl-10 pr-4 bg-[#181818] border border-zinc-800 hover:border-zinc-750 focus:border-[#098032] focus:ring-1 focus:ring-[#098032]/30 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none transition-all"
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
                    className="w-full sm:w-auto h-10 pl-4 pr-10 bg-[#181818] border border-zinc-800 hover:border-zinc-750 focus:border-[#098032] focus:ring-1 focus:ring-[#098032]/30 rounded-xl text-zinc-300 text-sm focus:outline-none transition-all cursor-pointer appearance-none select-none font-semibold"
                  >
                    <option value="all">Status: all</option>
                    <option value="planning">planning</option>
                    <option value="active">active</option>
                    <option value="on_hold">on_hold</option>
                    <option value="completed">completed</option>
                    <option value="archived">archived</option>
                  </select>
                  {/* Arrow Indicator */}
                  <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-zinc-500">
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
              className="h-10 w-full sm:w-auto px-5 bg-[#045c22] hover:bg-[#074c1f] rounded-xl text-white text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer shadow-md hover:shadow-[0_4px_12px_rgba(4,92,34,0.2)] focus:outline-none focus:ring-2 focus:ring-[#098032] focus:ring-offset-2 focus:ring-offset-[#121212] border border-transparent"
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
            <div className="text-zinc-500 text-sm italic py-8">No projects found.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5">
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
                    className="px-8 py-2.5 bg-[#181818] hover:bg-[#202020] border border-zinc-800 hover:border-zinc-700/80 text-white rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer shadow-md hover:shadow-emerald-500/10 focus:outline-none"
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
