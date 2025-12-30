FROM node:20-alpine as build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install
RUN npm install -D tailwindcss@3.4.1 postcss autoprefixer
RUN npm install lucide-svelte clsx tailwind-merge

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
