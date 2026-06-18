const serializeUser = (user) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar_url: user.avatar_url,
    is_active: user.is_active,
    deleted_at: user.deleted_at,
    created_at: user.createdAt,
  };
};

export { serializeUser };
