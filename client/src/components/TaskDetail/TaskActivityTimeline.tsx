import { useState, useEffect } from 'react';
import api from '../../services/api';
import type { ActivityLog } from '../../types';
import TaskActivityTimelineSkeleton from './TaskActivityTimelineSkeleton';

interface TaskActivityTimelineProps {
  taskId: number;
  activityTrigger: number;
}

const formatActivityLog = (log: ActivityLog): string => {
  const userName = log.user?.name || 'Someone';
  const action = log.action;
  const type = log.subject_type;

  if (type === 'task') {
    if (action === 'created') {
      return `${userName} created this task`;
    }
    if (action === 'updated') {
      const changes = log.properties?.changes;
      if (changes) {
        const changedFields = Object.keys(changes).filter(
          (k) => k !== 'updated_at' && changes[k] !== undefined
        );
        if (changedFields.length > 0) {
          if (changedFields.includes('status')) {
            const statusLabels: Record<string, string> = {
              todo: 'Todo',
              in_progress: 'In Progress',
              in_review: 'In Review',
              done: 'Done',
            };
            const statusKey = changes.status ? String(changes.status) : '';
            const toStatus = statusKey ? statusLabels[statusKey] || statusKey : '';
            return `${userName} changed status to ${toStatus}`;
          }
          if (changedFields.includes('assigned_to')) {
            return `${userName} updated the assignee`;
          }
          if (changedFields.includes('actual_hours')) {
            return `${userName} set actual hours to ${String(changes.actual_hours)} hrs`;
          }
          const fieldNames = changedFields.map((f) => f.replace('_', ' ')).join(', ');
          return `${userName} updated task ${fieldNames}`;
        }
      }
      return `${userName} updated this task`;
    }
    if (action === 'deleted') {
      return `${userName} deleted this task`;
    }
  }

  if (type === 'comment') {
    if (action === 'created') {
      return `${userName} added a comment`;
    }
    if (action === 'updated') {
      return `${userName} edited a comment`;
    }
    if (action === 'deleted') {
      return `${userName} deleted a comment`;
    }
  }

  return `${userName} ${action} ${type}`;
};

export function TaskActivityTimeline({ taskId, activityTrigger }: TaskActivityTimelineProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        setError('');
        const res = await api.get(`/tasks/${taskId}/activities`);
        if (active && res.data && res.data.success) {
          setLogs(res.data.data);
        }
      } catch (err: unknown) {
        if (active) {
          const axiosError = err as { response?: { data?: { message?: string } } };
          setError(axiosError.response?.data?.message || 'Failed to fetch activity logs.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    if (taskId) {
      void fetchLogs();
    }
    return () => {
      active = false;
    };
  }, [taskId, activityTrigger]);

  if (isLoading) {
    return <TaskActivityTimelineSkeleton />;
  }

  if (error) {
    return (
      <div className="text-red-300 text-sm font-medium py-6 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="h-120 sm:h-140 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
      {logs.length > 0 ? (
        <div className="relative border-l border-zinc-800 ml-2 pl-5 space-y-4 py-1">
          {logs.map((log) => (
            <div key={log.id} className="relative text-left">
              {/* Connector Dot */}
              <div className="absolute -left-6 top-1.5 w-2 h-2 bg-emerald-600 rounded-full border-2 border-[#181818]" />

              <p className="text-sm text-zinc-200 font-medium leading-snug">{formatActivityLog(log)}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">
                {new Date(log.created_at).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-12">
          <p className="text-zinc-600 italic text-sm">No activity recorded yet.</p>
        </div>
      )}
    </div>
  );
}

export default TaskActivityTimeline;
