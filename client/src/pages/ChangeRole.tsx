import { useState, useEffect } from 'react';
import api from '../services/api';
import type { User } from '../types';

export function ChangeRole() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  // Fetch users list whenever search query or page changes
  useEffect(() => {
    let active = true;
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users', {
          params: { search: searchQuery, page, per_page: 20 },
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
      }
    };

    void fetchUsers();
    return () => {
      active = false;
    };
  }, [searchQuery, page]);

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
              setPage(1);
              if (error) setError('');
            }}
            placeholder="search users by name or email"
            className="w-full max-w-xl h-10 px-4 bg-[#121212] border border-[#10b981] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none transition-all"
          />
        </div>

        {/* Members and Roles Grid */}
        <div className="space-y-4 pt-4">
          {/* Headers matching mockup style */}
          <div className="flex items-center gap-6">
            <div className="flex-1 text-center py-2 px-6 border border-white rounded-full text-white text-base font-semibold">
              Member name
            </div>
            <div className="w-56 text-center py-2 px-6 border border-white rounded-full text-white text-base font-semibold">
              role
            </div>
          </div>

          {/* User rows */}
          <div className="space-y-2">
            {users.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No users found</div>
            ) : (
              <>
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-6 py-3 px-6 hover:bg-[#1a1a1a] rounded-2xl transition-colors duration-150"
                  >
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <span className="text-white font-semibold text-base truncate">{u.name}</span>
                      <span className="text-gray-500 text-xs truncate mt-0.5">{u.email}</span>
                    </div>
                    <div className="w-56 flex justify-center">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(
                            u.id,
                            e.target.value as 'admin' | 'manager' | 'developer'
                          )
                        }
                        className="w-full bg-[#1e1e1e] border border-[#333] hover:border-emerald-500 focus:border-emerald-500 text-white rounded-xl px-4 py-2 text-sm focus:outline-none transition-colors duration-150 cursor-pointer"
                      >
                        <option value="admin">admin</option>
                        <option value="manager">manager</option>
                        <option value="developer">developer</option>
                      </select>
                    </div>
                  </div>
                ))}

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
      </div>
    </main>
  );
}

export default ChangeRole;
