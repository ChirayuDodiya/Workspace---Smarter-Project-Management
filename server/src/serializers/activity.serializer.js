import { serializeUser } from './user.serializer.js';

const serializeActivity = (log) => {
  return {
    id: log.id,
    subject_type: log.subject_type,
    subject_id: log.subject_id,
    action: log.action,
    properties: log.properties,
    created_at: log.created_at,
    user: log.users ? serializeUser(log.users) : log.user ? serializeUser(log.user) : null,
  };
};

export { serializeActivity };
