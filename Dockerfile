FROM python:3.9

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend

RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm install && npm run build

RUN npm install -g serve

WORKDIR /app
CMD uvicorn backend.main:app --host 0.0.0.0 --port=7860
