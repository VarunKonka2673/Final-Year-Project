# Use official Python slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy codebase
COPY backend /app/backend

# Set environment variables
ENV PORT=8080

# Start FastAPI using uvicorn
CMD ["sh", "-c", "uvicorn backend.api.app:app --host 0.0.0.0 --port $PORT"]
