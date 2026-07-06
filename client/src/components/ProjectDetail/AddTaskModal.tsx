import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import type { User } from '../../types';
import { validateAddTaskForm } from '../../utils/validation';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
}

export function AddTaskModal({ isOpen, onClose, slug }: AddTaskModalProps) {
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

  // Fetch project team members on open
  useEffect(() => {
    if (isOpen) {
      api
        .get(`/projects/${slug}/team-members`)
        .then((res) => {
          if (res.data && res.data.success) {
            setAllUsers(res.data.data);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch project team members:', err);
        });
    }
  }, [isOpen, slug]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#181818] border border-zinc-800/80 rounded-2xl shadow-2xl text-white overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80">
          <h3 className="text-base font-bold text-white tracking-wide">Add Task</h3>
          <button
            type="button"
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
        <div className="px-6 py-5 overflow-y-auto max-h-[80vh]">
          {serverError && (
            <div className="mb-5 bg-red-950/40 border border-red-500/40 text-red-300 px-4 py-2.5 rounded-xl text-sm font-medium">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title field */}
            <div className="space-y-1.5">
              <label className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter task title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                }}
                className="w-full h-10 px-3 bg-[#121212] border border-zinc-800 hover:border-zinc-700 focus:border-[#098032] focus:ring-1 focus:ring-[#098032]/20 focus:outline-none rounded-xl text-white placeholder-zinc-600 text-sm transition-all"
              />
              {errors.title && (
                <p className="text-red-400 text-xs font-medium">{errors.title}</p>
              )}
            </div>

            {/* Description field */}
            <div className="space-y-1.5">
              <label className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                Description
              </label>
              <textarea
                placeholder="Enter task description (optional)"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-[#121212] border border-zinc-800 hover:border-zinc-700 focus:border-[#098032] focus:ring-1 focus:ring-[#098032]/20 focus:outline-none rounded-xl text-white placeholder-zinc-600 text-sm transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Status Field */}
              <div className="space-y-1.5">
                <label className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider">Status</label>
                <select
                  value={status}
                  onChange={(e) => {
                    const val = e.target.value as 'todo' | 'in_progress' | 'in_review' | 'done';
                    setStatus(val);
                    if (val !== 'done' && errors.actualHours) {
                      setErrors((prev) => ({ ...prev, actualHours: '' }));
                    }
                  }}
                  className="w-full h-10 px-3 bg-[#121212] border border-zinc-800 hover:border-zinc-700 focus:border-[#098032] focus:outline-none rounded-xl text-white text-sm cursor-pointer"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              {/* Priority Field */}
              <div className="space-y-1.5">
                <label className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider">Priority</label>
                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as 'low' | 'medium' | 'high' | 'critical')
                  }
                  className="w-full h-10 px-3 bg-[#121212] border border-zinc-800 hover:border-zinc-700 focus:border-[#098032] focus:outline-none rounded-xl text-white text-sm cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Assigned To Field */}
              <div className="space-y-1.5 relative" ref={dropdownRef}>
                <label className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider">Assigned To</label>
                <div
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="w-full h-10 px-3 bg-[#121212] border border-zinc-800 hover:border-zinc-700 focus-within:border-[#098032] rounded-xl flex items-center justify-between cursor-pointer text-sm"
                >
                  {selectedUser ? (
                    <span className="text-white font-medium capitalize">{selectedUser.name}</span>
                  ) : (
                    <span className="text-zinc-600">Unassigned</span>
                  )}
                  {selectedUser && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(null);
                      }}
                      className="text-zinc-600 hover:text-red-400 ml-2 font-bold focus:outline-none"
                      title="Unassign"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {showUserDropdown && (
                  <div className="absolute left-0 right-0 mt-1 bg-[#181818] border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden max-h-52 flex flex-col">
                    <div className="p-2 border-b border-zinc-800">
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-8 px-3 bg-[#121212] border border-zinc-800 focus:border-[#098032] focus:outline-none rounded-lg text-white text-xs"
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
                            className={`px-3 py-2 text-sm hover:bg-zinc-800 cursor-pointer capitalize ${
                              selectedUser?.id === userItem.id
                                ? 'bg-emerald-950/30 text-emerald-400'
                                : 'text-white'
                            }`}
                          >
                            <span className="block font-medium">{userItem.name}</span>
                            <span className="text-xs text-zinc-500 normal-case">{userItem.email}</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-xs text-zinc-600 text-center">No users found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Due Date Field */}
              <div className="space-y-1.5">
                <label className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-10 px-3 bg-[#121212] border border-zinc-800 hover:border-zinc-700 focus:border-[#098032] focus:outline-none rounded-xl text-white text-sm cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Estimated Hours Field */}
              <div className="space-y-1.5">
                <label className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                  Estimated Hours
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
                  className="w-full h-10 px-3 bg-[#121212] border border-zinc-800 hover:border-zinc-700 focus:border-[#098032] focus:outline-none rounded-xl text-white placeholder-zinc-600 text-sm"
                />
                {errors.estimatedHours && (
                  <p className="text-red-400 text-xs font-medium">{errors.estimatedHours}</p>
                )}
              </div>

              {/* Actual Hours Field (only if status is done) */}
              {status === 'done' ? (
                <div className="space-y-1.5">
                  <label className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                    Actual Hours <span className="text-red-400">*</span>
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
                    className="w-full h-10 px-3 bg-[#121212] border border-zinc-800 hover:border-zinc-700 focus:border-[#098032] focus:outline-none rounded-xl text-white placeholder-zinc-600 text-sm"
                  />
                  {errors.actualHours && (
                    <p className="text-red-400 text-xs font-medium">{errors.actualHours}</p>
                  )}
                </div>
              ) : (
                <div />
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-5 bg-transparent hover:bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700 rounded-xl text-zinc-400 hover:text-white text-sm font-semibold transition-all cursor-pointer focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 px-6 bg-[#045c22] hover:bg-[#074c1f] rounded-xl text-white text-sm font-semibold transition-all cursor-pointer shadow-md focus:outline-none border border-transparent"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddTaskModal;
