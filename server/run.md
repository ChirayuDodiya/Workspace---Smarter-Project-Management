# Running the Node.js Backend (Development)

This terminal will run the main API server (Express/Prisma) that handles authentication, projects, and task management.

### Prerequisites
Make sure your Docker containers (MariaDB, Redis, MinIO) are running first:
```bash
# Run this from the root workspace folder once
docker compose -f docker-compose.dev.yml up -d
```

### Steps to Run

1. Open a new terminal.
2. Navigate to the `server` directory:
   ```bash
   cd server
   ```
3. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`.
