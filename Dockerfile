FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source files and build configuration
COPY ./src ./src
COPY ./tsconfig.json ./

# Build the project
RUN npx tsc && npx tsc-alias

# Remove dev dependencies after build
RUN npm prune --production && npm install @prisma/client prisma

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && chown -R node:node /app/logs && chown -R node:node /app

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh && chown node:node /app/docker-entrypoint.sh

ENV PORT=9090

# Switch to non-root user for security
USER node

EXPOSE 9090

# Run migrations then start
ENTRYPOINT ["/app/docker-entrypoint.sh"]
