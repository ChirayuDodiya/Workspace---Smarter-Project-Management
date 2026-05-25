-- CreateIndex
CREATE INDEX `idx_comments_task_deleted` ON `comments`(`task_id`, `deleted_at`);

-- CreateIndex
CREATE INDEX `idx_projects_deleted_status` ON `projects`(`deleted_at`, `status`);

-- CreateIndex
CREATE INDEX `idx_projects_deleted_owner` ON `projects`(`deleted_at`, `owner_id`);

-- CreateIndex
CREATE INDEX `idx_tasks_project_deleted_status` ON `tasks`(`project_id`, `deleted_at`, `status`);

-- CreateIndex
CREATE INDEX `idx_tasks_deleted_assigned_status` ON `tasks`(`deleted_at`, `assigned_to`, `status`);

-- CreateIndex
CREATE INDEX `idx_tasks_deleted_status_priority` ON `tasks`(`deleted_at`, `status`, `priority`);
