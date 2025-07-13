FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .


# Expose port
EXPOSE 4001

# Start server
CMD ["npm", "start"]
