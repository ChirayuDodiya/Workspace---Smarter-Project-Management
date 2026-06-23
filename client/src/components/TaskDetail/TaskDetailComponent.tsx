import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { ProjectTask } from '../../types';
import type { User } from '../../types/auth';
import { decimalRegex } from '../../utils/validation';
import { useAuth } from '../../hooks/useAuth';

interface TaskDetailComponentProps {
  initialTask: ProjectTask;
  slug: string;
  onUpdate: (task: ProjectTask) => void;
}

export function TaskDetailComponent({
  initialTask: task,
  slug,
  onUpdate,
}: TaskDetailComponentProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isOwner = user?.role === 'admin' || task.project_owner_id === user?.id;
  const isAssignee = task.assigned_to?.id === user?.id;
  const canEditStatusAndAssignee = isOwner || isAssignee;

  // Delete task using DELETE /tasks/:id
  const handleDeleteTask = async () => {
    if (window.confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      try {
        const res = await api.delete(`/tasks/${task.id}`);
        if (res.data && res.data.success) {
          navigate(`/projects/${slug}`);
        }
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        const msg = axiosError.response?.data?.message || 'Failed to delete task.';
        alert(msg);
      }
    }
  };

  // Input states for inline editing
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description || '');
  const [editDueDate, setEditDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : '');
  const [editEstHours, setEditEstHours] = useState(task.estimated_hours?.toString() || '');
  const [editActHours, setEditActHours] = useState(task.actual_hours?.toString() || '');

  // Local status state to handle pending transitions before actual hours are saved
  const [localStatus, setLocalStatus] = useState<'todo' | 'in_progress' | 'in_review' | 'done'>(
    task.status
  );
  const [pendingStatus, setPendingStatus] = useState<'done' | null>(null);

  // Edit mode trackers
  const [editingField, setEditingField] = useState<string | null>(null);

  // Dropdown options
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  // Errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch project team members for assignee picker
  useEffect(() => {
    api
      .get(`/projects/${slug}/team-members`)
      .then((res) => {
        if (res.data && res.data.success) {
          setTeamMembers(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch project team members:', err);
      });
  }, [slug]);

  // Click outside to close assignee dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        assigneeDropdownRef.current &&
        !assigneeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowAssigneeDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const statusLabelMap: Record<string, string> = {
    todo: 'Todo',
    in_progress: 'In Progress',
    in_review: 'In Review',
    done: 'Done',
  };

  // Helper to check if a status transition is allowed
  const isStatusTransitionAllowed = (targetStatus: string) => {
    const statuses = ['todo', 'in_progress', 'in_review', 'done'];
    const currentIdx = statuses.indexOf(task.status);
    const targetIdx = statuses.indexOf(targetStatus);
    return targetIdx <= currentIdx + 1;
  };

  // Save fields using PUT /tasks/:id
  const saveField = async (fieldName: string, value: string | null) => {
    setFieldErrors({});

    try {
      const payload: Record<string, string | number | null> = {};

      if (fieldName === 'title') {
        const titleVal = String(value).trim();
        if (!titleVal) {
          setFieldErrors({ title: 'Title is required' });
          return;
        }
        if (titleVal.length < 3 || titleVal.length > 255) {
          setFieldErrors({ title: 'Title must be between 3 and 255 characters' });
          return;
        }
        payload.title = titleVal;
      } else if (fieldName === 'description') {
        payload.description = value ? String(value).trim() : '';
      } else if (fieldName === 'priority') {
        payload.priority = value;
      } else if (fieldName === 'due_date') {
        payload.due_date = value || null;
      } else if (fieldName === 'estimated_hours') {
        if (value) {
          if (!decimalRegex.test(value) || parseFloat(value) <= 0) {
            setFieldErrors({ estimated_hours: 'Must be a positive decimal (e.g. 12.5)' });
            return;
          }
          payload.estimated_hours = parseFloat(value);
        } else {
          payload.estimated_hours = null;
        }
      } else if (fieldName === 'actual_hours') {
        if (value) {
          if (!decimalRegex.test(value) || parseFloat(value) <= 0) {
            setFieldErrors({ actual_hours: 'Must be a positive decimal (e.g. 8.5)' });
            return;
          }
          const hoursVal = parseFloat(value);
          if (pendingStatus === 'done') {
            await saveStatus('done', hoursVal);
            return;
          } else {
            payload.actual_hours = hoursVal;
          }
        } else {
          if (task.status === 'done' || pendingStatus === 'done') {
            setFieldErrors({ actual_hours: 'Actual hours are required' });
            return;
          }
          payload.actual_hours = null;
        }
      }

      const res = await api.put(`/tasks/${task.id}`, payload);
      if (res.data && res.data.success) {
        const updatedTask = res.data.data;
        onUpdate(updatedTask);
        setEditingField(null);
      }
    } catch {
      // Revert values to current task state
      if (fieldName === 'title') setEditTitle(task.title);
      if (fieldName === 'description') setEditDesc(task.description || '');
      if (fieldName === 'due_date')
        setEditDueDate(task.due_date ? task.due_date.split('T')[0] : '');
      if (fieldName === 'estimated_hours') setEditEstHours(task.estimated_hours?.toString() || '');
      if (fieldName === 'actual_hours') setEditActHours(task.actual_hours?.toString() || '');
      setEditingField(null);
    }
  };

  // Save assignee using PATCH /tasks/:id/assign
  const saveAssignee = async (userId: number | null) => {
    try {
      const res = await api.patch(`/tasks/${task.id}/assign`, { assigned_to: userId });
      if (res.data && res.data.success) {
        const updatedTask = res.data.data;
        onUpdate(updatedTask);
        setShowAssigneeDropdown(false);
      }
    } catch {
      // Fail silently
    }
  };

  // Handle status select change
  const handleStatusChange = async (newStatus: 'todo' | 'in_progress' | 'in_review' | 'done') => {
    if (newStatus === task.status) return;

    if (!isStatusTransitionAllowed(newStatus)) {
      alert(`Status transition from ${task.status} to ${newStatus} is not allowed.`);
      return;
    }

    setLocalStatus(newStatus);

    if (newStatus === 'done' && !task.actual_hours) {
      // Compulsory actual hours. Don't call API yet.
      setPendingStatus('done');
      setEditingField('actual_hours');
      setFieldErrors({ actual_hours: 'Actual hours are required to set status to Done.' });
    } else {
      await saveStatus(newStatus);
    }
  };

  // Save status using PATCH /tasks/:id/status
  const saveStatus = async (statusVal: string, actualHoursVal?: number) => {
    try {
      const payload: Record<string, string | number> = { status: statusVal };
      if (actualHoursVal !== undefined) {
        payload.actual_hours = actualHoursVal;
      }
      const res = await api.patch(`/tasks/${task.id}/status`, payload);
      if (res.data && res.data.success) {
        const updatedTask = res.data.data;
        onUpdate(updatedTask);
        setEditingField(null);
        setPendingStatus(null);
      }
    } catch {
      // Fail silently
    }
  };

  const filteredMembers = teamMembers.filter((m) => {
    const q = searchQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  const isStatusDone = localStatus === 'done' || pendingStatus === 'done';

  return (
    <div className="max-w-2xl bg-[#1e1e1e]/95 border border-white/20 rounded-3xl sm:rounded-4xl p-5 sm:p-8 shadow-2xl space-y-6">
      {/* 1. Title Row */}
      <div className="space-y-1">
        <label className="block text-emerald-400 text-sm font-semibold">Title:</label>
        {editingField === 'title' ? (
          <div>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => {
                setEditTitle(e.target.value);
                if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: '' }));
              }}
              onBlur={() => void saveField('title', editTitle)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') {
                  setEditTitle(task.title);
                  setFieldErrors((prev) => ({ ...prev, title: '' }));
                  setEditingField(null);
                }
              }}
              className="w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] focus:border-emerald-500 focus:outline-none rounded-xl text-white text-sm"
              autoFocus
            />
            {fieldErrors.title && (
              <p className="text-red-400 text-xs font-semibold mt-1">{fieldErrors.title}</p>
            )}
          </div>
        ) : (
          <div
            onClick={() => setEditingField('title')}
            className="w-full min-h-11 px-4 py-2.5 bg-[#1e1e1e] border border-[#043314] hover:border-emerald-700 rounded-xl flex items-center cursor-pointer text-white text-sm font-semibold capitalize"
          >
            {task.title}
          </div>
        )}
      </div>

      {/* 2. Description Row */}
      <div className="space-y-1">
        <label className="block text-emerald-400 text-sm font-semibold">Description:</label>
        {editingField === 'description' ? (
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            onBlur={() => void saveField('description', editDesc)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setEditDesc(task.description || '');
                setEditingField(null);
              }
            }}
            rows={4}
            className="w-full p-4 bg-[#1e1e1e] border border-[#043314] focus:border-emerald-500 focus:outline-none rounded-2xl text-white text-sm resize-none"
            autoFocus
            placeholder="Enter task description"
          />
        ) : (
          <div
            onClick={() => setEditingField('description')}
            className="w-full min-h-24 p-4 bg-[#1e1e1e] border border-[#043314] hover:border-emerald-700 rounded-2xl cursor-pointer text-sm"
          >
            {task.description ? (
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            ) : (
              <p className="text-gray-500 italic">No description. Click to add details...</p>
            )}
          </div>
        )}
      </div>

      {/* 3. Status & Priority (Side by side) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Status */}
        <div className="space-y-1">
          <label className="block text-emerald-400 text-sm font-semibold">Status:</label>
          <select
            value={localStatus}
            disabled={!canEditStatusAndAssignee}
            onChange={(e) =>
              void handleStatusChange(
                e.target.value as 'todo' | 'in_progress' | 'in_review' | 'done'
              )
            }
            className={`w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] hover:border-emerald-700 focus:border-emerald-500 focus:outline-none rounded-xl text-white text-sm cursor-pointer capitalize font-semibold transition-colors ${
              !canEditStatusAndAssignee ? 'opacity-50 cursor-not-allowed border-zinc-700' : ''
            }`}
          >
            {['todo', 'in_progress', 'in_review', 'done'].map((st) => {
              const allowed = st === task.status || isStatusTransitionAllowed(st);
              return (
                <option
                  key={st}
                  value={st}
                  disabled={!allowed}
                  className={`${!allowed ? 'text-gray-600 bg-zinc-900' : 'text-white bg-[#1e1e1e]'}`}
                >
                  {statusLabelMap[st]} {!allowed && '(Disallowed)'}
                </option>
              );
            })}
          </select>
        </div>

        {/* Priority */}
        <div className="space-y-1">
          <label className="block text-emerald-400 text-sm font-semibold">Priority:</label>
          <select
            value={task.priority}
            onChange={(e) => void saveField('priority', e.target.value)}
            className="w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] hover:border-emerald-700 focus:border-emerald-500 focus:outline-none rounded-xl text-white text-sm cursor-pointer capitalize font-semibold transition-colors"
          >
            <option value="low" className="bg-[#1e1e1e]">
              Low
            </option>
            <option value="medium" className="bg-[#1e1e1e]">
              Medium
            </option>
            <option value="high" className="bg-[#1e1e1e]">
              High
            </option>
            <option value="critical" className="bg-[#1e1e1e]">
              Critical
            </option>
          </select>
        </div>
      </div>

      {/* 4. Assigned To */}
      <div className="space-y-1 relative" ref={assigneeDropdownRef}>
        <label className="block text-emerald-400 text-sm font-semibold">Assigned To:</label>
        <div
          onClick={() => {
            if (isOwner) {
              setShowAssigneeDropdown(!showAssigneeDropdown);
            }
          }}
          className={`w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] hover:border-emerald-700 focus-within:border-emerald-500 rounded-xl flex items-center justify-between cursor-pointer text-sm text-white transition-colors ${
            !isOwner ? 'opacity-50 cursor-not-allowed border-zinc-700' : ''
          }`}
        >
          {task.assigned_to ? (
            <span className="font-medium capitalize">{task.assigned_to.name}</span>
          ) : (
            <span className="text-gray-500 italic">Unassigned</span>
          )}

          <div className="flex items-center gap-2">
            {task.assigned_to && isOwner && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void saveAssignee(null);
                }}
                className="text-gray-500 hover:text-red-400 font-semibold text-xs focus:outline-none"
              >
                Clear
              </button>
            )}
            {isOwner && (
              <span className="border-t-4 border-t-gray-500 border-x-4 border-x-transparent inline-block w-0 h-0" />
            )}
          </div>
        </div>

        {/* Assignee Search Dropdown */}
        {showAssigneeDropdown && (
          <div className="absolute left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-56 flex flex-col">
            <div className="p-2 border-b border-white/5">
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 px-3 bg-[#121212] border border-white/10 focus:border-emerald-500 focus:outline-none rounded-lg text-white text-xs"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto flex-1 max-h-40">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => void saveAssignee(member.id)}
                    className={`px-4 py-2.5 text-sm hover:bg-[#043314] cursor-pointer flex items-center justify-between capitalize ${
                      task.assigned_to?.id === member.id
                        ? 'bg-[#043314]/55 font-semibold text-emerald-400'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-white text-xs">{member.name}</span>
                      <span className="text-[10px] text-gray-500 normal-case">{member.email}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-gray-500 text-center">
                  No team members found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. Due Date */}
      <div className="space-y-1">
        <label className="block text-emerald-400 text-sm font-semibold">Due Date:</label>
        <input
          type="date"
          value={editDueDate}
          onChange={(e) => {
            setEditDueDate(e.target.value);
            void saveField('due_date', e.target.value || null);
          }}
          className="w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] hover:border-emerald-700 focus:border-emerald-500 focus:outline-none rounded-xl text-white text-sm cursor-pointer transition-colors [&::-webkit-calendar-picker-indicator]:invert"
        />
      </div>

      {/* 6. Estimated Hours & Actual Hours (Side by side) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Estimated Hours */}
        <div className="space-y-1">
          <label className="block text-emerald-400 text-sm font-semibold">Estimated Hours:</label>
          {editingField === 'estimated_hours' ? (
            <div>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={editEstHours}
                onChange={(e) => {
                  setEditEstHours(e.target.value);
                  if (fieldErrors.estimated_hours)
                    setFieldErrors((prev) => ({ ...prev, estimated_hours: '' }));
                }}
                onBlur={() => void saveField('estimated_hours', editEstHours)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') {
                    setEditEstHours(task.estimated_hours?.toString() || '');
                    setFieldErrors((prev) => ({ ...prev, estimated_hours: '' }));
                    setEditingField(null);
                  }
                }}
                className="w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] focus:border-emerald-500 focus:outline-none rounded-xl text-white text-sm"
                autoFocus
                placeholder="e.g. 10.5"
              />
              {fieldErrors.estimated_hours && (
                <p className="text-red-400 text-[10px] font-semibold mt-1">
                  {fieldErrors.estimated_hours}
                </p>
              )}
            </div>
          ) : (
            <div
              onClick={() => setEditingField('estimated_hours')}
              className="w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] hover:border-emerald-700 rounded-xl flex items-center justify-between cursor-pointer text-sm font-semibold"
            >
              <span>
                {task.estimated_hours !== null && task.estimated_hours !== undefined
                  ? `${task.estimated_hours} hrs`
                  : 'Not set'}
              </span>
              <span className="text-gray-500 text-xs">hours</span>
            </div>
          )}
        </div>

        {/* Actual Hours */}
        {isStatusDone ? (
          <div className="space-y-1">
            <label className="block text-emerald-400 text-sm font-semibold">
              Actual Hours: <span className="text-red-500">*</span>
            </label>
            {editingField === 'actual_hours' ? (
              <div>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={editActHours}
                  onChange={(e) => {
                    setEditActHours(e.target.value);
                    if (fieldErrors.actual_hours)
                      setFieldErrors((prev) => ({ ...prev, actual_hours: '' }));
                  }}
                  onBlur={() => void saveField('actual_hours', editActHours)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                    if (e.key === 'Escape') {
                      setEditActHours(task.actual_hours?.toString() || '');
                      setFieldErrors((prev) => ({ ...prev, actual_hours: '' }));
                      if (pendingStatus === 'done') {
                        setLocalStatus(task.status);
                        setPendingStatus(null);
                      }
                      setEditingField(null);
                    }
                  }}
                  className="w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] focus:border-emerald-500 focus:outline-none rounded-xl text-white text-sm"
                  autoFocus
                  placeholder="e.g. 8.5"
                />
                {fieldErrors.actual_hours && (
                  <p className="text-red-400 text-[10px] font-semibold mt-1">
                    {fieldErrors.actual_hours}
                  </p>
                )}
              </div>
            ) : (
              <div
                onClick={() => setEditingField('actual_hours')}
                className="w-full h-11 px-4 bg-[#1e1e1e] border border-[#043314] hover:border-emerald-700 rounded-xl flex items-center justify-between cursor-pointer text-sm font-semibold"
              >
                <span>
                  {task.actual_hours !== null && task.actual_hours !== undefined
                    ? `${task.actual_hours} hrs`
                    : 'Not set'}
                </span>
                <span className="text-gray-500 text-xs">hours</span>
              </div>
            )}
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* Divider */}
      <hr className="border-white/10" />

      {/* Delete Task Button Row */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleDeleteTask}
          className="px-6 py-2 bg-[#4c1c1c] border border-red-500/40 hover:bg-[#682525] rounded-xl text-red-200 text-sm font-semibold transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete Task
        </button>
      </div>
    </div>
  );
}

export default TaskDetailComponent;
