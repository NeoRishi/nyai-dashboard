FROM python:3.11-slim

WORKDIR /app

# Copy backend
COPY backend/ .

# Install Python deps
RUN pip install --no-cache-dir fastapi uvicorn[standard]

# Expose port
EXPOSE 8000

# Run
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
