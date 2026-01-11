# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++ 

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --ignore-scripts

# Rebuild better-sqlite3 for the container environment
RUN npm rebuild better-sqlite3

# Copy source files
COPY . .

# Build the frontend
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# Rebuild better-sqlite3 for production
RUN npm rebuild better-sqlite3

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy server files
COPY server ./server

# Create data directory
RUN mkdir -p /app/data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_PATH=/app/data

# Expose port
EXPOSE 3001

# Create volume mount point for persistent data
VOLUME ["/app/data"]

# Start the server
CMD ["node", "server/index.js"]
