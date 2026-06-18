import { useState, useEffect } from 'react';
import api from '../services/api';
import type { User } from '../types';
import { useAuth } from '../hooks/useAuth';
import UserRowSkeleton from '../components/ChangeRole/UserRowSkeleton';

export function ChangeRole() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Debounce search query to optimize API requests
  useEffect(() => {
    if (searchQuery === debouncedSearchQuery) {
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
      setUsers([]);
      setIsLoading(true);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, debouncedSearchQuery]);

  // Fetch users list whenever search query or page changes
  useEffect(() => {
    let active = true;
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await api.get('/users', {
          params: { search: debouncedSearchQuery, page, per_page: 20 },
        });
        if (active && response.data && response.data.success) {
          const fetched = response.data.data;
          const meta = response.data.pagination;

          setUsers((prev) => {
            if (page === 1) return fetched;
            const prevIds = new Set(prev.map((u) => u.id));
            const uniqueNew = fetched.filter((u: User) => !prevIds.has(u.id));
            return [...prev, ...uniqueNew];
          });

          if (meta) {
            setHasMore(meta.page < meta.total_pages);
          } else {
            setHasMore(false);
          }
        }
      } catch (err: unknown) {
        if (active) {
          const axiosError = err as { response?: { data?: { message?: string } } };
          setError(axiosError.response?.data?.message || 'Failed to fetch users');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void fetchUsers();
    return () => {
      active = false;
    };
  }, [debouncedSearchQuery, page]);

  const handleRoleChange = async (userId: number, newRole: 'admin' | 'manager' | 'developer') => {
    try {
      setError('');
      const response = await api.put(`/users/${userId}/role`, { role: newRole });
      if (response.data && response.data.success) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError.response?.data?.message || 'Failed to update user role';
      setError(msg);
    }
  };

  const handleSoftDeleteUser = async (userId: number) => {
    try {
      setError('');
      const response = await api.delete(`/users/${userId}`);
      if (response.data && response.data.success) {
        setUsers(
          users.map((u) =>
            u.id === userId ? { ...u, is_active: false, deleted_at: new Date().toISOString() } : u
          )
        );
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError.response?.data?.message || 'Failed to deactivate user.';
      setError(msg);
    }
  };

  const handleRestoreUser = async (userId: number) => {
    try {
      setError('');
      const response = await api.post(`/users/${userId}/restore`);
      if (response.data && response.data.success) {
        setUsers(
          users.map((u) => (u.id === userId ? { ...u, is_active: true, deleted_at: null } : u))
        );
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError.response?.data?.message || 'Failed to restore user.';
      setError(msg);
    }
  };

  const handleToggleActiveState = async (userId: number) => {
    try {
      setError('');
      const response = await api.put(`/users/${userId}/toggle-active`);
      if (response.data && response.data.success) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, is_active: !u.is_active } : u)));
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError.response?.data?.message || 'Failed to toggle user active state.';
      setError(msg);
    }
  };

  return (
    <main className="p-8 text-white min-h-full bg-[#121212] select-none">
      <div className="max-w-3xl mx-auto space-y-8 text-left">
        <h1 className="text-3xl font-bold tracking-wide text-white">change user role</h1>

        {/* Warning/Error Message inside page */}
        {error && (
          <div className="text-red-400 text-sm font-bold bg-red-950/30 border border-red-500/40 rounded-xl py-2.5 px-4">
            {error}
          </div>
        )}

        {/* Search Input bar */}
        <div className="flex items-center gap-3">
          <span className="text-[#10b981] font-semibold text-lg">Search:</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (error) setError('');
            }}
            placeholder="search users by name or email"
            className="w-full max-w-xl h-10 px-4 bg-[#121212] border border-[#10b981] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none transition-all"
          />
        </div>

        {/* Members and Roles Grid */}
        <div className="space-y-4 pt-4">
          {/* Headers matching mockup style */}
          <div className="flex items-center gap-6 pr-30">
            <div className="flex-1 text-center py-2 px-6 border border-white rounded-full text-white text-base font-semibold">
              Member name
            </div>
            <div className="w-48 text-center py-2 px-6 border border-white rounded-full text-white text-base font-semibold">
              role
            </div>
          </div>

          {/* User rows */}
          <div className="space-y-2">
            {users.length === 0 && !isLoading ? (
              <div className="text-center text-gray-500 py-8">No users found</div>
            ) : (
              <>
                {users.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      className={`flex items-center gap-6 py-3 px-6 hover:bg-[#1a1a1a] rounded-2xl transition-all duration-150 ${
                        u.deleted_at ? 'opacity-40 bg-red-950/5' : !u.is_active ? 'opacity-60' : ''
                      }`}
                    >
                      {/* User profile */}
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <span className="text-white font-semibold text-base truncate">
                          {u.name}
                        </span>
                        <span className="text-gray-500 text-xs truncate mt-0.5">{u.email}</span>
                      </div>

                      {/* Role select */}
                      <div className="w-48 flex justify-center">
                        <select
                          value={u.role}
                          disabled={isSelf}
                          onChange={(e) =>
                            handleRoleChange(
                              u.id,
                              e.target.value as 'admin' | 'manager' | 'developer'
                            )
                          }
                          className={`w-full bg-[#1e1e1e] border border-[#333] text-white rounded-xl px-4 py-2 text-sm focus:outline-none transition-colors duration-150 ${
                            isSelf
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:border-emerald-500 focus:border-emerald-500 cursor-pointer'
                          }`}
                        >
                          <option value="admin">admin</option>
                          <option value="manager">manager</option>
                          <option value="developer">developer</option>
                        </select>
                      </div>

                      {/* Actions Column (w-24 for toggle and delete actions) */}
                      <div className="w-24 flex justify-end gap-2.5">
                        {/* 1. Toggle Active State (+ or -) */}
                        {u.deleted_at ? (
                          <button
                            disabled
                            className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-600 opacity-40 cursor-not-allowed"
                            title="Restore user to toggle active state"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth="2.5"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                            </svg>
                          </button>
                        ) : u.is_active ? (
                          <button
                            onClick={() => handleToggleActiveState(u.id)}
                            disabled={isSelf}
                            className={`p-1.5 bg-[#4c1c1c] border border-red-500/50 rounded-lg text-red-400 transition-colors ${
                              isSelf
                                ? 'opacity-40 cursor-not-allowed'
                                : 'hover:bg-[#682525] cursor-pointer'
                            }`}
                            title={
                              isSelf
                                ? 'You cannot deactivate your own account'
                                : 'Deactivate User (-)'
                            }
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth="2.5"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleActiveState(u.id)}
                            className="p-1.5 bg-[#043314] hover:bg-[#074c1f] border border-[#10b981]/50 rounded-lg text-emerald-400 cursor-pointer transition-colors"
                            title="Activate User (+)"
                          >
                            <svg
                              className="w-4 h-4"
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

                        {/* 2. Soft Delete / Restore (Trash / Revert Icon) */}
                        {u.deleted_at ? (
                          <button
                            onClick={() => handleRestoreUser(u.id)}
                            className="p-1.5 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/40 rounded-lg text-blue-400 cursor-pointer transition-colors"
                            title="Restore User"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                              />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSoftDeleteUser(u.id)}
                            disabled={isSelf}
                            className={`p-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 transition-colors ${
                              isSelf
                                ? 'opacity-40 cursor-not-allowed'
                                : 'hover:bg-zinc-700 cursor-pointer'
                            }`}
                            title={isSelf ? 'You cannot delete yourself' : 'Soft Delete User'}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <>
                    <UserRowSkeleton />
                    <UserRowSkeleton />
                    <UserRowSkeleton />
                  </>
                )}

                {/* Pagination See More Button */}
                {hasMore && !isLoading && (
                  <div className="flex justify-center pt-8 pb-12 pr-14">
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
      </div>
    </main>
  );
}

export default ChangeRole;
