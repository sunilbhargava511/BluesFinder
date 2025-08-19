# Use Node.js 18 
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with npm ci for faster, more reliable builds
RUN npm ci

# Copy all source files
COPY . .

# Build the application
RUN npm run build

# Expose the port (Railway will set PORT env variable)
EXPOSE ${PORT}

# Start the production server
CMD ["npm", "start"]