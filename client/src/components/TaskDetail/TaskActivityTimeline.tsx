import { useState, useEffect } from 'react';
import api from '../../services/api';
import type { ActivityLog } from '../../types';

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

  useEffect(() => {
    let active = true;
    const fetchLogs = async () => {
      try {
        const res = await api.get(`/tasks/${taskId}/activities`);
        if (active && res.data && res.data.success) {
          setLogs(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch activity logs:', err);
      }
    };

    if (taskId) {
      void fetchLogs();
    }
    return () => {
      active = false;
    };
  }, [taskId, activityTrigger]);

  return (
    <div className="space-y-2 w-full text-left">
      <h3 className="text-xl font-bold tracking-wide text-emerald-400">Activity Timeline:</h3>

      <div className="bg-[#1e1e1e]/95 border border-white/20 rounded-4xl p-6 shadow-2xl max-h-75 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-950 scrollbar-track-transparent">
        {logs.length > 0 ? (
          <div className="relative border-l border-emerald-800/40 ml-2 pl-4 space-y-4 py-1">
            {logs.map((log) => (
              <div key={log.id} className="relative group text-left">
                {/* Connector Dot */}
                <div className="absolute -left-5.25 top-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-[#1e1e1e]" />

                <div>
                  <p className="text-sm text-gray-200 font-medium">{formatActivityLog(log)}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {new Date(log.created_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-6">
            <p className="text-gray-500 italic text-sm">No activity logs recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskActivityTimeline;
