FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY agents/package*.json ./
RUN npm ci --only=production

# Copy agent source
COPY agents/ ./
COPY contracts/marketplace-deployment.json ./contracts/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S agent -u 1001
USER agent

EXPOSE 3000

CMD ["node", "production-agent.js"]