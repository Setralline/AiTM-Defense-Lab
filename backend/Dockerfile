# 1. Base Image: Use a lightweight Node version
FROM node:20-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy dependencies first (Caching layer)
COPY package*.json ./

# 4. Install production dependencies only
RUN npm ci --only=production

# 5. Copy the rest of the application code
COPY . .

# 6. Expose the port
EXPOSE 5000

# 7. Start the server
CMD ["npm", "start"]