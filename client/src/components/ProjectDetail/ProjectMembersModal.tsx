import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import type { User } from '../../types';

interface ProjectMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  onMembersChanged?: () => void;
}

export const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({
  isOpen,
  onClose,
  slug,
  onMembersChanged,
}) => {
  const [members, setMembers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [error, setError] = useState('');

  // Fetch project team members on mount
  useEffect(() => {
    let active = true;
    const fetchMembers = async () => {
      try {
        const response = await api.get(`/projects/${slug}/team-members`);
        if (active && response.data && response.data.success) {
          setMembers(response.data.data);
        }
      } catch (err: unknown) {
        if (active) {
          const axiosError = err as { response?: { data?: { message?: string } } };
          setError(axiosError.response?.data?.message || 'Failed to fetch team members.');
        }
      }
    };

    void fetchMembers();
    return () => {
      active = false;
    };
  }, [slug]);

  // Handle live global user search when query is typed
  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    let active = true;
    const searchUsers = async () => {
      try {
        const response = await api.get('/users', {
          params: { search: searchQuery, active_only: 'true' },
        });
        if (active && response.data && response.data.success) {
          setSearchResults(response.data.data);
        }
      } catch (err: unknown) {
        if (active) {
          const axiosError = err as { response?: { data?: { message?: string } } };
          setError(axiosError.response?.data?.message || 'Failed to search users.');
        }
      }
    };

    void searchUsers();
    return () => {
      active = false;
    };
  }, [searchQuery]);

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

  const displayList = searchQuery.trim() ? searchResults : members;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1e1e1e] border border-[#333] rounded-3xl w-full max-w-lg p-6 text-white space-y-6 relative shadow-2xl">
        {/* Title */}
        <div className="flex items-center justify-between pr-6">
          <h2 className="text-xl font-bold tracking-wide">Project Members</h2>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer transition-colors p-1"
          title="Close Modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Warning Error Banner */}
        {error && (
          <div className="text-red-400 text-sm font-bold bg-red-950/30 border border-red-500/40 rounded-xl py-2 px-4">
            {error}
          </div>
        )}

        {/* Search Input matching wireframe green theme */}
        <div className="flex items-center gap-3">
          <span className="text-[#10b981] font-semibold text-lg">Search:</span>
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
            placeholder="search members by name or email"
            className="w-full h-10 px-4 bg-[#121212] border border-[#10b981] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none transition-all"
          />
        </div>

        {/* List of Members */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {displayList.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm">
              {searchQuery.trim()
                ? 'No users found matching query'
                : 'No members currently in project'}
            </div>
          ) : (
            displayList.map((u) => {
              const isAlreadyMember = members.some((m) => m.id === u.id);
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between py-2.5 px-4 hover:bg-[#252525] rounded-2xl transition-colors duration-150"
                >
                  <div className="flex flex-col justify-center min-w-0 pr-4">
                    <span className="text-white font-semibold text-sm truncate">{u.name}</span>
                    <span className="text-gray-500 text-xs truncate mt-0.5">{u.email}</span>
                  </div>

                  <div>
                    {isAlreadyMember ? (
                      /* Red Minus Icon to Remove */
                      <button
                        onClick={() => handleRemoveMember(u.id)}
                        className="p-1.5 bg-[#4c1c1c] hover:bg-[#682525] border border-red-500/50 rounded-lg text-red-400 cursor-pointer transition-colors"
                        title="Remove Member"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="2.5"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                        </svg>
                      </button>
                    ) : (
                      /* Green Plus Icon to Add */
                      <button
                        onClick={() => handleAddMember(u.id)}
                        className="p-1.5 bg-[#043314] hover:bg-[#074c1f] border border-[#10b981]/50 rounded-lg text-emerald-400 cursor-pointer transition-colors"
                        title="Add Member"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="2.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectMembersModal;
