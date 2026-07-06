# Workspace - Smarter Project Management

## Required Environment Variables

To get started, make sure the `.env` files are configured as follows:

### 1. Root Workspace Environment Variables root .env (for deployment)
```env
# Server Configuration
PORT=5000
NODE_ENV=production #test
JWT_ACCESS_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
CLIENT_URL=http://localhost:5173

# Database Configuration
DATABASE_HOST=mysql
DATABASE_USER=your-username
DATABASE_PASSWORD=your-password
DATABASE_NAME=projectmanager
DATABASE_PORT=3306

# Redis Configuration
REDIS_URL=redis://redis:6379

# Client/Frontend Configuration
VITE_API_URL=http://localhost:5000/api/v1
```

### 2. Backend Environment Variables server/.env (for development)
```env
# Server Configuration
PORT=5000
NODE_ENV=development
JWT_ACCESS_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
CLIENT_URL=http://localhost:5173

# Database Configuration
DATABASE_HOST=localhost
DATABASE_USER=your-username
DATABASE_PASSWORD=your-password
DATABASE_NAME=projectmanager
DATABASE_PORT=3307

# Redis Configuration
REDIS_URL=redis://redis:6379
```

### 3. Frontend Environment Variables client/.env (for development)
```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## Running in Development Mode

In development mode, run the **database and redis inside Docker** and the **application source code locally** via `npm run dev` for instant hot-reloading.

### Step 1: Start Database and Cache Containers
Launch MySQL on host port `3307` and Redis on `6379`:
```bash
docker compose -f docker-compose.dev.yml up -d
```

### Step 2: Set Up & Run Backend
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```
4. Seed the database with mock developers, projects, and tasks:
   ```bash
   npm run prisma:seed
   ```
5. Start backend hot-reloading server:
   ```bash
   npm run dev
   ```

### Step 3: Set Up & Run Frontend
1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

To stop/pause the development database and cache containers (without removing them):
```bash
docker compose -f docker-compose.dev.yml stop
```

---

## Running in Production Mode (All-in-One Docker)

In production mode, the entire application stack—MySQL, Redis, the Node/Express server, and Nginx serving compiled Vite assets—runs inside Docker containers.

### Step 1: Start the Docker Compose Stack
Boot the production multi-container environment in detached mode:
```bash
docker compose up --build -d
```
*Wait for containers to initialize. The Express server container will automatically run the Prisma migration deployment before starting.*

### Step 2: Seed the Production Database (Optional)
To populate the production database with mock seed data, execute the seeder inside the running server container:
```bash
docker exec pm-server-prod node prisma/seed.js
```

### Step 3: Access the App
Open your browser and navigate to:
- **Application Front-End**: [http://localhost](http://localhost) (Served by Nginx on Port 80, reverse-proxying API requests transparently).
- **Backend API Server**: [http://localhost/api/v1](http://localhost/api/v1).

To stop/pause the production containers (without removing them):
```bash
docker compose stop
```

---

## How to Run Tests

### 1. Running Backend Tests
The backend uses **Jest** and **Supertest** to verify authorization, transitions, and models. Tests run in-band sequentially on your development database.
1. Navigate to backend server directory:
   ```bash
   cd server
   ```
2. Execute the test suite:
   ```bash
   npm run test
   ```

### 2. Running Frontend Tests
The frontend uses **Vitest** and **React Testing Library** for component and integration tests.
1. Navigate to frontend client directory:
   ```bash
   cd client
   ```
2. Run tests in watch mode:
   ```bash
   npm run test
   ```
3. Or run tests once:
   ```bash
   npm run test:run
   ```
