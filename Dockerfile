# Root Dockerfile for Hugging Face Spaces (Monorepo Setup)
# Use a slim Python image
FROM python:3.11-slim

# Install system dependencies for WeasyPrint and PDF generation
RUN apt-get update && apt-get install -y \
    python3-pip \
    python3-cffi \
    python3-brotli \
    libpango-1.0-0 \
    libharfbuzz0b \
    libpangoft2-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements from the server folder and install
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the server folder contents into the working directory
COPY server/ .

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Hugging Face expects port 8000 because we set it in README.md
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port 8000"]
