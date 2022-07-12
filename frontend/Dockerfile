FROM node:alpine

WORKDIR /app

COPY . ./

RUN npm ci
RUN npm run build

# Set the ports
EXPOSE 3000

# Run 11ty
CMD ["npx", "@11ty/eleventy", "--serve", "--port=3000", "--input=src"]