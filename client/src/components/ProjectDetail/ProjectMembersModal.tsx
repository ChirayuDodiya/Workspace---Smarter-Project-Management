import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import type { User } from '../../types';

interface ProjectMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  onMembersChanged?: () => void;
}

function MemberRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-2.5 px-4 bg-[#252525]/30 border border-[#333]/20 rounded-2xl animate-pulse">
      <div className="flex flex-col justify-center min-w-0 pr-4 space-y-2 flex-1">
        <div className="h-4 bg-[#2d2d2d] rounded-md w-1/3" />
        <div className="h-3 bg-[#202020] rounded-md w-1/2" />
      </div>
      <div className="w-8 h-8 bg-[#2d2d2d] rounded-lg border border-zinc-800" />
    </div>
  );
}

export const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({
  isOpen,
  onClose,
  slug,
  onMembersChanged,
}) => {
  const [members, setMembers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch project team members on mount
  useEffect(() => {
    let active = true;
    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await api.get(`/projects/${slug}/team-members`);
        if (active && response.data && response.data.success) {
          setMembers(response.data.data);
        }
      } catch (err: unknown) {
        if (active) {
          const axiosError = err as { response?: { data?: { message?: string } } };
          setError(axiosError.response?.data?.message || 'Failed to fetch team members.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void fetchMembers();
    return () => {
      active = false;
    };
  }, [slug]);

  // Debounce search query to optimize API requests
  useEffect(() => {
    if (searchQuery === debouncedSearchQuery) {
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      if (!searchQuery.trim()) {
        setSearchResults([]);
      } else {
        setIsLoading(true);
      }
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, debouncedSearchQuery]);

  // Handle live global user search when query is typed (debounced)
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      return;
    }

    let active = true;
    const searchUsers = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await api.get('/users', {
          params: { search: debouncedSearchQuery, active_only: 'true' },
        });
        if (active && response.data && response.data.success) {
          setSearchResults(response.data.data);
        }
      } catch (err: unknown) {
        if (active) {
          const axiosError = err as { response?: { data?: { message?: string } } };
          setError(axiosError.response?.data?.message || 'Failed to search users.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void searchUsers();
    return () => {
      active = false;
    };
  }, [debouncedSearchQuery]);

  const handleAddMember = async (userId: number) => {
    try {
      setError('');
      const response = await api.post(`/projects/${slug}/team-members`, { user_id: userId });
      if (response.data && response.data.success) {
        const newUser = response.data.data;
        setMembers((prev) => [...prev, newUser]);
        if (onMembersChanged) onMembersChanged();
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to add project member.');
    }
  };

  const handleRemoveMember = async (userId: number) => {
    try {
      setError('');
      const response = await api.delete(`/projects/${slug}/team-members/${userId}`);
      if (response.data && response.data.success) {
        setMembers((prev) => prev.filter((m) => m.id !== userId));
        if (onMembersChanged) onMembersChanged();
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to remove project member.');
    }
  };

  if (!isOpen) return null;

  const displayList = debouncedSearchQuery.trim() ? searchResults : members;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#181818] border border-zinc-800/80 rounded-2xl w-full max-w-md shadow-2xl text-white overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80">
          <h2 className="text-base font-bold tracking-wide">Project Members</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer focus:outline-none"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Error Banner */}
          {error && (
            <div className="text-red-300 text-sm font-medium bg-red-950/30 border border-red-500/40 rounded-xl py-2 px-4">
              {error}
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (!val.trim()) {
                  setSearchResults([]);
                }
                if (error) setError('');
              }}
              placeholder="Search by name or email to add members…"
              className="w-full h-10 pl-9 pr-4 bg-[#121212] border border-zinc-800 hover:border-zinc-700 focus:border-[#098032] focus:ring-1 focus:ring-[#098032]/20 focus:outline-none rounded-xl text-white placeholder-zinc-600 text-sm transition-all"
            />
          </div>

          {/* Member List */}
          <div className="space-y-1 max-h-80 overflow-y-auto pr-0.5">
            {displayList.length === 0 && !isLoading ? (
              <div className="text-center text-zinc-600 py-10 text-sm italic">
                {debouncedSearchQuery.trim()
                  ? 'No users found matching your search'
                  : 'No members in this project yet'}
              </div>
            ) : (
              <>
                {displayList.map((u) => {
                  const isAlreadyMember = members.some((m) => m.id === u.id);
                  const initials = u.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();
                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between py-2.5 px-3 hover:bg-zinc-800/50 rounded-xl transition-colors duration-150"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                          {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-white font-semibold text-sm truncate">{u.name}</span>
                          <span className="text-zinc-500 text-xs truncate">{u.email}</span>
                        </div>
                      </div>

                      <div className="shrink-0 ml-3">
                        {isAlreadyMember ? (
                          <button
                            onClick={() => handleRemoveMember(u.id)}
                            className="w-8 h-8 flex items-center justify-center bg-red-950/40 hover:bg-red-950/70 border border-red-500/40 rounded-lg text-red-400 hover:text-red-300 cursor-pointer transition-all"
                            title="Remove Member"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddMember(u.id)}
                            className="w-8 h-8 flex items-center justify-center bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/40 rounded-lg text-emerald-400 hover:text-emerald-300 cursor-pointer transition-all"
                            title="Add Member"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="space-y-2 mt-2">
                    <MemberRowSkeleton />
                    <MemberRowSkeleton />
                    <MemberRowSkeleton />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectMembersModal;
