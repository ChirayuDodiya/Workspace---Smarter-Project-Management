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
import TaskActivityTimelineSkeleton from '../components/TaskDetail/TaskActivityTimelineSkeleton';
import TaskCommentsSkeleton from '../components/TaskDetail/TaskCommentsSkeleton';

export function TaskDetail() {
  const { slug, taskId } = useParams<{ slug: string; taskId: string }>();
  const [task, setTask] = useState<ProjectTask | null>(null);
  const [activityTrigger, setActivityTrigger] = useState(0);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

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
        <div className="max-w-md space-y-6">
          <div className="text-red-400 text-sm font-bold bg-red-950/30 border border-red-500/40 rounded-2xl py-4 px-6 shadow-md">
            {error}
          </div>
          <div className="flex gap-4 justify-center">
            <Link
              to={`/projects/${slug}`}
              className="px-6 py-2.5 bg-[#1e1e1e] hover:bg-[#2d2d2d] border border-[#333] hover:border-zinc-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-md focus:outline-none"
            >
              Back to Project Board
            </Link>
            <button
              onClick={() => setRefreshKey((prev) => prev + 1)}
              className="px-6 py-2.5 bg-[#043314] hover:bg-[#074c1f] border border-white/60 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-[#098032]"
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
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Column - Skeletons */}
          <div className="flex-1 w-full space-y-8 text-left">
            <div className="flex items-center gap-6">
              {/* Back button skeleton */}
              <div className="w-12 h-10 bg-[#043314]/30 border border-white/30 rounded-xl animate-pulse" />
              <h2 className="text-2xl font-bold tracking-wide">Task Details</h2>
            </div>

            <TaskDetailSkeleton />
            <TaskActivityTimelineSkeleton />
          </div>

          {/* Right Column - Comments Skeleton */}
          <div className="w-full lg:w-112.5 pt-0 lg:pt-16">
            <TaskCommentsSkeleton />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-6 text-white min-h-full bg-[#121212] select-none">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column - Task Details */}
        <div className="flex-1 w-full space-y-8 text-left">
          <div className="flex items-center gap-6">
            {/* Back button */}
            <Link
              to={`/projects/${slug}`}
              className="flex items-center justify-center w-12 h-10 bg-[#043314] border border-white hover:bg-[#074c1f] rounded-xl text-white text-xl font-medium tracking-wide transition-colors duration-200 cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-[#098032]"
              title="Back to Project Board"
            >
              &lt;-
            </Link>
            <h2 className="text-2xl font-bold tracking-wide">Task Details</h2>
          </div>

          {task && slug && (
            <>
              <TaskDetailComponent
                key={`${task.id}-${task.title}-${task.description || ''}-${task.due_date || ''}-${task.estimated_hours || ''}-${task.actual_hours || ''}-${task.priority}-${task.assigned_to?.id || ''}`}
                initialTask={task}
                slug={slug}
                onUpdate={(updatedTask) => {
                  setTask(updatedTask);
                  triggerRefresh();
                }}
              />
              <TaskActivityTimeline taskId={task.id} activityTrigger={activityTrigger} />
            </>
          )}
        </div>

        {/* Right Column - Comments */}
        {task && (
          <div className="w-full lg:w-112.5 pt-0 lg:pt-16">
            <TaskComments taskId={task.id} onCommentAdded={triggerRefresh} />
          </div>
        )}
      </div>
    </main>
  );
}

export default TaskDetail;
