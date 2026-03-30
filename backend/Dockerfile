FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir "bcrypt==4.0.1"

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && PYTHONPATH=/app python app/scripts/seed_admin.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
