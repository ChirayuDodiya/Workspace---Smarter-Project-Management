import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import type { User } from '../types';
import { validateAddProjectForm } from '../utils/validation';

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
      <div className="w-full max-w-2xl bg-[#121212]/95 border border-white/20 rounded-4xl p-8 shadow-2xl text-left select-none text-white">
        <h3 className="text-3xl font-semibold text-center mb-8 tracking-wide">Create Project</h3>

        {serverError && (
          <div className="mb-6 bg-red-950/40 border border-red-500/80 text-red-200 px-4 py-3 rounded-xl text-center text-sm font-medium">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name field */}
          <div className="space-y-1">
            <label className="block text-emerald-400 text-sm font-semibold">
              Name: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter project name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              className="w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] hover:border-emerald-700 focus:border-emerald-500 focus:outline-none rounded-xl text-white placeholder-gray-500 text-sm transition-colors"
            />
            {errors.name && (
              <p className="text-red-400 text-xs font-semibold mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description field */}
          <div className="space-y-1">
            <label className="block text-emerald-400 text-sm font-semibold">Description:</label>
            <textarea
              placeholder="Enter project description"
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
                  const val = e.target.value as
                    | 'planning'
                    | 'active'
                    | 'on_hold'
                    | 'completed'
                    | 'archived';
                  setStatus(val);
                }}
                className="w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] focus:border-emerald-500 focus:outline-none rounded-xl text-white text-sm cursor-pointer"
              >
                <option value="planning">planning</option>
                <option value="active">active</option>
                <option value="on_hold">on_hold</option>
                <option value="completed">completed</option>
                <option value="archived">archived</option>
              </select>
            </div>

            {/* owner_id Field */}
            <div className="space-y-1 relative" ref={dropdownRef}>
              <label className="block text-emerald-400 text-sm font-semibold">owner_id:</label>
              <div
                onClick={() => setShowOwnerDropdown(!showOwnerDropdown)}
                className="w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] hover:border-emerald-700 focus-within:border-emerald-500 rounded-xl flex items-center justify-between cursor-pointer text-sm text-gray-300"
              >
                {selectedOwner ? (
                  <span className="text-white font-medium capitalize">{selectedOwner.name}</span>
                ) : (
                  <span className="text-gray-500">Select owner</span>
                )}
                {selectedOwner && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOwner(null);
                    }}
                    className="text-gray-500 hover:text-red-400 ml-2 font-bold focus:outline-none"
                    title="Unassign Owner"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Owner searchable drop-down container */}
              {showOwnerDropdown && (
                <div className="absolute left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-56 flex flex-col">
                  <div className="p-2 border-b border-white/5">
                    <input
                      type="text"
                      placeholder="Search managers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-9 px-3 bg-[#121212] border border-white/10 focus:border-emerald-500 focus:outline-none rounded-lg text-white text-xs"
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
                          className={`px-4 py-2.5 text-sm hover:bg-[#043314] cursor-pointer flex flex-col capitalize ${
                            selectedOwner?.id === managerItem.id
                              ? 'bg-[#043314]/55 font-semibold text-emerald-400'
                              : ''
                          }`}
                        >
                          <span className="text-white">{managerItem.name}</span>
                          <span className="text-xs text-gray-400 normal-case">
                            {managerItem.email} ({managerItem.role})
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-gray-500 text-center">
                        No managers found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Start Date Field */}
            <div className="space-y-1">
              <label className="block text-emerald-400 text-sm font-semibold">start_date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] hover:border-emerald-700 focus:border-emerald-500 focus:outline-none rounded-xl text-white text-sm cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>

            {/* End Date Field */}
            <div className="space-y-1">
              <label className="block text-emerald-400 text-sm font-semibold">End_date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: '' }));
                }}
                className="w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] hover:border-emerald-700 focus:border-emerald-500 focus:outline-none rounded-xl text-white text-sm cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
              />
              {errors.endDate && (
                <p className="text-red-400 text-xs font-semibold mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Budget Field */}
          <div className="space-y-1">
            <label className="block text-emerald-400 text-sm font-semibold">budget:</label>
            <input
              type="text"
              placeholder="e.g. 150000.50"
              value={budget}
              onChange={(e) => {
                setBudget(e.target.value);
                if (errors.budget) setErrors((prev) => ({ ...prev, budget: '' }));
              }}
              className="w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] hover:border-emerald-700 focus:border-emerald-500 focus:outline-none rounded-xl text-white placeholder-gray-500 text-sm transition-colors"
            />
            {errors.budget && (
              <p className="text-red-400 text-xs font-semibold mt-1">{errors.budget}</p>
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

export default AddProjectModal;
