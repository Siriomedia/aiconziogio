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

# Copy nginx config as a template (not into templates/ dir – we substitute manually)
COPY nginx.conf /etc/nginx/nginx.conf.template

# Entrypoint: substitute ONLY ${PORT}, then start nginx
# This avoids envsubst accidentally overwriting nginx variables like $uri, $host, etc.
RUN printf '#!/bin/sh\nenvsubst '"'"'${PORT}'"'"' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf\nexec nginx -g "daemon off;"\n' > /entrypoint.sh \
    && chmod +x /entrypoint.sh

# Railway sets $PORT at runtime; default 80 for local testing
ENV PORT=80
EXPOSE $PORT

ENTRYPOINT ["/entrypoint.sh"]
