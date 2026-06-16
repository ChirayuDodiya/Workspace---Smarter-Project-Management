import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import type { ProjectTask } from '../types';
import TaskDetailComponent from '../components/TaskDetail/TaskDetailComponent';
import TaskComments from '../components/TaskDetail/TaskComments';
import TaskActivityTimeline from '../components/TaskDetail/TaskActivityTimeline';
import { socket } from '../services/socket';
import { useAuth } from '../hooks/useAuth';

export function TaskDetail() {
  const { slug, taskId } = useParams<{ slug: string; taskId: string }>();
  const [task, setTask] = useState<ProjectTask | null>(null);
  const [activityTrigger, setActivityTrigger] = useState(0);
  const { user } = useAuth();

  const triggerRefresh = () => setActivityTrigger((prev) => prev + 1);

  // Fetch task details on mount
  useEffect(() => {
    let active = true;
    const fetchTask = async () => {
      try {
        const response = await api.get(`/tasks/${taskId}`);
        if (active && response.data && response.data.success) {
          setTask(response.data.data);
        }
      } catch {
        // skip error
      }
    };

    if (taskId) {
      void fetchTask();
    }
    return () => {
      active = false;
    };
  }, [taskId]);

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

  return (
    <main className="p-6 text-white min-h-full bg-[#121212] select-none">
      <div className="max-w-6xl mx-auto flex gap-8 items-start">
        {/* Left Column - Task Details */}
        <div className="flex-1 space-y-8 text-left">
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
          <div className="w-112.5 pt-16">
            <TaskComments taskId={task.id} onCommentAdded={triggerRefresh} />
          </div>
        )}
      </div>
    </main>
  );
}

export default TaskDetail;
