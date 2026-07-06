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
    <main className="p-4 sm:p-8 text-white min-h-full bg-[#121212] select-none">
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 text-left">
        <div className="text-left">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1.5">Manage Roles</h1>
          <p className="text-zinc-400 text-sm">Assign permissions, manage user status, and configure workspace roles.</p>
        </div>

        {/* Warning/Error Message inside page */}
        {error && (
          <div className="text-red-400 text-sm font-bold bg-red-950/30 border border-red-500/40 rounded-xl py-2.5 px-4">
            {error}
          </div>
        )}

        {/* Search Input bar */}
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-zinc-500">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (error) setError('');
            }}
            placeholder="Search members by name or email"
            className="w-full h-10 pl-10 pr-4 bg-[#181818] border border-zinc-800 focus:border-[#098032] focus:ring-1 focus:ring-[#098032]/30 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none transition-all"
          />
        </div>

        {/* Members and Roles Grid Card */}
        <div className="bg-[#181818] border border-zinc-800/80 rounded-2xl shadow-xl overflow-hidden mt-6">
          {/* Headers matching mockup style */}
          <div className="hidden sm:flex items-center justify-between px-6 py-3.5 border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-900/40 select-none">
            <span>Member details</span>
            <div className="flex items-center gap-6 pr-3">
              <span className="w-48 text-left">Role</span>
              <span className="w-24 text-right">Actions</span>
            </div>
          </div>

          {/* User rows */}
          <div className="divide-y divide-zinc-800/60">
            {users.length === 0 && !isLoading ? (
              <div className="text-center text-zinc-500 py-12 text-sm italic">No users found</div>
            ) : (
              <>
                {users.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 py-4 sm:py-3.5 px-6 hover:bg-[#202020]/20 transition-all duration-150 ${
                        u.deleted_at ? 'opacity-40 bg-red-950/5' : !u.is_active ? 'opacity-60' : ''
                      }`}
                    >
                      {/* User profile */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#098032]/20 to-[#043314]/30 border border-[#098032]/35 flex items-center justify-center text-sm font-semibold text-emerald-400 select-none shrink-0 shadow-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col justify-center min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-semibold text-base truncate">
                              {u.name}
                            </span>
                            {isSelf && (
                              <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] font-semibold rounded-full border border-zinc-700 select-none">
                                You
                              </span>
                            )}
                            {u.deleted_at && (
                              <span className="px-2 py-0.5 bg-red-950/45 text-red-400 text-[10px] font-semibold rounded-full border border-red-500/25 select-none">
                                Deactivated
                              </span>
                            )}
                          </div>
                          <span className="text-zinc-500 text-xs truncate mt-0.5">{u.email}</span>
                        </div>
                      </div>

                      {/* Role select & Actions Container for Mobile alignment */}
                      <div className="flex items-center justify-between sm:justify-start gap-4 shrink-0">
                        {/* Role select */}
                        <div className="w-40 sm:w-48 relative">
                          <select
                            value={u.role}
                            disabled={isSelf || !!u.deleted_at}
                            onChange={(e) =>
                              handleRoleChange(
                                u.id,
                                e.target.value as 'admin' | 'manager' | 'developer'
                              )
                            }
                            className={`w-full bg-[#121212] border border-zinc-800 text-white rounded-xl pl-4 pr-10 py-2 text-sm focus:outline-none transition-all duration-150 appearance-none cursor-pointer ${
                              isSelf || u.deleted_at
                                ? 'opacity-40 cursor-not-allowed bg-zinc-900/20'
                                : 'hover:border-[#098032]/60 focus:border-[#098032] focus:ring-1 focus:ring-[#098032]/30'
                            }`}
                          >
                            <option value="admin">admin</option>
                            <option value="manager">manager</option>
                            <option value="developer">developer</option>
                          </select>
                          {!(isSelf || u.deleted_at) && (
                            <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-zinc-500">
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Actions Column (w-24 for toggle and delete actions) */}
                        <div className="w-24 flex justify-end gap-2">
                          {/* 1. Toggle Active State (+ or -) */}
                          {u.deleted_at ? (
                            <button
                              disabled
                              className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-600 opacity-40 cursor-not-allowed"
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
                              className={`p-2 bg-red-950/20 hover:bg-red-900/30 border border-red-500/20 text-red-400 rounded-lg transition-colors duration-150 ${
                                isSelf
                                  ? 'opacity-40 cursor-not-allowed'
                                  : 'hover:bg-[#682525] cursor-pointer'
                              }`}
                              title={
                                isSelf
                                  ? 'You cannot deactivate your own account'
                                  : 'Deactivate User'
                              }
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
                                  d="M19.5 12h-15"
                                />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleActiveState(u.id)}
                              className="p-2 bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-500/20 text-emerald-400 rounded-lg cursor-pointer transition-colors duration-150"
                              title="Activate User"
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
                              className="p-2 bg-blue-950/20 hover:bg-blue-900/30 border border-blue-500/20 text-blue-400 cursor-pointer transition-colors duration-150"
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
                              className={`p-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors duration-150 rounded-lg ${
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
                  <div className="flex justify-center pt-8 pb-12 sm:pr-14 bg-transparent border-t border-zinc-800/40">
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
