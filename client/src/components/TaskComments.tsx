import { useState, useEffect } from 'react';
import api from '../services/api';
import type { TaskComment } from '../types';

interface TaskCommentsProps {
  taskId: number;
}

interface CommentNodeProps {
  comment: TaskComment;
  onReply: (comment: TaskComment) => void;
  depth?: number;
}

function CommentNode({ comment, onReply, depth = 0 }: CommentNodeProps) {
  return (
    <div className="space-y-2">
      {/* Comment Box */}
      <div
        onDoubleClick={() => onReply(comment)}
        className="group p-3.5 bg-[#121212]/50 border border-white/5 hover:border-emerald-800/40 rounded-2xl transition-colors duration-200 cursor-pointer select-none text-left"
        title="Double-click to reply"
      >
        <div className="flex justify-between items-start text-xs text-gray-400 mb-1">
          <span className="font-semibold text-emerald-400 capitalize">
            {comment.user.name}
          </span>
          <span className="text-[10px]">
            {new Date(comment.created_at).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className="text-sm text-gray-200 wrap-break-word pl-1 flex items-start gap-2">
          {depth > 0 && <span className="text-emerald-500 font-bold shrink-0">-&gt;</span>}
          <span>{comment.body}</span>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-4 border-l border-emerald-800/40 space-y-2 ml-2">
          {comment.replies.map((reply) => (
            <CommentNode key={reply.id} comment={reply} onReply={onReply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TaskComments({ taskId }: TaskCommentsProps) {
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
              <CommentNode key={comment.id} comment={comment} onReply={setReplyingTo} />
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
