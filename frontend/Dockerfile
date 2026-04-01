# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN yarn install

# Copy source code
COPY . .

# REACT_APP_BACKEND_URL deve essere impostata come variabile d'ambiente su Railway
# Viene passata come ARG al momento del build
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Build the React app
RUN yarn build

# ---- Production stage ----
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
