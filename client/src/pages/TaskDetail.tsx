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
import TaskRAG from '../components/TaskDetail/TaskRAG';

export function TaskDetail() {
  const { slug, taskId } = useParams<{ slug: string; taskId: string }>();
  const [task, setTask] = useState<ProjectTask | null>(null);
  const [activityTrigger, setActivityTrigger] = useState(0);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'comments' | 'activity' | 'ai'>('comments');

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
                <button
                  type="button"
                  onClick={() => setActiveTab('ai')}
                  className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer focus:outline-none flex items-center justify-center gap-1.5 ${
                    activeTab === 'ai'
                      ? 'text-white border-b-2 border-[#098032] bg-zinc-900/40'
                      : 'text-[#098032] hover:text-[#0b9c3d] bg-[#045c22]/10 hover:bg-[#045c22]/20'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z" clipRule="evenodd" />
                  </svg>
                  Ask AI
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {activeTab === 'comments' ? (
                  <TaskComments taskId={task.id} onCommentAdded={triggerRefresh} />
                ) : activeTab === 'activity' ? (
                  <TaskActivityTimeline taskId={task.id} activityTrigger={activityTrigger} />
                ) : (
                  <TaskRAG taskId={task.id} />
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

