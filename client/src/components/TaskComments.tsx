import { useState, useEffect } from 'react';
import api from '../services/api';
import type { TaskComment, User } from '../types';
import { useAuth } from '../hooks/useAuth';

interface TaskCommentsProps {
  taskId: number;
  onCommentAdded?: () => void;
}

interface CommentNodeProps {
  comment: TaskComment;
  onReply: (comment: TaskComment) => void;
  depth?: number;
  currentUser: User | null | undefined;
  onRefresh: () => void;
}

function CommentNode({ comment, onReply, depth = 0, currentUser, onRefresh }: CommentNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [error, setError] = useState<string | null>(null);
  const [isWithin15Mins, setIsWithin15Mins] = useState(false);

  // Sync state if comment body changes from external updates (React 19 pure render state adjustment pattern)
  const [prevBody, setPrevBody] = useState(comment.body);
  if (comment.body !== prevBody) {
    setPrevBody(comment.body);
    setEditBody(comment.body);
  }

  useEffect(() => {
    const createdTime = new Date(comment.created_at).getTime();
    const fifteenMinutesInMs = 15 * 60 * 1000;

    const checkTime = () => {
      const timeElapsed = Date.now() - createdTime;
      setIsWithin15Mins(timeElapsed < fifteenMinutesInMs);
    };

    checkTime();

    const timeRemaining = fifteenMinutesInMs - (Date.now() - createdTime);
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setIsWithin15Mins(false);
      }, timeRemaining);
      return () => clearTimeout(timer);
    }
  }, [comment.created_at]);

  const isOwner = comment.user?.id === currentUser?.id;
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = isOwner && isWithin15Mins;
  const canDelete = isAdmin || (isOwner && isWithin15Mins);

  const handleSave = async () => {
    const trimmedBody = editBody.trim();
    if (!trimmedBody) {
      setError('Comment body cannot be empty');
      return;
    }
    if (trimmedBody === comment.body) {
      setIsEditing(false);
      setError(null);
      return;
    }

    try {
      setError(null);
      const res = await api.put(`/comments/${comment.id}`, { body: trimmedBody });
      if (res.data && res.data.success) {
        setIsEditing(false);
        onRefresh();
      } else {
        setError(res.data?.message || 'Failed to update comment');
      }
    } catch (err) {
      console.error(err);
      const errorResponse = err as { response?: { data?: { message?: string } } };
      setError(errorResponse.response?.data?.message || 'Failed to update comment');
    }
  };

  const handleDelete = async () => {
    try {
      setError(null);
      const res = await api.delete(`/comments/${comment.id}`);
      if (res.data && res.data.success) {
        onRefresh();
      } else {
        setError(res.data?.message || 'Failed to delete comment');
      }
    } catch (err) {
      console.error(err);
      const errorResponse = err as { response?: { data?: { message?: string } } };
      setError(errorResponse.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      void handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditBody(comment.body);
      setError(null);
    }
  };

  return (
    <div className="space-y-2">
      {/* Comment Box */}
      <div
        onDoubleClick={() => onReply(comment)}
        className="group p-3.5 bg-[#121212]/50 border border-white/5 hover:border-emerald-800/40 rounded-2xl transition-colors duration-200 cursor-pointer select-none text-left"
        title="Double-click to reply"
      >
        <div className="flex justify-between items-start text-xs text-gray-400 mb-1">
          <span className="font-semibold text-emerald-400 capitalize">{comment.user.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px]">
              {new Date(comment.created_at).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {canDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDelete();
                }}
                className="text-red-500 hover:text-red-400 transition-colors p-0.5 rounded cursor-pointer"
                title="Delete comment"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-200 wrap-break-word pl-1 flex flex-col items-start gap-1">
          <div className="flex items-start gap-2 w-full">
            {depth > 0 && <span className="text-emerald-500 font-bold shrink-0">-&gt;</span>}
            {isEditing ? (
              <input
                type="text"
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-[#1e1e1e] border border-emerald-700 focus:border-emerald-500 rounded-lg px-2 py-1 text-sm text-white focus:outline-none"
                autoFocus
              />
            ) : (
              <span
                onClick={() => {
                  if (canEdit) {
                    setIsEditing(true);
                  }
                }}
                className={canEdit ? 'cursor-pointer hover:text-emerald-300 transition-colors' : ''}
                title={canEdit ? 'Click to edit comment' : undefined}
              >
                {comment.body}
              </span>
            )}
          </div>
          {error && <span className="text-red-500 text-xs mt-1 block pl-1">{error}</span>}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-4 border-l border-emerald-800/40 space-y-2 ml-2">
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              onReply={onReply}
              depth={depth + 1}
              currentUser={currentUser}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TaskComments({ taskId, onCommentAdded }: TaskCommentsProps) {
  const { user: currentUser } = useAuth();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [replyingTo, setReplyingTo] = useState<TaskComment | null>(null);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/tasks/${taskId}/comments`);
      if (res.data && res.data.success) {
        setComments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  useEffect(() => {
    let active = true;
    const loadComments = async () => {
      try {
        const res = await api.get(`/tasks/${taskId}/comments`);
        if (active && res.data && res.data.success) {
          setComments(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      }
    };

    if (taskId) {
      void loadComments();
    }
    return () => {
      active = false;
    };
  }, [taskId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentBody.trim()) return;

    try {
      const payload = {
        body: newCommentBody.trim(),
        parent_id: replyingTo ? replyingTo.id : null,
      };
      const res = await api.post(`/tasks/${taskId}/comments`, payload);
      if (res.data && res.data.success) {
        setNewCommentBody('');
        setReplyingTo(null);
        await fetchComments();
        if (onCommentAdded) {
          onCommentAdded();
        }
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  return (
    <div className="space-y-2 w-full text-left">
      <h3 className="text-2xl font-bold tracking-wide text-emerald-400">Comments:</h3>

      <div className="bg-[#1e1e1e]/95 border border-white/20 rounded-4xl p-6 shadow-2xl h-150 flex flex-col justify-between">
        {/* Scrollable comment list */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 scrollbar-thin scrollbar-thumb-emerald-950 scrollbar-track-transparent">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <CommentNode
                key={comment.id}
                comment={comment}
                onReply={setReplyingTo}
                currentUser={currentUser}
                onRefresh={async () => {
                  await fetchComments();
                  if (onCommentAdded) {
                    onCommentAdded();
                  }
                }}
              />
            ))
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 italic text-sm">
                No comments yet. Be the first to reply!
              </p>
            </div>
          )}
        </div>

        {/* Comment actions and text input */}
        <div className="space-y-2 mt-auto">
          {replyingTo && (
            <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-800/50 rounded-xl px-4 py-2 text-xs">
              <span className="text-gray-300 truncate">
                Replying to{' '}
                <span className="text-emerald-400 font-semibold">{replyingTo.user?.name}</span>: "
                {replyingTo.body}"
              </span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-gray-500 hover:text-red-400 font-bold focus:outline-none cursor-pointer"
              >
                X
              </button>
            </div>
          )}

          <form onSubmit={handleSubmitComment} className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="type you comment here,double click on comment to reply"
              value={newCommentBody}
              onChange={(e) => setNewCommentBody(e.target.value)}
              className="flex-1 h-11 px-4 bg-[#1e1e1e] border border-[#043314] hover:border-emerald-700 focus:border-emerald-500 focus:outline-none rounded-xl text-white text-xs placeholder-gray-500 transition-colors"
            />
            <button
              type="submit"
              className="w-11 h-11 bg-[#043314] hover:bg-[#074c1f] border border-white text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors duration-200 shadow-md"
            >
              <span className="text-lg font-bold">-&gt;</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TaskComments;
