import { useState, useEffect } from 'react';
import api from '../../services/api';
import type { TaskComment, User } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { socket } from '../../services/socket';
import TaskCommentsSkeleton from './TaskCommentsSkeleton';

interface TaskCommentsProps {
  taskId: number;
  onCommentAdded?: () => void;
}

// Helper functions for immutable tree updates
const addCommentToTree = (list: TaskComment[], newComment: TaskComment): TaskComment[] => {
  if (!newComment.parent_id) {
    if (list.some((c) => c.id === newComment.id)) return list;
    return [...list, { ...newComment, replies: [] }];
  }
  return list.map((c) => {
    if (c.id === newComment.parent_id) {
      if (c.replies?.some((r) => r.id === newComment.id)) return c;
      return { ...c, replies: [...(c.replies || []), { ...newComment, replies: [] }] };
    }
    if (c.replies && c.replies.length > 0) {
      return { ...c, replies: addCommentToTree(c.replies, newComment) };
    }
    return c;
  });
};

const updateCommentInTree = (
  list: TaskComment[],
  commentId: number,
  updatedBody: string
): TaskComment[] => {
  return list.map((c) => {
    if (c.id === commentId) {
      return { ...c, body: updatedBody };
    }
    if (c.replies && c.replies.length > 0) {
      return { ...c, replies: updateCommentInTree(c.replies, commentId, updatedBody) };
    }
    return c;
  });
};

const deleteCommentFromTree = (list: TaskComment[], commentId: number): TaskComment[] => {
  let repliesToPromote: TaskComment[] = [];
  const filterAndCollect = (items: TaskComment[]): TaskComment[] => {
    return items
      .filter((item) => {
        if (item.id === commentId) {
          repliesToPromote = item.replies || [];
          return false;
        }
        return true;
      })
      .map((item) => {
        if (item.replies && item.replies.length > 0) {
          return { ...item, replies: filterAndCollect(item.replies) };
        }
        return item;
      });
  };

  const updatedList = filterAndCollect(list);
  if (repliesToPromote.length > 0) {
    return [...updatedList, ...repliesToPromote];
  }
  return updatedList;
};

interface CommentNodeProps {
  comment: TaskComment;
  onReply: (comment: TaskComment) => void;
  depth?: number;
  currentUser: User | null | undefined;
  onCommentUpdated: (id: number, body: string) => void;
  onCommentDeleted: (id: number) => void;
  onCommentAdded?: () => void;
}

function CommentNode({
  comment,
  onReply,
  depth = 0,
  currentUser,
  onCommentUpdated,
  onCommentDeleted,
  onCommentAdded,
}: CommentNodeProps) {
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
        onCommentUpdated(comment.id, trimmedBody);
        if (onCommentAdded) {
          onCommentAdded();
        }
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
        onCommentDeleted(comment.id);
        if (onCommentAdded) {
          onCommentAdded();
        }
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
    <div className="space-y-2 w-full text-left">
      <div
        onDoubleClick={() => onReply(comment)}
        className="group p-3 bg-[#121212] border border-zinc-800/60 hover:border-zinc-700 rounded-xl transition-colors duration-150 cursor-pointer select-none"
        title="Double-click to reply"
      >
        <div className="flex justify-between items-start mb-1.5">
          <span className="text-xs font-semibold text-emerald-400 capitalize">{comment.user.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600">
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
                className="text-zinc-700 hover:text-red-400 transition-colors p-0.5 rounded cursor-pointer"
                title="Delete comment"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="text-sm text-zinc-300 pl-0 flex flex-col gap-1">
          <div className="flex items-start gap-1.5 w-full">
            {depth > 0 && <span className="text-emerald-600 font-bold shrink-0 text-xs">↪</span>}
            {isEditing ? (
              <input
                type="text"
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-[#181818] border border-zinc-700 focus:border-[#098032] rounded-lg px-2 py-1 text-sm text-white focus:outline-none"
                autoFocus
              />
            ) : (
              <span
                onClick={() => { if (canEdit) setIsEditing(true); }}
                className={canEdit ? 'cursor-pointer hover:text-emerald-300 transition-colors' : ''}
                title={canEdit ? 'Click to edit' : undefined}
              >
                {comment.body}
              </span>
            )}
          </div>
          {error && <span className="text-red-400 text-xs">{error}</span>}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-4 border-l border-zinc-800 space-y-2 ml-2">
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              onReply={onReply}
              depth={depth + 1}
              currentUser={currentUser}
              onCommentUpdated={onCommentUpdated}
              onCommentDeleted={onCommentDeleted}
              onCommentAdded={onCommentAdded}
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadComments = async () => {
      try {
        setIsLoading(true);
        setError('');
        const res = await api.get(`/tasks/${taskId}/comments`);
        if (active && res.data && res.data.success) {
          setComments(res.data.data);
        }
      } catch (err: unknown) {
        if (active) {
          const axiosError = err as { response?: { data?: { message?: string } } };
          setError(axiosError.response?.data?.message || 'Failed to fetch comments.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    if (taskId) {
      void loadComments();
    }
    return () => {
      active = false;
    };
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;

    const handleCommentAdded = (newComment: TaskComment) => {
      if (newComment.task_id === taskId) {
        setComments((prev) => addCommentToTree(prev, newComment));
        if (onCommentAdded) {
          onCommentAdded();
        }
      }
    };

    const handleCommentUpdated = (updatedComment: TaskComment) => {
      if (updatedComment.task_id === taskId) {
        setComments((prev) => updateCommentInTree(prev, updatedComment.id, updatedComment.body));
        if (onCommentAdded) {
          onCommentAdded();
        }
      }
    };

    const handleCommentDeleted = ({ commentId }: { commentId: number }) => {
      setComments((prev) => deleteCommentFromTree(prev, commentId));
      if (onCommentAdded) {
        onCommentAdded();
      }
    };

    socket.on('comment:added', handleCommentAdded);
    socket.on('comment:updated', handleCommentUpdated);
    socket.on('comment:deleted', handleCommentDeleted);
    return () => {
      socket.off('comment:added', handleCommentAdded);
      socket.off('comment:updated', handleCommentUpdated);
      socket.off('comment:deleted', handleCommentDeleted);
    };
  }, [taskId, onCommentAdded]);

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
        setComments((prev) => addCommentToTree(prev, res.data.data));
        if (onCommentAdded) {
          onCommentAdded();
        }
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  if (isLoading) {
    return <TaskCommentsSkeleton />;
  }

  if (error) {
    return (
      <div className="text-red-300 text-sm font-medium py-6 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="h-120 sm:h-140 flex flex-col">
      {/* Scrollable comment list */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              onReply={setReplyingTo}
              currentUser={currentUser}
              onCommentUpdated={(id, body) => {
                setComments((prev) => updateCommentInTree(prev, id, body));
              }}
              onCommentDeleted={(id) => {
                setComments((prev) => deleteCommentFromTree(prev, id));
              }}
              onCommentAdded={onCommentAdded}
            />
          ))
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-zinc-600 italic text-sm">No comments yet. Be the first!</p>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="space-y-2 mt-auto pt-3 border-t border-zinc-800">
        {replyingTo && (
          <div className="flex items-center justify-between bg-emerald-950/30 border border-emerald-800/40 rounded-xl px-3 py-2 text-xs">
            <span className="text-zinc-400 truncate">
              Replying to{' '}
              <span className="text-emerald-400 font-semibold">{replyingTo.user?.name}</span>:{' '}
              "{replyingTo.body}"
            </span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-zinc-600 hover:text-red-400 font-bold focus:outline-none cursor-pointer ml-2 shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmitComment} className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Write a comment… double-click to reply"
            value={newCommentBody}
            onChange={(e) => setNewCommentBody(e.target.value)}
            className="flex-1 h-10 px-3 bg-[#121212] border border-zinc-800 hover:border-zinc-700 focus:border-[#098032] focus:outline-none rounded-xl text-white text-xs placeholder-zinc-600 transition-all"
          />
          <button
            type="submit"
            className="w-10 h-10 bg-[#045c22] hover:bg-[#074c1f] text-white rounded-xl flex items-center justify-center cursor-pointer transition-all shadow-sm border border-transparent shrink-0"
          >
            <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default TaskComments;
