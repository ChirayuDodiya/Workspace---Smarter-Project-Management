# Postman API Collection Guide

This directory contains the Postman collection and environment files for the Project Manager API. Follow this guide to set up, authenticate, and start testing the endpoints.

## Files Included

* **`projectManager.postman_collection.json`**: Contains all the API routes organized by resources (auth, projects, tasks, comments, users, dashboard).
* **`projectManager.postman_environment.json`**: Pre-configured environment variables (specifically `pm` for the base URL).

---

## Setup Instructions

### 1. Import Files into Postman
1. Open Postman.
2. Click the **Import** button in the top-left or sidebar.
3. Select and upload both files:
   * [projectManager.postman_collection.json](./projectManager.postman_collection.json)
   * [projectManager.postman_environment.json](./projectManager.postman_environment.json)
4. Confirm the import. You will now see a collection named **projectManager** in your Collections tab and an environment named **projectManager** in your Environments tab.

### 2. Set the Environment & Base URL
1. In the top-right corner of Postman, click the environment dropdown (which usually defaults to "No Environment").
2. Select **projectManager** from the list.
3. This activates the environment variables, specifically the `{{pm}}` variable which points to:
   `http://localhost:5000/api/v1` (default local server URL).
4. If your server is running on a different port or host, edit the environment's `pm` variable value accordingly.

---

## Authentication & Session Management

The API uses **cookie-based JWT authentication**. When you log in, the server sets a cookie named `accessToken` in the HTTP response headers.

### How to Log In

1. **Seed the Database (Prerequisite):** Ensure your database is seeded with the default test accounts by running the following command in the `/server` directory:
   ```bash
   npm run prisma:seed
   ```
2. Locate the **auth** folder within the imported `projectManager` collection.
3. Open the **login** request (`POST {{pm}}/auth/login`).
4. Under the **Body** tab, you will see a default test user credential:
   ```json
   {
       "email": "admin1@gmail.com",
       "password": "AdminPass@1"
   }
   ```
5. Click **Send**.
6. Once a successful login response is received, the server returns the `Set-Cookie` header. Postman automatically captures this cookie and saves it in its local cookie jar.

> [!NOTE]
> **No manual token copying is required!** Postman will automatically include the stored cookie in all subsequent requests to `localhost`.

### How to Log Out
* Run the **logout** request (`POST {{pm}}/auth/logout`). Postman will clear/expire the authentication cookies.

---

## API Request Categories

The collection is organized into the following folders:

1. **`auth`**: Handles registration, login, logout, and token refreshes.
2. **`projects`**: Create, list, search, view, update, and delete projects. Also contains endpoints for exporting tasks, managing team members, and viewing project statistics.
3. **`tasks`**: Create, view, update, delete, reorder, assign, and update status of tasks.
4. **`comments`**: Create, edit, and delete comments on tasks.
5. **`dashboard`**: Access main stats for user workspaces.
6. **`user`**: User management routes (e.g. changing roles, toggling active states, restoring users).

---

## Tips & Best Practices

### Filtering and Pagination
Many GET requests (like `GET /projects` or `GET /tasks`) support query parameters for filtering and sorting:
* `page` (default: 1)
* `per_page` (default: 20)
* `sortBy` (e.g., `created_at`, `status`)
* `order` (`asc` or `desc`)
* `status` (for filtering by status)
* `search` (for text search on names/titles)

### Troubleshooting
* **401 Unauthorized**: Make sure you have run the **login** request first, and that your server is running.
* **Connection Refused**: Ensure the backend server is running (`npm run dev` in the `/server` directory) and that the `pm` environment variable in Postman matches your server's host and port.
