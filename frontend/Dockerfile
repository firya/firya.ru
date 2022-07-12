FROM node:alpine

WORKDIR /app

COPY . ./

RUN npm ci
RUN npm run build

EXPOSE 3000

CMD ["npx", "@11ty/eleventy", "--serve", "--port=3000", "--input=src"]