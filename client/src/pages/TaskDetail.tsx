import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import type { ProjectTask } from '../types';
import TaskDetailComponent from '../components/TaskDetail/TaskDetailComponent';
import TaskComments from '../components/TaskDetail/TaskComments';
import TaskActivityTimeline from '../components/TaskDetail/TaskActivityTimeline';
import { socket } from '../services/socket';
import { useAuth } from '../hooks/useAuth';
import TaskDetailSkeleton from '../components/TaskDetail/TaskDetailSkeleton';
import TaskCommentsSkeleton from '../components/TaskDetail/TaskCommentsSkeleton';

export function TaskDetail() {
  const { slug, taskId } = useParams<{ slug: string; taskId: string }>();
  const [task, setTask] = useState<ProjectTask | null>(null);
  const [activityTrigger, setActivityTrigger] = useState(0);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');

  const triggerRefresh = () => setActivityTrigger((prev) => prev + 1);

  // Fetch task details on mount
  useEffect(() => {
    let active = true;
    const fetchTask = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await api.get(`/tasks/${taskId}`);
        if (active && response.data && response.data.success) {
          setTask(response.data.data);
        }
      } catch (err: unknown) {
        if (active) {
          const axiosError = err as { response?: { data?: { message?: string } } };
          setError(axiosError.response?.data?.message || 'Failed to fetch task details');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    if (taskId) {
      void fetchTask();
    }
    return () => {
      active = false;
    };
  }, [taskId, refreshKey]);

  // Join/leave project room
  useEffect(() => {
    if (slug && user) {
      socket.emit('join:project', { projectSlug: slug, user });
    }
    return () => {
      if (slug) {
        socket.emit('leave:project');
      }
    };
  }, [slug, user]);

  // Listen to task updates in real-time
  useEffect(() => {
    if (!taskId) return;
    const targetTaskId = Number(taskId);

    const handleTaskUpdated = (updatedTask: ProjectTask) => {
      if (updatedTask.id === targetTaskId) {
        setTask(updatedTask);
      }
    };

    socket.on('task:status_changed', handleTaskUpdated);
    socket.on('task:assigned', handleTaskUpdated);

    return () => {
      socket.off('task:status_changed', handleTaskUpdated);
      socket.off('task:assigned', handleTaskUpdated);
    };
  }, [taskId]);

  if (error) {
    return (
      <main className="p-8 text-white min-h-full bg-[#121212] select-none flex flex-col items-center justify-center text-center">
        <div className="max-w-md space-y-5">
          <div className="text-red-300 text-sm font-medium bg-red-950/30 border border-red-500/40 rounded-2xl py-4 px-6">
            {error}
          </div>
          <div className="flex gap-3 justify-center">
            <Link
              to={`/projects/${slug}`}
              className="h-9 px-5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-sm font-semibold transition-all cursor-pointer focus:outline-none"
            >
              Back to Project
            </Link>
            <button
              onClick={() => setRefreshKey((prev) => prev + 1)}
              className="h-9 px-5 bg-[#045c22] hover:bg-[#074c1f] text-white rounded-xl text-sm font-semibold transition-all cursor-pointer focus:outline-none border border-transparent"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading || !task) {
    return (
      <main className="p-4 sm:p-6 text-white min-h-full bg-[#121212] select-none">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* Top bar skeleton */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-800/60 border border-zinc-800 rounded-xl animate-pulse shrink-0" />
            <div className="h-5 bg-zinc-800 rounded-md w-32 animate-pulse" />
          </div>

          <div className="flex flex-col lg:flex-row gap-5 items-start">
            {/* Left: detail skeleton */}
            <div className="flex-1 w-full">
              <TaskDetailSkeleton />
            </div>

            {/* Right: tabbed panel skeleton */}
            <div className="w-full lg:w-96 bg-[#181818] border border-zinc-800/80 rounded-2xl overflow-hidden animate-pulse">
              {/* Tab header skeleton */}
              <div className="flex border-b border-zinc-800 px-4 pt-4 gap-2">
                <div className="h-8 w-24 bg-zinc-800/60 rounded-lg" />
                <div className="h-8 w-24 bg-zinc-800/40 rounded-lg" />
              </div>
              <div className="p-4">
                <TaskCommentsSkeleton />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-6 text-white min-h-full bg-[#121212] select-none">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Top Bar */}
        <div className="flex items-center gap-3">
          <Link
            to={`/projects/${slug}`}
            className="flex items-center justify-center w-9 h-9 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white text-base font-medium transition-all cursor-pointer shadow-sm focus:outline-none shrink-0"
            title="Back to Project Board"
          >
            ←
          </Link>
          <h2 className="text-base font-bold text-white tracking-wide">Task Details</h2>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Left Column — Task Detail Form */}
          <div className="flex-1 w-full text-left">
            {task && slug && (
              <TaskDetailComponent
                key={`${task.id}-${task.title}-${task.description || ''}-${task.due_date || ''}-${task.estimated_hours || ''}-${task.actual_hours || ''}-${task.priority}-${task.assigned_to?.id || ''}`}
                initialTask={task}
                slug={slug}
                onUpdate={(updatedTask) => {
                  setTask(updatedTask);
                  triggerRefresh();
                }}
              />
            )}
          </div>

          {/* Right Column — Tabbed Panel: Comments | Activity */}
          {task && (
            <div className="w-full lg:w-96 bg-[#181818] border border-zinc-800/80 rounded-2xl overflow-hidden">
              {/* Tab Header */}
              <div className="flex border-b border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('comments')}
                  className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer focus:outline-none ${
                    activeTab === 'comments'
                      ? 'text-white border-b-2 border-[#098032] bg-zinc-900/40'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Comments
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('activity')}
                  className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer focus:outline-none ${
                    activeTab === 'activity'
                      ? 'text-white border-b-2 border-[#098032] bg-zinc-900/40'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Activity
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {activeTab === 'comments' ? (
                  <TaskComments taskId={task.id} onCommentAdded={triggerRefresh} />
                ) : (
                  <TaskActivityTimeline taskId={task.id} activityTrigger={activityTrigger} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default TaskDetail;

