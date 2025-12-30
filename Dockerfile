FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run migrations and then start the app
CMD ["sh", "-c", "alembic upgrade head && fastapi run app/main.py --port 8000 --host 0.0.0.0"]
