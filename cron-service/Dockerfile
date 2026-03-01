FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY src ./src
ENV NODE_ENV=production
CMD ["npm", "run", "start"]
