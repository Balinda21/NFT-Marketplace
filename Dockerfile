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

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && chown -R node:node /app/logs && chown -R node:node /app

# Use PORT from environment variable (Render sets this automatically)
# Default to 9090 if not set
ENV PORT=9090

# Switch to non-root user for security
USER node

EXPOSE 9090

# Start the application
CMD ["node", "dist/index.js"]
