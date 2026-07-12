FROM node:18-alpine

WORKDIR /app

<<<<<<< HEAD
# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy all project files
COPY . .

# Run Vite in dev mode bound to all network interfaces
CMD ["npm", "run", "dev", "--", "--host"]
=======
# Copy package files first to leverage Docker caching
COPY package*.json ./

# Install dependencies inside the container environment
RUN npm install

# Copy the rest of the application code
COPY . .

EXPOSE 5173

# Start Vite with the external host flag enabled
CMD ["npm", "run", "dev", "--", "--host"]
>>>>>>> origin/main
