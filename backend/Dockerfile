FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY backend/package*.json ./backend/

# Install dependencies inside backend
RUN cd backend && npm install

# Copy all files (backend and frontend)
COPY . .

# Set working directory to backend for running the app
WORKDIR /app/backend

EXPOSE 3000

CMD ["npm", "start"]
