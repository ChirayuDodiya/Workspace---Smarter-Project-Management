import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import type { User } from '../../types';
import { validateAddProjectForm } from '../../utils/validation';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export function AddProjectModal({ isOpen, onClose, onProjectCreated }: AddProjectModalProps) {
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<
    'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
  >('planning');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');

  // Manager search / dropdown state
  const [allManagers, setAllManagers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  // Fetch managers when modal opens
  useEffect(() => {
    if (isOpen) {
      api
        .get('/projects/managers')
        .then((res) => {
          if (res.data && res.data.success) {
            setAllManagers(res.data.data);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch managers:', err);
        });
    }
  }, [isOpen]);

  // Click outside to close the owner dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowOwnerDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = validateAddProjectForm({
      name,
      budget,
      startDate,
      endDate,
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
      name: name.trim(),
      description: description.trim() || undefined,
      status,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      budget: budget ? budget : undefined,
      owner_id: selectedOwner ? selectedOwner.id : undefined,
    };

    try {
      const res = await api.post('/projects', payload);
      if (res.data && res.data.success) {
        // Reset states
        setName('');
        setDescription('');
        setStatus('planning');
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate('');
        setBudget('');
        setSelectedOwner(null);
        setSearchQuery('');
        onProjectCreated();
        onClose();
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError.response?.data?.message || 'Failed to create project.';
      setServerError(msg);
    }
  };

  const filteredManagers = allManagers.filter((m) => {
    const query = searchQuery.toLowerCase();
    return m.name.toLowerCase().includes(query) || m.email.toLowerCase().includes(query);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300">
      <div className="w-full max-w-xl bg-[#181818] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl text-left select-none text-white">
        <h3 className="text-2xl font-bold tracking-tight text-center mb-6">Create Project</h3>

        {serverError && (
          <div className="mb-6 bg-red-950/30 border border-red-500/30 text-red-400 px-3.5 py-2.5 rounded-xl text-center text-sm font-medium">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name field */}
          <div className="space-y-1.5">
            <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter project name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              className="w-full h-11 px-4 bg-[#121212] border border-zinc-800 hover:border-zinc-750 focus:border-[#098032] focus:ring-1 focus:ring-[#098032]/30 rounded-xl text-white placeholder-zinc-650 text-sm focus:outline-none transition-all duration-150"
            />
            {errors.name && (
              <p className="text-red-400 text-xs font-semibold mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description field */}
          <div className="space-y-1.5">
            <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider">Description</label>
            <textarea
              placeholder="Enter project description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 bg-[#121212] border border-zinc-800 hover:border-zinc-750 focus:border-[#098032] focus:ring-1 focus:ring-[#098032]/30 rounded-xl text-white placeholder-zinc-650 text-sm focus:outline-none transition-all duration-150 resize-none h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status Field */}
            <div className="space-y-1.5 relative">
              <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  const val = e.target.value as
                    | 'planning'
                    | 'active'
                    | 'on_hold'
                    | 'completed'
                    | 'archived';
                  setStatus(val);
                }}
                className="w-full h-11 pl-4 pr-10 bg-[#121212] border border-zinc-800 hover:border-zinc-750 focus:border-[#098032] focus:ring-1 focus:ring-[#098032]/30 rounded-xl text-white text-sm cursor-pointer appearance-none select-none font-medium transition-all"
              >
                <option value="planning">planning</option>
                <option value="active">active</option>
                <option value="on_hold">on_hold</option>
                <option value="completed">completed</option>
                <option value="archived">archived</option>
              </select>
              {/* Arrow Indicator */}
              <div className="absolute inset-y-0 right-3.5 top-6.5 flex items-center pointer-events-none text-zinc-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>

            {/* owner_id Field */}
            <div className="space-y-1.5 relative" ref={dropdownRef}>
              <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider">Owner</label>
              <div
                onClick={() => setShowOwnerDropdown(!showOwnerDropdown)}
                className="w-full h-11 px-4 bg-[#121212] border border-zinc-800 hover:border-zinc-750 focus-within:border-[#098032] focus-within:ring-1 focus-within:ring-[#098032]/30 rounded-xl flex items-center justify-between cursor-pointer text-sm text-zinc-300 transition-all duration-150"
              >
                {selectedOwner ? (
                  <span className="text-white font-medium capitalize">{selectedOwner.name}</span>
                ) : (
                  <span className="text-zinc-500">Select owner</span>
                )}
                {selectedOwner && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOwner(null);
                    }}
                    className="text-zinc-500 hover:text-red-400 ml-2 font-bold focus:outline-none"
                    title="Unassign Owner"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Owner searchable drop-down container */}
              {showOwnerDropdown && (
                <div className="absolute left-0 right-0 mt-2 bg-[#1a1a1a] border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-56 flex flex-col">
                  <div className="p-2 border-b border-zinc-800/40">
                    <input
                      type="text"
                      placeholder="Search managers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-9 px-3 bg-[#121212] border border-zinc-800/60 focus:border-[#098032] focus:outline-none rounded-lg text-white text-xs"
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto flex-1 max-h-40">
                    {filteredManagers.length > 0 ? (
                      filteredManagers.map((managerItem) => (
                        <div
                          key={managerItem.id}
                          onClick={() => {
                            setSelectedOwner(managerItem);
                            setShowOwnerDropdown(false);
                            setSearchQuery('');
                          }}
                          className={`px-4 py-2.5 text-sm hover:bg-emerald-950/40 hover:text-emerald-300 cursor-pointer flex flex-col capitalize transition-colors duration-100 ${
                            selectedOwner?.id === managerItem.id
                              ? 'bg-emerald-950/40 font-semibold text-emerald-400'
                              : ''
                          }`}
                        >
                          <span className="text-white">{managerItem.name}</span>
                          <span className="text-xs text-zinc-500 normal-case mt-0.5">
                            {managerItem.email} ({managerItem.role})
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-zinc-500 text-center italic">
                        No managers found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Start Date Field */}
            <div className="space-y-1.5">
              <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-11 px-4 bg-[#121212] border border-zinc-800 hover:border-zinc-750 focus:border-[#098032] focus:ring-1 focus:ring-[#098032]/30 rounded-xl text-white text-sm cursor-pointer [&::-webkit-calendar-picker-indicator]:invert transition-all"
              />
            </div>

            {/* End Date Field */}
            <div className="space-y-1.5">
              <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: '' }));
                }}
                className="w-full h-11 px-4 bg-[#121212] border border-zinc-800 hover:border-zinc-750 focus:border-[#098032] focus:ring-1 focus:ring-[#098032]/30 rounded-xl text-white text-sm cursor-pointer [&::-webkit-calendar-picker-indicator]:invert transition-all"
              />
              {errors.endDate && (
                <p className="text-red-400 text-xs font-semibold mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Budget Field */}
          <div className="space-y-1.5">
            <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider">Budget</label>
            <input
              type="text"
              placeholder="e.g. 150000.50"
              value={budget}
              onChange={(e) => {
                setBudget(e.target.value);
                if (errors.budget) setErrors((prev) => ({ ...prev, budget: '' }));
              }}
              className="w-full h-11 px-4 bg-[#121212] border border-zinc-800 hover:border-zinc-750 focus:border-[#098032] focus:ring-1 focus:ring-[#098032]/30 rounded-xl text-white placeholder-zinc-650 text-sm focus:outline-none transition-all duration-150"
            />
            {errors.budget && (
              <p className="text-red-400 text-xs font-semibold mt-1">{errors.budget}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 bg-transparent hover:bg-zinc-800/60 border border-zinc-800 rounded-xl text-zinc-300 text-sm font-semibold transition-colors duration-150 cursor-pointer focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-8 bg-[#045c22] hover:bg-[#074c1f] rounded-xl text-white text-sm font-semibold tracking-wide transition-all border border-transparent shadow-md focus:outline-none focus:ring-2 focus:ring-[#098032] focus:ring-offset-2 focus:ring-offset-[#181818] cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProjectModal;
