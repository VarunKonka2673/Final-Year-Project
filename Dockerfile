# Use official Python slim image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Upgrade pip, setuptools, and wheel to ensure correct binary wheel compatibility
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install dependencies strictly using precompiled binary wheels to prevent OOM/compilation timeouts
RUN pip install --no-cache-dir --only-binary :all: -r requirements.txt

# Copy codebase
COPY backend /app/backend

# Set environment variables
ENV PORT=8080

# Start FastAPI using uvicorn
CMD ["sh", "-c", "uvicorn backend.api.app:app --host 0.0.0.0 --port $PORT"]
