# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# REACT_APP_BACKEND_URL deve essere impostata come variabile d'ambiente su Railway
# Viene passata come ARG al momento del build
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Build the React app (NODE_OPTIONS prevents OOM on memory-constrained CI/Railway)
RUN NODE_OPTIONS=--max_old_space_size=4096 npm run build

# ---- Production stage ----
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config template and entrypoint script
COPY nginx.conf /etc/nginx/nginx.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Railway injects $PORT at runtime; 80 is the default for local usage
ENV PORT=80
EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
