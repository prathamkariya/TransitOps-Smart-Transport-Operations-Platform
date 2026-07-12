FROM node:18-alpine

WORKDIR /app

# Copy package files first to leverage Docker caching
COPY package*.json ./

# Install dependencies inside the container environment
RUN npm install

# Copy the rest of the application code
COPY . .

EXPOSE 5173

# Start Vite with the external host flag enabled
CMD ["npm", "run", "dev", "--", "--host"]