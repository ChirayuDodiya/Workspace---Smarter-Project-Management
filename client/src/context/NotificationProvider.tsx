/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { socket } from '../services/socket';
import { useAuth } from '../hooks/useAuth';

export interface Toast {
  id: string;
  title: string;
  message: string;
  projectSlug?: string;
  taskId?: number;
  type: 'info' | 'success' | 'warning' | 'error';
  isExiting?: boolean;
}

interface NotificationContextType {
  toasts: Toast[];
  showToast: (
    title: string,
    message: string,
    type?: Toast['type'],
    projectSlug?: string,
    taskId?: number
  ) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { user } = useAuth();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t)));
    // Wait for the exit animation duration to clean up the state
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback(
    (
      title: string,
      message: string,
      type: Toast['type'] = 'info',
      projectSlug?: string,
      taskId?: number
    ) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type, projectSlug, taskId }]);

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        removeToast(id);
      }, 6000);
    },
    [removeToast]
  );

  // Listen to assignee socket notifications
  useEffect(() => {
    if (!user) return;

    const handleAssignedNotification = (data: {
      task: { id: number; title: string };
      projectSlug?: string;
      updaterName: string;
      action: string;
      message: string;
    }) => {
      // Determine type based on action
      let type: Toast['type'] = 'info';
      if (data.action === 'status_changed') {
        type = 'success';
      } else if (data.action === 'assigned') {
        type = 'success';
      } else if (data.action === 'reassigned') {
        type = 'warning';
      }

      showToast('Task Updated', data.message, type, data.projectSlug, data.task.id);
    };

    socket.on('task:assigned_notification', handleAssignedNotification);

    return () => {
      socket.off('task:assigned_notification', handleAssignedNotification);
    };
  }, [user, showToast]);

  return (
    <NotificationContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}

      {/* Toast Notifications Stack */}
      <div
        className="fixed top-4 right-4 z-9999 flex flex-col gap-3 max-w-sm w-full pointer-events-none"
        aria-live="assertive"
      >
        {toasts.map((toast) => {
          let accentColor = 'bg-blue-500';
          if (toast.type === 'success') accentColor = 'bg-emerald-500';
          if (toast.type === 'warning') accentColor = 'bg-amber-500';
          if (toast.type === 'error') accentColor = 'bg-rose-500';

          return (
            <div
              key={toast.id}
              className={`w-full flex flex-col p-4 bg-[#1a1a1e]/90 backdrop-blur-md border border-neutral-800/80 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.5)] transition-all duration-300 pointer-events-auto select-none ${
                toast.isExiting ? 'toast-exit' : 'toast-enter'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Accent Icon indicator */}
                <div className={`mt-1.5 w-2 h-2 rounded-full ${accentColor} shrink-0`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white tracking-wide">{toast.title}</h4>
                  <p className="text-xs font-medium text-neutral-400 mt-1 leading-relaxed">
                    {toast.message}
                  </p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-neutral-500 hover:text-white transition-colors duration-200 p-0.5 rounded-lg focus:outline-none"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};
