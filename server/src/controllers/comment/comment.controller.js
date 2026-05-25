import { successResponse, errorResponse } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import prisma from '../../prisma/client.js';
import { serializeComment } from '../../serializers/comment.serializer.js';

// PUT: /api/v1/comments/{id} — Edit own comment only (within 15 minutes)
const updateComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const commentId = Number(id);
  if (Number.isNaN(commentId)) {
    return errorResponse(res, 'Invalid comment ID', 400);
  }

  const comment = await prisma.comments.findFirst({
    where: { id: commentId, deleted_at: null },
  });

  if (!comment) {
    return errorResponse(res, 'Comment not found', 404);
  }

  if (comment.user_id !== req.user.id) {
    return errorResponse(res, 'You are not authorized to edit this comment', 403);
  }

  const createdAtTime = new Date(comment.created_at || comment.createdAt).getTime();
  const elapsedMinutes = (Date.now() - createdAtTime) / 1000 / 60;
  if (elapsedMinutes > 15) {
    return errorResponse(res, 'Comment can only be edited within 15 minutes of creation', 400);
  }

  const { body } = req.body;

  const updatedComment = await prisma.comments.update({
    where: { id: commentId },
    data: { body },
    include: { users: true },
  });

  return successResponse(
    res,
    serializeComment({ ...updatedComment, user: updatedComment.users }),
    'Comment updated successfully'
  );
});

// DELETE: /api/v1/comments/{id} — Soft delete own comment or any as admin
const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const commentId = Number(id);
  if (Number.isNaN(commentId)) {
    return errorResponse(res, 'Invalid comment ID', 400);
  }

  const comment = await prisma.comments.findFirst({
    where: { id: commentId, deleted_at: null },
  });

  if (!comment) {
    return errorResponse(res, 'Comment not found', 404);
  }

  const isOwner = comment.user_id === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    return errorResponse(res, 'You are not authorized to delete this comment', 403);
  }

  await prisma.comments.update({
    where: { id: commentId },
    data: { deleted_at: new Date() },
  });

  return successResponse(res, null, 'Comment deleted successfully');
});

export { updateComment, deleteComment };
