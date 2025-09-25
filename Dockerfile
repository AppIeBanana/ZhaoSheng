FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install -g pnpm && pnpm install --production --frozen-lockfile
COPY . .
EXPOSE 3303
RUN chown -R node /usr/src/app
USER node
CMD ["pnpm", "start"]
