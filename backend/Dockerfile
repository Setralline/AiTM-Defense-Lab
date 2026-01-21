# 1. Base Image: Use a lightweight Node version
FROM node:20-alpine

# 2. Set working directory inside the container
WORKDIR /app

# 3. Copy dependency definitions first to leverage Docker cache
COPY package*.json ./

# 4. Install production dependencies only (Clean Install)
RUN npm ci --omit=dev

# 5. Copy the rest of the application source code
COPY . .

# 6. Expose the port the app runs on
EXPOSE 5000

# 7. Start the server
CMD ["npm", "start"]