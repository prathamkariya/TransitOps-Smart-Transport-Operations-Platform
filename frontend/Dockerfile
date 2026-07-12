FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy all project files
COPY . .

# Run Vite in dev mode bound to all network interfaces
CMD ["npm", "run", "dev", "--", "--host"]
