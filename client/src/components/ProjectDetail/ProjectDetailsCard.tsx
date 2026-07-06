import { useState, useEffect } from 'react';
import type { Project, User } from '../../types';
import { formatDate } from '../../utils/formatDate';
import api from '../../services/api';

interface ProjectDetailsCardProps {
  project: Project;
  onProjectUpdated: (updatedProject: Project) => void;
}

export function ProjectDetailsCard({ project, onProjectUpdated }: ProjectDetailsCardProps) {
  const [editingField, setEditingField] = useState<'name' | 'status' | 'dates' | 'owner' | null>(
    null
  );
  const [error, setError] = useState('');

  // Editable local state values
  const [editName, setEditName] = useState(project.name);
  const [editStatus, setEditStatus] = useState(project.status);
  const [editStartDate, setEditStartDate] = useState(() => project.start_date.split('T')[0]);
  const [editEndDate, setEditEndDate] = useState(() =>
    project.end_date ? project.end_date.split('T')[0] : ''
  );
  const [editOwnerId, setEditOwnerId] = useState<number | string>(project.owner?.id || '');

  // Managers list for dropdown selection
  const [managersList, setManagersList] = useState<User[]>([]);

  // Sync state values when project changes
  const [prevProject, setPrevProject] = useState(project);
  if (project !== prevProject) {
    setPrevProject(project);
    setEditName(project.name);
    setEditStatus(project.status);
    setEditStartDate(project.start_date.split('T')[0]);
    setEditEndDate(project.end_date ? project.end_date.split('T')[0] : '');
    setEditOwnerId(project.owner?.id || '');
    setError('');
  }

  // Fetch managers when the component mounts
  useEffect(() => {
    api
      .get('/projects/managers')
      .then((res) => {
        if (res.data && res.data.success) {
          setManagersList(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch managers list:', err);
      });
  }, []);

  const handleStartEdit = (field: 'name' | 'status' | 'dates' | 'owner') => {
    setError('');
    setEditingField(field);
  };

  const handleSave = async (field: 'name' | 'status' | 'dates' | 'owner') => {
    const payload: Record<string, string | number | null> = {};

    if (field === 'name') {
      const trimmedName = editName.trim();
      if (!trimmedName || trimmedName.length < 3) {
        setError('Project name must be at least 3 characters.');
        setEditName(project.name);
        setEditingField(null);
        return;
      }
      payload.name = trimmedName;
    } else if (field === 'status') {
      payload.status = editStatus;
    } else if (field === 'dates') {
      if (editStartDate && editEndDate && new Date(editEndDate) < new Date(editStartDate)) {
        setError('End date cannot be earlier than start date.');
        setEditStartDate(project.start_date.split('T')[0]);
        setEditEndDate(project.end_date ? project.end_date.split('T')[0] : '');
        setEditingField(null);
        return;
      }
      payload.start_date = editStartDate;
      payload.end_date = editEndDate || null;
    } else if (field === 'owner') {
      payload.owner_id = editOwnerId ? Number(editOwnerId) : null;
    }

    try {
      const res = await api.put(`/projects/${project.slug}`, payload);
      if (res.data && res.data.success) {
        onProjectUpdated(res.data.data);
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError.response?.data?.message || 'Failed to update project.';
      setError(msg);

      // Revert states
      if (field === 'name') setEditName(project.name);
      else if (field === 'status') setEditStatus(project.status);
      else if (field === 'dates') {
        setEditStartDate(project.start_date.split('T')[0]);
        setEditEndDate(project.end_date ? project.end_date.split('T')[0] : '');
      } else if (field === 'owner') {
        setEditOwnerId(project.owner?.id || '');
      }
    } finally {
      setEditingField(null);
    }
  };

  const handleDatesBlur = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      void handleSave('dates');
    }
  };

  const startDate = formatDate(project.start_date);
  const endDate = formatDate(project.end_date);

  return (
    <div className="w-full sm:w-75 bg-[#181818] border border-zinc-800/80 rounded-2xl p-5 text-white text-left select-none shrink-0">
      {/* Warning message inside card */}
      {error && (
        <div className="mb-3 text-red-400 text-xs font-bold text-center bg-red-950/30 border border-red-500/40 rounded-xl py-1.5 px-3">
          {error}
        </div>
      )}

      {/* Project Name Field */}
      {editingField === 'name' ? (
        <div className="mb-4">
          <input
            type="text"
            value={editName}
            onChange={(e) => {
              setEditName(e.target.value);
              if (error) setError('');
            }}
            className="w-full h-9 bg-[#121212] border border-[#098032] rounded-lg text-white px-3 focus:outline-none text-base font-bold"
            autoFocus
            onBlur={() => void handleSave('name')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') {
                setEditName(project.name);
                setEditingField(null);
              }
            }}
          />
        </div>
      ) : (
        <h2
          className="text-lg font-bold text-white mb-4 cursor-pointer hover:text-emerald-400 transition-colors"
          onClick={() => handleStartEdit('name')}
          title="Click to edit name"
        >
          {project.name}
        </h2>
      )}

      <div className="space-y-4">
        {/* Status Field */}
        <div>
          <span className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Status</span>
          {editingField === 'status' ? (
            <select
              value={editStatus}
              onChange={(e) =>
                setEditStatus(
                  e.target.value as 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
                )
              }
              className="w-full bg-[#121212] border border-[#098032] rounded-lg text-white text-sm px-3 py-1.5 focus:outline-none cursor-pointer"
              autoFocus
              onBlur={() => void handleSave('status')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') {
                  setEditStatus(project.status);
                  setEditingField(null);
                }
              }}
            >
              <option value="planning">planning</option>
              <option value="active">active</option>
              <option value="on_hold">on_hold</option>
              <option value="completed">completed</option>
              <option value="archived">archived</option>
            </select>
          ) : (
            <span
              className="text-sm font-semibold text-white capitalize cursor-pointer hover:text-emerald-400 transition-colors"
              onClick={() => handleStartEdit('status')}
              title="Click to edit status"
            >
              {project.status}
            </span>
          )}
        </div>

        {/* Dates Field */}
        <div>
          <span className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Dates</span>
          {editingField === 'dates' ? (
            <div
              className="flex flex-col gap-1.5 p-2 bg-[#121212]/70 rounded-xl border border-zinc-800"
              onBlur={handleDatesBlur}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 w-9 shrink-0">Start</span>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => {
                    setEditStartDate(e.target.value);
                    if (error) setError('');
                  }}
                  className="flex-1 bg-[#121212] border border-zinc-800 hover:border-zinc-700 focus:border-[#098032] rounded px-2 py-0.5 text-xs text-white [&::-webkit-calendar-picker-indicator]:invert focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 w-9 shrink-0">End</span>
                <input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => {
                    setEditEndDate(e.target.value);
                    if (error) setError('');
                  }}
                  className="flex-1 bg-[#121212] border border-zinc-800 hover:border-zinc-700 focus:border-[#098032] rounded px-2 py-0.5 text-xs text-white [&::-webkit-calendar-picker-indicator]:invert focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <span
              className="text-sm font-semibold text-white cursor-pointer hover:text-emerald-400 transition-colors"
              onClick={() => handleStartEdit('dates')}
              title="Click to edit dates"
            >
              {startDate} → {endDate || '—'}
            </span>
          )}
        </div>

        {/* Owner Field */}
        <div>
          <span className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Owner</span>
          {editingField === 'owner' ? (
            <select
              value={editOwnerId}
              onChange={(e) => setEditOwnerId(e.target.value)}
              className="w-full bg-[#121212] border border-[#098032] rounded-lg text-white text-sm px-3 py-1.5 focus:outline-none cursor-pointer"
              autoFocus
              onBlur={() => void handleSave('owner')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') {
                  setEditOwnerId(project.owner?.id || '');
                  setEditingField(null);
                }
              }}
            >
              <option value="">No Owner</option>
              {managersList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          ) : (
            <span
              className="text-sm font-semibold text-white capitalize cursor-pointer hover:text-emerald-400 transition-colors"
              onClick={() => handleStartEdit('owner')}
              title="Click to edit owner"
            >
              {project.owner?.name || '—'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailsCard;
