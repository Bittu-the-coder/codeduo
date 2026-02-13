FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# Copy source
COPY src/ ./src/

# Cloud Run sets PORT env var automatically
ENV HOST=0.0.0.0
EXPOSE 8080

CMD ["bun", "run", "src/index.ts"]
