# Deployment Guide

This document covers everything needed to run the Workspace - Smarter Project Management application in both **development** and **production** modes.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Variables](#2-environment-variables)
3. [Development Mode](#3-development-mode)
4. [Production Mode](#4-production-mode)
5. [Nginx Reverse Proxy](#5-nginx-reverse-proxy)
6. [Container Reference](#6-container-reference)
7. [Useful Docker Commands](#7-useful-docker-commands)
8. [Running Tests](#8-running-tests)

---

## 1. Prerequisites

Make sure the following are installed on your machine:

| Tool | Minimum Version | Purpose |
|---|---|---|
| [Docker](https://docs.docker.com/get-docker/) | 24+ | Container runtime |
| [Docker Compose](https://docs.docker.com/compose/) | v2+ | Multi-container orchestration |
| [Node.js](https://nodejs.org/) | 20 LTS | Local dev server (dev mode only) |
| [npm](https://www.npmjs.com/) | 9+ | Package manager (dev mode only) |

> Node.js and npm are only required for **development mode**. In production, everything runs inside Docker containers.

---

## 2. Environment Variables

The project uses three separate `.env` files. Copy the provided examples and fill in your values.

### 2.1 Root `.env` — Production & Docker Compose

Used by `docker-compose.yml` to configure all four production services.

```bash
cp .env.example .env
```

```env
# Server Configuration
PORT=5000
NODE_ENV=production
JWT_ACCESS_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
CLIENT_URL=http://localhost

# Database Configuration
DATABASE_HOST=mysql          # Service name inside Docker network
DATABASE_USER=your-username
DATABASE_PASSWORD=your-password
DATABASE_NAME=projectmanager
DATABASE_PORT=3306

# Redis Configuration
REDIS_URL=redis://redis:6379 # Service name inside Docker network

# Client/Frontend Configuration
VITE_API_URL=http://localhost:5000/api/v1
```

---

### 2.2 `server/.env` — Backend (Development)

Used when running the Express server locally with `npm run dev`.

```bash
cp server/.env.example server/.env
```

```env
# Server Configuration
PORT=5000
NODE_ENV=development
JWT_ACCESS_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
CLIENT_URL=http://localhost:5173

# Database Configuration
DATABASE_HOST=localhost       # Dev containers bind to host
DATABASE_USER=your-username
DATABASE_PASSWORD=your-password
DATABASE_NAME=projectmanager
DATABASE_PORT=3307            # Mapped to host port 3307

# Redis Configuration
REDIS_URL=redis://127.0.0.1:6379
```

---

### 2.3 `client/.env` — Frontend (Development)

Used by Vite when running the React app locally.

```bash
cp client/.env.example client/.env
```

```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 3. Development Mode

In development mode, **only the database and Redis run in Docker**. The Node.js server and Vite dev server run locally for instant hot-reloading.

```
localhost:5173  ──►  Vite Dev Server  (local)
localhost:5000  ──►  Express Server   (local, nodemon)
localhost:3307  ──►  MariaDB          (Docker container)
localhost:6379  ──►  Redis            (Docker container)
```

### Step 1 — Start Infrastructure Containers

```bash
docker compose -f docker-compose.dev.yml up -d
```

This starts:
- `pm-mysql-dev` on host port `3307`
- `pm-redis-dev` on host port `6379`

---

### Step 2 — Set Up & Run the Backend

```bash
cd server
npm install
```

Run database migrations (creates all tables):
```bash
npm run prisma:migrate
```

Seed the database with test users, projects, and tasks:
```bash
npm run prisma:seed
```

Start the Express server with hot-reloading:
```bash
npm run dev
```

The API is now available at `http://localhost:5000/api/v1`.

---

### Step 3 — Set Up & Run the Frontend

Open a **new terminal**:

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Stopping Development Containers

To pause the database and cache containers without removing data:
```bash
docker compose -f docker-compose.dev.yml stop
```

To remove the containers entirely:
```bash
docker compose -f docker-compose.dev.yml down
```

To also remove the persistent volumes (⚠️ deletes all data):
```bash
docker compose -f docker-compose.dev.yml down -v
```

---

## 4. Production Mode

In production, the **entire stack** runs inside Docker. There are no local dependencies beyond Docker itself.

```
Port 80  ──►  Nginx (client container)
                 ├── serves  /          →  React static files (dist/)
                 ├── proxies /api/v1/   →  Express server:5000
                 └── proxies /socket.io →  Express server:5000 (WebSocket)
```

### Step 1 — Configure Environment

Ensure the root `.env` is filled out correctly (see [Section 2.1](#21-root-env--production--docker-compose)).

Key differences from development:
- `DATABASE_HOST=mysql` (Docker service name, not `localhost`)
- `REDIS_URL=redis://redis:6379` (Docker service name)
- `CLIENT_URL=http://localhost` (or your public domain)
- `NODE_ENV=production`

---

### Step 2 — Build & Start All Containers

```bash
docker compose up --build -d
```

> **What happens automatically:**
> 1. MariaDB and Redis start and pass health checks.
> 2. The server container starts, runs `prisma migrate deploy` to apply all pending migrations, then launches `node index.js`.
> 3. The client container builds the Vite production bundle and serves it via Nginx on port 80.

Wait ~30 seconds for all services to initialize fully.

---

### Step 3 — Seed the Database (Optional)

To populate the production database with demo seed data:

```bash
docker exec pm-server-prod npm run prisma:seed
```

---

### Step 4 — Access the Application

| URL | Description |
|---|---|
| [http://localhost](http://localhost) | Full application (React frontend via Nginx) |
| [http://localhost/api/v1](http://localhost/api/v1) | REST API (proxied through Nginx) |

---

### Stopping Production Containers

Pause without removing data:
```bash
docker compose stop
```

Remove containers (data volumes are preserved):
```bash
docker compose down
```

Remove containers **and all data** (⚠️ irreversible):
```bash
docker compose down -v
```

---

### Rebuilding After Code Changes

If you change source code and want to redeploy:
```bash
docker compose up --build -d
```

---

## 5. Nginx Reverse Proxy

In production, the client container runs **Nginx** ([`client/nginx.conf`](../client/nginx.conf)) which serves both the frontend and transparently proxies backend traffic. This means the browser only ever talks to **port 80** — there is no CORS or cross-origin issue.

| Path | Routed To | Notes |
|---|---|---|
| `/` | `dist/` static files | React Router SPA; falls back to `index.html` |
| `/api/v1/*` | `http://server:5000/api/v1/` | REST API |
| `/socket.io/*` | `http://server:5000/socket.io/` | WebSocket upgrade headers set |

---

## 6. Container Reference

### Production (`docker-compose.yml`)

| Container | Image | Port | Restart | Dependencies |
|---|---|---|---|---|
| `pm-mysql-prod` | `mariadb:10.11` | `3307:3306` | always | — |
| `pm-redis-prod` | `redis:7-alpine` | internal | always | — |
| `pm-server-prod` | `./server/Dockerfile` | `5000:5000` | always | mysql healthy, redis healthy |
| `pm-client-prod` | `./client/Dockerfile` | `80:80` | always | server |

### Development (`docker-compose.dev.yml`)

| Container | Image | Port | Restart |
|---|---|---|---|
| `pm-mysql-dev` | `mariadb:10.11` | `3307:3306` | always |
| `pm-redis-dev` | `redis:7-alpine` | `6379:6379` | always |

### Dockerfile Summaries

**`server/Dockerfile`** — Node 20 Alpine:
1. Installs system dependency `openssl` (required by Prisma).
2. Copies `package*.json` and `prisma/` schema.
3. Runs `npm ci --omit=dev` (production deps only).
4. Copies source, exposes port 5000.
5. `CMD ["node", "index.js"]`

**`client/Dockerfile`** — Multi-stage build:
1. **Stage 1 (builder):** Node 20 Alpine — installs deps, runs `npm run build`, produces `dist/`.
2. **Stage 2 (serve):** Nginx 1.25 Alpine — copies `nginx.conf` + `dist/`, exposes port 80.

---

## 7. Useful Docker Commands

```bash
# View logs for a specific container
docker logs pm-server-prod -f

# Open a shell inside the server container
docker exec -it pm-server-prod sh

# Open Prisma Studio (inside the server container)
docker exec -it pm-server-prod npx prisma studio

# Check container health and status
docker compose ps

# Force rebuild a single service
docker compose up --build -d server
```

---

## 8. Running Tests

### Backend Tests (Jest + Supertest)

Tests run against the **development database** sequentially in-band.

```bash
cd server
npm run test
```

> Ensure `server/.env` has `NODE_ENV=development` and the dev database containers are running before executing tests.

### Frontend Tests (Vitest + Testing Library)

```bash
cd client

# Watch mode (re-runs on file change)
npm run test

# Single run (CI-friendly)
npm run test:run
```
