FROM python:3.11-slim

WORKDIR /app

# Copy backend
COPY backend/ .

# Make the local nyai package importable
ENV PYTHONPATH=/app

# Install Python deps
RUN pip install --no-cache-dir -r requirements.txt

# Expose port
EXPOSE 8000

# Railway injects PORT; the fallback keeps local Docker runs predictable
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
