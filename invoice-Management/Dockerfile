# invoice-Management/Dockerfile






FROM node:20-slim

WORKDIR /usr/src/app

# Copy package.json & install deps
COPY package*.json ./

# Ensure devDependencies are installed (including Vite)
RUN npm install --legacy-peer-deps --silent --include=dev

# Copy source files
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
