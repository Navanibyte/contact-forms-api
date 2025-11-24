# --- Stage 1: Build the NestJS app ---
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build NestJS project
RUN npm run build


# --- Stage 2: Run the production app ---
FROM node:18-alpine AS runner

WORKDIR /app

# Copy only required files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

EXPOSE 8000

# Command to run the app
CMD ["node", "dist/main.js"]
