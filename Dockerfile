# Build stage
FROM --platform=linux/arm64 node:20-bullseye AS builder

WORKDIR /usr/src/app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Configure npm
RUN npm config set registry https://registry.npmjs.org/
RUN npm config set fetch-retries 5
RUN npm config set fetch-retry-maxtimeout 60000

# Install dependencies in multiple steps
RUN npm install --no-package-lock --legacy-peer-deps @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/typeorm typeorm pg bcrypt
RUN npm install --no-package-lock --legacy-peer-deps @nestjs/bull bull @google/generative-ai sharp
RUN npm install --no-package-lock --legacy-peer-deps firebase firebase-admin
RUN npm install --no-package-lock --legacy-peer-deps @nestjs/jwt @nestjs/passport passport passport-jwt passport-google-oauth20
RUN npm install --no-package-lock --legacy-peer-deps --save-dev @types/node typescript @types/express @nestjs/cli

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM --platform=linux/arm64 node:20-bullseye-slim

WORKDIR /usr/src/app

# Copy package files and built files
COPY package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# Expose port
EXPOSE 8001

# Start the application
CMD ["npm", "run", "start:prod"] 