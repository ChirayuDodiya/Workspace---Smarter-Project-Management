import { serializeUser } from './user.serializer.js';

const serializeComment = (comment) => {
  return {
    id: comment.id,
    body: comment.body,
    user: serializeUser(comment.user),
    parent_id: comment.parent_id,
    created_at: comment.created_at,
  };
};

export { serializeComment };
