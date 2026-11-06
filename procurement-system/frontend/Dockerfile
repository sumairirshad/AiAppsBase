FROM node:20-alpine AS build
WORKDIR /src
COPY web/package*.json ./
RUN npm ci
COPY web/ .
RUN npm run build -- --configuration production
# Angular 17's application builder outputs to dist/<project>/browser; the classic builder
# outputs straight to dist/<project>. Normalize whichever one exists into one known path.
RUN if [ -d dist/web/browser ]; then cp -r dist/web/browser /dist-final; else cp -r dist/web /dist-final; fi

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /dist-final /usr/share/nginx/html
EXPOSE 80
