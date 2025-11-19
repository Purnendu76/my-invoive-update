FROM node:20-alpine

WORKDIR /usr/src/app
ENV NODE_ENV=development

RUN apk add --no-cache python3 g++ make

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 5000

CMD ["npm", "run", "dev"]
