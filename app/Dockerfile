# Use the official lightweight Node.js image
FROM node:16-slim
WORKDIR /app

# Add environment variables to production image
# https://docs.docker.com/docker-hub/builds/advanced/
ARG COMMIT_MSG=""
ARG SOURCE_COMMIT=""
ARG SOURCE_BRANCH=""
ENV COMMIT_MSG=${COMMIT_MSG}
ENV SOURCE_COMMIT=${SOURCE_COMMIT}
ENV SOURCE_BRANCH=${SOURCE_BRANCH}
ENV NODE_ENV production

# Copy application dependency manifests to the container image.
# Copying this separately prevents re-running yarn install on every code change.
COPY package.json ./
COPY yarn.lock ./

# Copy everything except what is in .dockerignore (eg node_modules, etc)
COPY . ./

# Install production packages + compiled apps
#RUN yarn install # --production
RUN yarn install
#RUN yarn add --dev eslint eslint-config-next
RUN yarn next build

# Run node server
CMD ["yarn", "next", "start"]

# Commands to build docker image, run it locally and deploy to Google Cloud Run
# docker build -t "eu.gcr.io/insieme2/insieme-app:staging" .
# docker run -it --env-file=.env -p 127.0.0.1:80:3000 eu.gcr.io/insieme2/insieme-app:staging
# docker push eu.gcr.io/insieme2/insieme-app:staging
# gcloud run deploy insieme-app --quiet --region europe-west1 --image "eu.gcr.io/insieme2/insieme-app:staging" --platform "managed" --allow-unauthenticated