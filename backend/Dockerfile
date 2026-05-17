FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY --chown=node:node backend/package*.json ./backend/

# Install dependencies inside backend
RUN cd backend && npm install

# Copy all files (backend and frontend)
COPY --chown=node:node . .

# Set working directory to backend for running the app
WORKDIR /app/backend

EXPOSE 3000

# Switch to non-root user
USER 1000

CMD ["npm", "start"]
