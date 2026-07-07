# Features

A detailed walkthrough of every feature in the Workspace - Smarter Project Management application — what it does, who can use it, and how it works under the hood.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Dashboard](#2-dashboard)
3. [Project Management](#3-project-management)
4. [Kanban Task Board](#4-kanban-task-board)
5. [Task Management](#5-task-management)
6. [Threaded Comments](#6-threaded-comments)
7. [Activity Timeline](#7-activity-timeline)
8. [Team Members](#8-team-members)
9. [Project Statistics](#9-project-statistics)
10. [Real-Time Collaboration](#10-real-time-collaboration)
11. [Live Presence](#11-live-presence)
12. [Toast Notifications](#12-toast-notifications)
13. [CSV Export](#13-csv-export)
14. [User Management (Admin)](#14-user-management-admin)
15. [Rate Limiting](#15-rate-limiting)
16. [HTTP Caching (ETag)](#16-http-caching-etag)

---

## 1. Authentication

### What it does
Handles user registration, login, session management, and silent token refresh — all without storing anything in `localStorage`.

### Who can use it
All users (unauthenticated access required for register and login).

### How it works

| Action | Endpoint | Notes |
|---|---|---|
| Register | `POST /auth/register` | Validates name, email format, and password strength via Zod |
| Login | `POST /auth/login` | Returns two HTTPOnly cookies: `accessToken` (short-lived) and `refreshToken` (long-lived) |
| Logout | `POST /auth/logout` | Clears both cookies server-side |
| Get Profile | `GET /auth/me` | Returns the current user's data from the JWT + DB lookup |
| Refresh | `POST /auth/refresh` | Issues a new `accessToken` using the `refreshToken` cookie silently |

**Token Refresh Flow (Client):**
The Axios interceptor in [`client/src/services/api.ts`](../client/src/services/api.ts) catches any `401 Unauthorized` response, automatically calls `POST /auth/refresh`, and retries the original failed request — the user never sees a login page mid-session. If the refresh also fails, the user is redirected to `/login`.

**Route Guards (Client):**
- `PublicRoute` — blocks authenticated users from visiting `/login` or `/register` (redirects to `/`).
- `ProtectedRoute` — blocks unauthenticated users from all application pages (redirects to `/login`).

---

## 2. Dashboard

### What it does
The main landing page after login. Shows workspace-wide statistics at the top and a paginated, filterable list of all projects below.

### Who can use it
All authenticated users.

### Features

**Statistics Bar:**
Three cards fetched from `GET /dashboard/stats` showing:
- **Active Tasks** — total tasks assigned to the current user with status `todo`, `in_progress`, or `in_review`.
- **Overdue Tasks** — tasks assigned to the user where `due_date < today` and not yet `done`.
- **Completed This Week** — tasks the user marked `done` within the current week.

**Project List:**
- Displays project cards in a responsive 2-column grid.
- **Search** — debounced text input (400 ms delay) searches projects by name via `GET /projects?search=`.
- **Status Filter** — dropdown to filter by `planning`, `active`, `on_hold`, `completed`, or `archived`.
- **Infinite Scroll Pagination** — a "See More" button appends the next page of results without resetting the list.
- **Skeleton Loaders** — `ProjectCardSkeleton` placeholders appear during every fetch, avoiding layout shift.

**Add Project:**
Admins and managers see an "Add Project" button that opens `AddProjectModal`, allowing creation of a new project with name, description, start/end date, budget, and status.

---

## 3. Project Management

### What it does
Full lifecycle management of projects — create, view, update, delete, and archive.

### Who can use it

| Action | Required Role |
|---|---|
| View / list projects | Any authenticated user |
| Create project | Admin or Manager |
| Update project | Admin or project owner (Manager) |
| Delete project | Admin only |

### Features

**Project Card (Dashboard):**
Each card displays the project name, slug, status badge, owner, date range, budget, and task completion progress bar (completed / total tasks).

**Project Detail Page (`/projects/:slug`):**
Clicking a project card navigates to its detail page which loads:
1. `ProjectDetailsCard` — editable project metadata (name, description, status, dates, budget).
2. `ProjectStats` — aggregate task breakdown.
3. `KanbanBoard` — the full task Kanban board for the project.
4. `ProjectMembersModal` — team member management.

**Update Project:**
Owners and admins can edit the project inline inside `ProjectDetailsCard`. Fields are validated and sent via `PUT /projects/:slug`.

**Delete Project:**
Admins can soft-delete a project from the project card on the dashboard. This sets `deleted_at` on the project and cascades to all its tasks via the database FK constraint.

**Slug-Based Routing:**
Projects are identified by a URL-friendly `slug` (auto-generated from the project name). Slugs can be updated, and the URL in the browser updates accordingly.

---

## 4. Kanban Task Board

### What it does
A drag-and-drop board with four columns — **Todo**, **In Progress**, **In Review**, **Done** — showing all tasks for a project organized by status.

### Who can use it
All team members of the project.

### Features

**Four Status Columns:**
Each column loads tasks independently and in parallel via `GET /projects/:slug/tasks?status=<status>` (5 tasks per page, sorted by `sort_order`).

**Per-Column Pagination:**
Each column has its own "See More" link that loads additional tasks into that column without affecting others.

**Drag-and-Drop:**
Built with `@dnd-kit/react`. Cards can be dragged:
- **Within a column** — reorders tasks; persisted via `POST /tasks/reorder`.
- **Across columns** — changes the task's status; persisted via `PATCH /tasks/:id/status`.

**Status Transition Rules:**
Tasks can only move **one step forward** in the pipeline (`todo` → `in_progress` → `in_review` → `done`). Skipping steps (e.g. `todo` → `done`) is blocked with an error message and the card is reverted.

**Actual Hours Popup:**
When a task is dragged into the **Done** column, a popup (`ActualHoursPopUp`) appears asking the user to enter how many actual hours were spent. This value is saved alongside the status change. Cancelling the popup reverts the drag.

**Real-Time Board Updates:**
The board listens to Socket.io events and updates instantly without a page refresh:

| Event | Board reaction |
|---|---|
| `task:created` | Card appears at the top of the correct column |
| `task:updated` | Card is updated in-place |
| `task:status_changed` | Card moves to the new column |
| `task:assigned` | Card is updated in-place |
| `task:deleted` | Card disappears from its column |

**Task Search:**
A search bar above the board filters task cards across all columns simultaneously by title.

---

## 5. Task Management

### What it does
Full CRUD for tasks, plus assignment and status transitions.

### Who can use it

| Action | Required Role |
|---|---|
| View task | Any project team member |
| Create task | Any project team member (policy-gated) |
| Update task fields | Any project team member |
| Change status | Any project team member |
| Assign task | Any project team member |
| Delete task | Admin or task owner |

### Features

**Create Task:**
Via the "Add Task" button on the Kanban board, opening `AddTaskModal`. Fields include title, description, priority, assignee, due date, and estimated hours. Only the title is required.

**Task Detail Page (`/projects/:slug/tasks/:taskId`):**
Full view of a single task including:
- All editable fields (title, description, status, priority, assignee, due date, hours).
- Comment thread.
- Activity timeline.

**Update Task:**
Any field can be edited inline on the task detail page and saved via `PUT /tasks/:id`.

**Assign Task:**
The assignee dropdown on the task detail page sends `PATCH /tasks/:id/assign`. The previous assignee receives a real-time "reassigned" notification and the new assignee receives an "assigned" notification.

**Delete Task:**
Soft-deletes the task via `DELETE /tasks/:id`. The task disappears from the board for all users in real time via the `task:deleted` Socket.io event.

**Reorder Tasks:**
Drag-and-drop reordering within a column sends a batch `POST /tasks/reorder` payload with the updated `sort_order` for all affected cards.

---

## 6. Threaded Comments

### What it does
A comment thread on each task supporting nested replies.

### Who can use it
All authenticated users who can view the task.

### Features

- **Post Comment** — `POST /tasks/:id/comments` with a `body` field.
- **Reply to Comment** — supply `parent_id` to nest the reply under another comment. Replies are visually indented.
- **Edit Comment** — `PUT /comments/:id`. Only the comment author can edit (enforced by policy).
- **Delete Comment** — `DELETE /comments/:id`. Soft-deletes the comment; replies remain (their `parent_id` becomes `NULL` in the DB, though they are still displayed).
- **Real-Time** — `comment:added`, `comment:updated`, and `comment:deleted` Socket.io events update the comment thread live for all users viewing the same task.
- **Comment Notifications** — when a comment is added to a task, the task's assignee receives a toast notification (if they are not the one commenting).

---

## 7. Activity Timeline

### What it does
A chronological audit log showing every significant action taken on a task — creation, status changes, assignments, and comments.

### Who can use it
All authenticated users who can view the task.

### Features

- Fetched via `GET /tasks/:id/activities`.
- Each entry includes the acting user, the action performed, and a timestamp.
- The timeline covers both `task`-type logs and `comment`-type logs (threaded together in chronological order).
- Entries are created server-side by `createActivityLog()` in [`activity.service.js`](../server/src/services/activity.service.js) whenever a mutation occurs.
- Displayed in descending chronological order (newest first).

---

## 8. Team Members

### What it does
Manages which users are assigned to a project as team members.

### Who can use it

| Action | Required Role |
|---|---|
| View team | Any project team member |
| Add member | Admin or project owner |
| Remove member | Admin or project owner |

### Features

- Accessible via the "Team" button on the project detail page, opening `ProjectMembersModal`.
- **View Members** — `GET /projects/:slug/team-members` lists all active team members.
- **Add Member** — search existing users by name/email and add them via `POST /projects/:slug/team-members`. Only users who are not already members are shown.
- **Remove Member** — remove a user from the team via `DELETE /projects/:slug/team-members/:userId`.
- Members use soft deletes (`deleted_at`), so they can be re-added without duplicate record issues.

---

## 9. Project Statistics

### What it does
An aggregated view of all tasks in a project, broken down by status and hours.

### Who can use it
All authenticated users.

### Features

Displayed in the `ProjectStats` component on the project detail page. Fetched from `GET /projects/:slug/stats`.

| Stat | Description |
|---|---|
| Task count by status | Number of tasks in each of the four status columns |
| Total tasks | Total non-deleted task count |
| Total hours logged | Sum of `actual_hours` across all tasks |
| Overdue count | Tasks with `due_date < today` and status ≠ `done` |

**Caching:** Stats are cached in Redis under the key `project:stats:<slug>` for **24 hours**. The cache is automatically invalidated whenever a task is created, updated, deleted, or its status is changed.

---

## 10. Real-Time Collaboration

### What it does
Keeps all users viewing the same project board in sync automatically — no page refresh required.

### How it works

When a user opens a project, the client joins the Socket.io room `project:<slug>`. Any mutation in a controller calls a broadcast helper from [`socket.service.js`](../server/src/services/socket.service.js), which emits the event to everyone in that room.

**Broadcast Events:**

| Event | Triggered By | Payload |
|---|---|---|
| `task:created` | New task created | Full task object |
| `task:updated` | Task fields edited | Updated task object |
| `task:status_changed` | Status changed via drag or PATCH | Updated task object |
| `task:assigned` | Assignee changed | Updated task object |
| `task:deleted` | Task soft-deleted | `{ taskId }` |
| `comment:added` | New comment posted | Comment object |
| `comment:updated` | Comment edited | Updated comment object |
| `comment:deleted` | Comment deleted | `{ commentId }` |

**Personal Notifications:**
Outside the project room, each user is subscribed to `user:<id>` — a private channel for targeted notifications (task assigned, reassigned, or commented on).

---

## 11. Live Presence

### What it does
Shows a live list of which team members are currently viewing the same project board.

### How it works

Tracked server-side in an in-memory `Map<projectSlug, Map<userId, { user, socketIds: Set }>>` in [`index.js`](../server/index.js).

- When a user opens a project, the client emits `join:project` with the user's profile.
- The server adds them to the project's presence map and broadcasts `project:presence` (the current member list) to the whole room.
- When a user leaves or closes the tab, the server handles `leave:project` and `disconnect`, removes them from the map, and re-broadcasts the updated list.
- Multiple browser tabs from the same user are tracked via a `Set` of socket IDs — the user only disappears from presence when **all** their tabs are closed.

---

## 12. Toast Notifications

### What it does
Displays in-app toast messages in the top-right corner for real-time events that affect the current user.

### How it works

The `NotificationProvider` context wraps the entire app and listens to the `task:assigned_notification` Socket.io event on the personal `user:<id>` room.

| Trigger | Toast Type | Message |
|---|---|---|
| Task assigned to you | `success` (green) | "Task `<title>` has been assigned to you by `<name>`." |
| Task reassigned away from you | `warning` (amber) | "Task `<title>` has been reassigned to `<new assignee>` by `<name>`." |
| Comment added to your task | `info` (blue) | "New comment added to your task `<title>` by `<name>`." |
| Status changed on your task | `success` (green) | "Task `<title>` status changed to `<status>` by `<name>`." |

Toasts **auto-dismiss after 6 seconds** with an exit animation. Users can also manually dismiss them. Each toast links to the task if a `projectSlug` and `taskId` are provided.

---

## 13. CSV Export

### What it does
Exports all tasks of a project as a downloadable CSV file.

### Who can use it
All authenticated users.

### How it works

The "Export Tasks" button on the project card triggers `GET /projects/:slug/export-tasks`. The server uses the `json2csv` library to convert the task data into CSV format and responds with:
```
Content-Type: text/csv
Content-Disposition: attachment; filename="<slug>-tasks.csv"
```

The browser automatically prompts a file download.

---

## 14. User Management (Admin)

### What it does
Gives admins full control over user accounts — role assignment, account deactivation, soft deletion, and restoration.

### Who can use it
Admin role only (enforced by backend policy).

### Features

Accessible via `/change-role` (linked from the Navbar for admins only).

| Action | Endpoint | Description |
|---|---|---|
| List users | `GET /users` | Paginated list with search; includes deleted users |
| Update role | `PUT /users/:id/role` | Change a user's role to `admin`, `manager`, or `developer` |
| Toggle active | `PUT /users/:id/toggle-active` | Enable or disable a user's ability to log in (`is_active`) |
| Soft delete | `DELETE /users/:id` | Sets `deleted_at`; user can no longer log in |
| Restore | `POST /users/:id/restore` | Clears `deleted_at`; re-enables the account |

**Self-Protection:** Admins cannot change their own role or deactivate themselves (enforced by the frontend, with guards in the policy layer on the backend).

---

## 15. Rate Limiting

### What it does
Protects the API from abuse by limiting how many requests can be made within a 60-second window.

### How it works

Implemented in [`rateLimiter.middleware.js`](../server/src/middlewares/rateLimiter.middleware.js) using Redis counters:

| User Type | Identifier | Limit | Window |
|---|---|---|---|
| Authenticated | `user:<id>` (from JWT) | 100 requests | 60 seconds |
| Guest / No token | `ip:<ip-address>` | 20 requests | 60 seconds |

Standard rate-limit headers are set on every response:
- `X-RateLimit-Limit` — maximum requests allowed
- `X-RateLimit-Remaining` — requests remaining in current window
- `X-RateLimit-Reset` — UNIX timestamp when the window resets

If the limit is exceeded, the server responds with `429 Too Many Requests`.

> Rate limiting is automatically disabled when `NODE_ENV=test` or when Redis is unavailable, so it never interferes with the test suite or development without Redis.

---

## 16. HTTP Caching (ETag)

### What it does
Reduces unnecessary data transfer by allowing browsers and API clients to skip re-downloading unchanged responses.

### How it works

The `etagMiddleware` (applied to all `GET` routes) intercepts `res.send()` and:
1. Computes a hash (ETag) of the response body.
2. Sets the `ETag` response header.
3. If the client sends `If-None-Match` with a matching ETag, the server returns **`304 Not Modified`** with an empty body instead.

This is applied to resource-heavy endpoints like project lists, task lists, project details, and dashboard stats — saving bandwidth on repeated requests for unchanged data.
