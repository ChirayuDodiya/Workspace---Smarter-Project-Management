FROM python:3.11-slim

WORKDIR /app

# Install lightweight CPU-only PyTorch first (skips ~7 GB of unused NVIDIA CUDA libraries)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies (sentence-transformers will reuse the CPU torch)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose FastAPI port
EXPOSE 8000
