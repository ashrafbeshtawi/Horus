FROM node:21-alpine

# Create app directory
RUN mkdir -p /Nuxt
WORKDIR /Nuxt

# update and install dependency
RUN apk update && apk upgrade
RUN apk add git

# Install dependencies
COPY . /Nuxt/
RUN npm install

# Build the Nuxt.js application
CMD [ "npm", "run", "dev" ]