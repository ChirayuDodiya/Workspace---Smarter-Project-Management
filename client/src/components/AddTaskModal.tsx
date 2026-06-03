import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import type { User } from '../types';
import { validateAddTaskForm } from '../utils/validation';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  slug: string;
}

export function AddTaskModal({ isOpen, onClose, onTaskCreated, slug }: AddTaskModalProps) {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'in_review' | 'done'>('todo');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [actualHours, setActualHours] = useState('');

  // User list search state
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Validation errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  // Fetch users on open
  useEffect(() => {
    if (isOpen) {
      api
        .get('/auth/users')
        .then((res) => {
          if (res.data && res.data.success) {
            setAllUsers(res.data.data);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch users:', err);
        });
    }
  }, [isOpen]);

  // Click outside to close user dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = validateAddTaskForm({
      title,
      status,
      estimatedHours,
      actualHours,
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) {
      return;
    }

    const payload: Record<string, string | number | undefined> = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      assigned_to: selectedUser ? selectedUser.id : undefined,
      due_date: dueDate || undefined,
      estimated_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
    };

    if (status === 'done') {
      payload.actual_hours = parseFloat(actualHours);
    }

    try {
      const res = await api.post(`/projects/${slug}/tasks`, payload);
      if (res.data && res.data.success) {
        // Reset states
        setTitle('');
        setDescription('');
        setStatus('todo');
        setPriority('medium');
        setDueDate('');
        setEstimatedHours('');
        setActualHours('');
        setSelectedUser(null);
        setSearchQuery('');
        onTaskCreated();
        onClose();
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError.response?.data?.message || 'Failed to create task.';
      setServerError(msg);
    }
  };

  // Filtered users for search list
  const filteredUsers = allUsers.filter((u) => {
    const query = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300">
      <div className="w-full max-w-2xl bg-[#121212]/95 border border-white/20 rounded-4xl p-8 shadow-2xl text-left select-none text-white">
        <h3 className="text-3xl font-semibold text-center mb-8 tracking-wide">Add Task</h3>

        {serverError && (
          <div className="mb-6 bg-red-950/40 border border-red-500/80 text-red-200 px-4 py-3 rounded-xl text-center text-sm font-medium">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title field */}
          <div className="space-y-1">
            <label className="block text-emerald-400 text-sm font-semibold">
              Title: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              className="w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] hover:border-emerald-700 focus:border-emerald-500 focus:outline-none rounded-xl text-white placeholder-gray-500 text-sm transition-colors"
            />
            {errors.title && (
              <p className="text-red-400 text-xs font-semibold mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description field */}
          <div className="space-y-1">
            <label className="block text-emerald-400 text-sm font-semibold">Description:</label>
            <textarea
              placeholder="Enter task description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 bg-[#1e1e1e] border border-[#043314] hover:border-emerald-700 focus:border-emerald-500 focus:outline-none rounded-2xl text-white placeholder-gray-500 text-sm transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Status Field */}
            <div className="space-y-1">
              <label className="block text-emerald-400 text-sm font-semibold">Status:</label>
              <select
                value={status}
                onChange={(e) => {
                  const val = e.target.value as 'todo' | 'in_progress' | 'in_review' | 'done';
                  setStatus(val);
                  if (val !== 'done' && errors.actualHours) {
                    setErrors((prev) => ({ ...prev, actualHours: '' }));
                  }
                }}
                className="w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] focus:border-emerald-500 focus:outline-none rounded-xl text-white text-sm cursor-pointer"
              >
                <option value="todo">todo</option>
                <option value="in_progress">in_progress</option>
                <option value="in_review">in_review</option>
                <option value="done">done</option>
              </select>
            </div>

            {/* Priority Field */}
            <div className="space-y-1">
              <label className="block text-emerald-400 text-sm font-semibold">Priority:</label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as 'low' | 'medium' | 'high' | 'critical')
                }
                className="w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] focus:border-emerald-500 focus:outline-none rounded-xl text-white text-sm cursor-pointer"
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="critical">critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Assigned To Field */}
            <div className="space-y-1 relative" ref={dropdownRef}>
              <label className="block text-emerald-400 text-sm font-semibold">Assigned To:</label>
              <div
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] hover:border-emerald-700 focus-within:border-emerald-500 rounded-xl flex items-center justify-between cursor-pointer text-sm text-gray-300"
              >
                {selectedUser ? (
                  <span className="text-white font-medium capitalize">{selectedUser.name}</span>
                ) : (
                  <span className="text-gray-500">Unassigned</span>
                )}
                {selectedUser && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUser(null);
                    }}
                    className="text-gray-500 hover:text-red-400 ml-2 font-bold focus:outline-none"
                    title="Unassign User"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* User searchable drop-down container */}
              {showUserDropdown && (
                <div className="absolute left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-56 flex flex-col">
                  <div className="p-2 border-b border-white/5">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-9 px-3 bg-[#121212] border border-white/10 focus:border-emerald-500 focus:outline-none rounded-lg text-white text-xs"
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto flex-1 max-h-40">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((userItem) => (
                        <div
                          key={userItem.id}
                          onClick={() => {
                            setSelectedUser(userItem);
                            setShowUserDropdown(false);
                            setSearchQuery('');
                          }}
                          className={`px-4 py-2.5 text-sm hover:bg-[#043314] cursor-pointer flex flex-col capitalize ${
                            selectedUser?.id === userItem.id
                              ? 'bg-[#043314]/55 font-semibold text-emerald-400'
                              : ''
                          }`}
                        >
                          <span className="text-white">{userItem.name}</span>
                          <span className="text-xs text-gray-400 normal-case">
                            {userItem.email}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-gray-500 text-center">
                        No users found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Due Date Field */}
            <div className="space-y-1">
              <label className="block text-emerald-400 text-sm font-semibold">Due Date:</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] hover:border-emerald-700 focus:border-emerald-500 focus:outline-none rounded-xl text-white text-sm cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Estimated Hours Field */}
            <div className="space-y-1">
              <label className="block text-emerald-400 text-sm font-semibold">
                Estimated Hours:
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="e.g. 10.5"
                value={estimatedHours}
                onChange={(e) => {
                  setEstimatedHours(e.target.value);
                  if (errors.estimatedHours) setErrors((prev) => ({ ...prev, estimatedHours: '' }));
                }}
                className="w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] hover:border-emerald-700 focus:border-emerald-500 focus:outline-none rounded-xl text-white placeholder-gray-500 text-sm transition-colors"
              />
              {errors.estimatedHours && (
                <p className="text-red-400 text-xs font-semibold mt-1">{errors.estimatedHours}</p>
              )}
            </div>

            {/* Actual Hours Field (Show actual_hours only if status is done) */}
            {status === 'done' ? (
              <div className="space-y-1">
                <label className="block text-emerald-400 text-sm font-semibold">
                  Actual Hours: <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="e.g. 8.5"
                  value={actualHours}
                  onChange={(e) => {
                    setActualHours(e.target.value);
                    if (errors.actualHours) setErrors((prev) => ({ ...prev, actualHours: '' }));
                  }}
                  className="w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] hover:border-emerald-700 focus:border-emerald-500 focus:outline-none rounded-xl text-white placeholder-gray-500 text-sm transition-colors"
                />
                {errors.actualHours && (
                  <p className="text-red-400 text-xs font-semibold mt-1">{errors.actualHours}</p>
                )}
              </div>
            ) : (
              <div />
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-6 bg-transparent hover:bg-white/5 border border-white/20 rounded-xl text-gray-300 text-sm font-semibold transition-colors duration-200 cursor-pointer focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-8 bg-[#043314] hover:bg-[#074c1f] border border-white rounded-xl text-white text-sm font-semibold transition-colors duration-200 cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-[#098032]"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTaskModal;
