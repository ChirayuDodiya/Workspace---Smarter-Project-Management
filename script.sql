CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'developer') NOT NULL DEFAULT 'developer',
    avatar_url VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NULL,
    status ENUM('planning','active','on_hold','completed','archived') NOT NULL DEFAULT 'planning',
    owner_id INT UNSIGNED NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    budget DECIMAL(10,2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    -- even if owner is deleted, project will still exist
    CONSTRAINT fk_project_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status ENUM('todo','in_progress','in_review','done') NOT NULL DEFAULT 'todo',
    priority ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
    assigned_to INT UNSIGNED NULL,
    due_date DATE NULL,
    estimated_hours DECIMAL(5,1) NULL,
    actual_hours DECIMAL(5,1) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    -- if project is deleted then task will also be deleted
    CONSTRAINT fk_task_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    -- even if assigned user is deleted, task will still exist
    CONSTRAINT fk_task_assigned_user FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS comments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    task_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    body TEXT NOT NULL,
    parent_id INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    -- if task is deleted then comment will also be deleted
    CONSTRAINT fk_comment_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    -- if user is deleted then comment will also be deleted
    CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    -- even if parent is deleted, comment will still exist
    CONSTRAINT fk_comment_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    subject_type VARCHAR(255) NOT NULL,
    subject_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NULL,
    action VARCHAR(255) NOT NULL,
    properties JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- even if user is deleted, activity log will still exist
    CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS team_members (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    -- if project is deleted then team member will also be deleted
    CONSTRAINT fk_team_members_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    -- if user is deleted then team member will also be deleted
    CONSTRAINT fk_team_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- composite indexes
CREATE INDEX idx_projects_deleted_status ON projects(deleted_at, status);
CREATE INDEX idx_projects_deleted_owner ON projects(deleted_at, owner_id);

CREATE INDEX idx_tasks_project_deleted_status ON tasks(project_id, deleted_at, status);
CREATE INDEX idx_tasks_deleted_assigned_status ON tasks(deleted_at, assigned_to, status);
CREATE INDEX idx_tasks_deleted_status_priority ON tasks(deleted_at, status, priority);

CREATE INDEX idx_comments_task_deleted ON comments(task_id, deleted_at);

CREATE INDEX idx_team_members_project ON team_members(project_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);


-- seeder generator
INSERT INTO users (name, email, password, role) VALUES
    ('admin1','admin1@gmail.com','adminpassword1','admin'),
    ('admin2','admin2@gmail.com','adminpassword2','admin'),
    ('admin3','admin3@gmail.com','adminpassword3','admin'),
    ('manager1','manager1@gmail.com','managerpassword1','manager'),
    ('manager2','manager2@gmail.com','managerpassword2','manager'),
    ('manager3','manager3@gmail.com','managerpassword3','manager'),
    ('developer1','developer1@gmail.com','developerpassword1','developer'),
    ('developer2','developer2@gmail.com','developerpassword2','developer'),
    ('developer3','developer3@gmail.com','developerpassword3','developer');
    
INSERT INTO projects (name, slug, description, status, owner_id, start_date, end_date, budget) VALUES
    ('Project 1', 'project-1', 'Description 1', 'planning', 4, '2027-01-01', '2027-02-01', 100000.00),
    ('Project 2', 'project-2', 'Description 2', 'active', 5, '2027-01-01', '2027-03-01', 200000.00),
    ('Project 3', 'project-3', 'Description 3', 'on_hold', 6, '2027-02-01', '2027-03-01', 300000.00),
    ('Project 4', 'project-4', 'Description 4', 'completed', 4, '2027-03-01', '2027-05-01', 400000.00),
    ('Project 5', 'project-5', 'Description 5', 'archived', 5, '2027-04-01', '2027-06-01', 500000.00);

INSERT INTO tasks (project_id, title, description, status, priority, assigned_to, due_date, estimated_hours, actual_hours, sort_order) VALUES
    (1, 'Task 1', 'Description 1', 'todo', 'low', 7, '2027-01-14', 10.0, 5.0, 0),
    (1, 'Task 2', 'Description 2', 'in_progress', 'medium', 8, '2027-02-15', 20.0, 10.0, 1),
    (1, 'Task 3', 'Description 3', 'in_review', 'high', 9, '2027-02-16', 30.0, 15.0, 2),
    (1, 'Task 4', 'Description 4', 'done', 'critical', 7, '2027-02-17', 40.0, 20.0, 3),
    (1, 'Task 5', 'Description 5', 'todo', 'low', 8, '2027-02-01', 50.0, 25.0, 4),

    (2, 'Task 6', 'Description 6', 'todo', 'low', 9, '2027-01-15', 10.0, 5.0, 0),
    (2, 'Task 7', 'Description 7', 'in_progress', 'medium', 7, '2027-01-16', 20.0, 10.0, 1),
    (2, 'Task 8', 'Description 8', 'in_review', 'high', 8, '2027-01-17', 30.0, 15.0, 2),
    (2, 'Task 9', 'Description 9', 'done', 'critical', 9, '2027-01-18', 40.0, 20.0, 3),
    (2, 'Task 10', 'Description 10', 'todo', 'low', 7, '2027-03-01', 50.0, 25.0, 4),

    (3, 'Task 11', 'Description 11', 'todo', 'low', 8, '2027-02-19', 10.0, 5.0, 0),
    (3, 'Task 12', 'Description 12', 'in_progress', 'medium', 9, '2027-02-20', 20.0, 10.0, 1),
    (3, 'Task 13', 'Description 13', 'in_review', 'high', 7, '2027-02-21', 30.0, 15.0, 2),
    (3, 'Task 14', 'Description 14', 'done', 'critical', 8, '2027-02-22', 40.0, 20.0, 3),
    (3, 'Task 15', 'Description 15', 'todo', 'low', 9, '2027-03-01', 50.0, 25.0, 4),

    (4, 'Task 16', 'Description 16', 'todo', 'low', 7, '2027-04-01', 10.0, 5.0, 0),
    (4, 'Task 17', 'Description 17', 'in_progress', 'medium', 8, '2027-04-02', 20.0, 10.0, 1),
    (4, 'Task 18', 'Description 18', 'in_review', 'high', 9, '2027-04-03', 30.0, 15.0, 2),
    (4, 'Task 19', 'Description 19', 'done', 'critical', 7, '2027-04-04', 40.0, 20.0, 3),
    (4, 'Task 20', 'Description 20', 'todo', 'low', 8, '2027-04-05', 50.0, 25.0, 4),

    (5, 'Task 21', 'Description 21', 'todo', 'low', 9, '2027-05-01', 10.0, 5.0, 0),
    (5, 'Task 22', 'Description 22', 'in_progress', 'medium', 7, '2027-05-02', 20.0, 10.0, 1),
    (5, 'Task 23', 'Description 23', 'in_review', 'high', 8, '2027-05-03', 30.0, 15.0, 2),
    (5, 'Task 24', 'Description 24', 'done', 'critical', 9, '2027-05-04', 40.0, 20.0, 3),
    (5, 'Task 25', 'Description 25', 'todo', 'low', 7, '2027-05-05', 50.0, 25.0, 4);

INSERT INTO comments (task_id, user_id, body, parent_id) VALUES
    (1, 1, 'Comment 1', NULL),
    (1, 2, 'Comment 2', 1),
    (1, 3, 'Comment 3', 2),
    (2, 1, 'Comment 4', NULL),
    (2, 2, 'Comment 5', 4),
    (2, 3, 'Comment 6', 5),
    (3, 1, 'Comment 7', NULL),
    (3, 2, 'Comment 8', 7),
    (3, 3, 'Comment 9', 8),
    (4, 1, 'Comment 10', NULL),
    (4, 2, 'Comment 11', 10),
    (4, 3, 'Comment 12', 11),
    (5, 1, 'Comment 13', NULL),
    (5, 2, 'Comment 14', 13),
    (5, 3, 'Comment 15', 14);

INSERT INTO team_members (project_id, user_id) VALUES
    (1, 7),
    (1, 8),
    (1, 9),
    (2, 7),
    (2, 8),
    (2, 9),
    (3, 7),
    (3, 8),
    (3, 9);