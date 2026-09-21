# Running the AI Backend (Development)

The AI microservice consists of **two** pieces that need to run in parallel:
1. The FastAPI Server (Receives HTTP requests)
2. The RQ Worker (Processes background tasks like PDF chunking)

### Prerequisites
Make sure your Docker containers (specifically Redis and Qdrant) are running first:
```bash
# Run this from the root workspace folder once
docker compose -f docker-compose.dev.yml up -d
```

---

### Terminal A: Start the FastAPI Server

1. Open a new terminal.
2. Navigate to the `AI` directory:
   ```bash
   cd AI
   ```
3. **(First time only)** Create the virtual environment and install dependencies:
   ```bash
   uv venv --python 3.11
   .\.venv\Scripts\Activate.ps1
   uv pip install -r requirements.txt
   ```
4. Activate the virtual environment (if not already active):
   ```bash
   .\.venv\Scripts\Activate.ps1
   # (If on Mac/Linux: source .venv/bin/activate)
   ```
5. Start the server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

---

### Terminal B: Start the Background Worker

1. Open **another** new terminal.
2. Navigate to the `AI` directory:
   ```bash
   cd AI
   ```
3. Activate the virtual environment:
   ```bash
   .\.venv\Scripts\Activate.ps1
   # (If on Mac/Linux: source .venv/bin/activate)
   ```
4. Start the Redis Queue worker:
   ```bash
   python worker.py
   ```

The AI server is now fully operational at `http://localhost:8000`.
