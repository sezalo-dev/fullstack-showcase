FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG API_BASE_URL
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY

RUN set -eux; \
    esc() { printf '%s' "$1" | sed -e 's/[\/&]/\\&/g'; }; \
    API_BASE_URL_ESCAPED="$(esc "${API_BASE_URL}")"; \
    SUPABASE_URL_ESCAPED="$(esc "${SUPABASE_URL}")"; \
    SUPABASE_ANON_KEY_ESCAPED="$(esc "${SUPABASE_ANON_KEY}")"; \
    sed -i "s|__API_BASE_URL__|${API_BASE_URL_ESCAPED}|g" src/environments/environment.prod.ts; \
    sed -i "s|__SUPABASE_URL__|${SUPABASE_URL_ESCAPED}|g" src/environments/environment.prod.ts; \
    sed -i "s|__SUPABASE_ANON_KEY__|${SUPABASE_ANON_KEY_ESCAPED}|g" src/environments/environment.prod.ts

RUN npm run build -- --configuration production --base-href /admin/

FROM nginx:1.27-alpine AS runtime

COPY infra/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/admin-dashboard-angular/browser /usr/share/nginx/html

EXPOSE 80

