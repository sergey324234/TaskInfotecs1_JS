

FROM oven/bun:1.1-slim

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

COPY . .
CMD ["bun", "x", "cucumber-js"]