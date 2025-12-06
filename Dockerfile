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

# Create logs directory
RUN mkdir -p /app/logs && chown -R node:node /app/logs

# Use PORT from environment variable or default to 9090
ENV PORT=9090

EXPOSE 9090

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]