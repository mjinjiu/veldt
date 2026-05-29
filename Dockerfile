# Veldt MVP — single container (Next.js + Python AI sidecar)
FROM python:3.12-slim

# Install Node.js 20 LTS + supervisord
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    supervisor \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- Python AI service ---
COPY ai/requirements.txt /app/ai/
RUN pip install --no-cache-dir -r /app/ai/requirements.txt

COPY ai/ /app/ai/

# --- Next.js frontend ---
COPY package.json package-lock.json* /app/
RUN npm ci --omit=dev

COPY next.config.ts tsconfig.json /app/
COPY public/ /app/public/
COPY .next/ /app/.next/

# --- Process management ---
COPY supervisord.conf /etc/supervisor/conf.d/veldt.conf

RUN mkdir -p /data
ENV VELDT_DATA_DIR=/data

EXPOSE 3000

CMD ["supervisord", "-n", "-c", "/etc/supervisord/supervisord.conf"]
