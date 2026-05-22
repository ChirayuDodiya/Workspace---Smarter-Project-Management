const ProjectPolicy = {
  canCreate(req, res, next) {
    const user = req.user;

    if (user?.role === 'admin' || user?.role === 'manager') {
      return next();
    }

    return res.status(403).json({
      message: 'You are not authorized to create a project.',
    });
  },

  canUpdate(req, res, next) {
    const user = req.user;
    const project = req.project;

    if (
      user?.role === 'admin' ||
      project?.owner_id === user?.id
    ) {
      return next();
    }

    return res.status(403).json({
      message: 'You are not authorized to update this project.',
    });
  },

  canDelete(req, res, next) {
    const user = req.user;

    if (user?.role === 'admin') {
      return next();
    }

    return res.status(403).json({
      message: 'You are not authorized to delete this project.',
    });
  },
};

export { ProjectPolicy };