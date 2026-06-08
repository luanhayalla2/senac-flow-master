# Etapa 1: Construção (Build)
FROM node:20-alpine AS build

# Diretório de trabalho dentro do container
WORKDIR /app

# Copiar os arquivos de dependência primeiro para aproveitar cache
COPY package.json package-lock.json* ./

# Instalar as dependências (com legacy-peer-deps conforme documentação)
RUN npm install --legacy-peer-deps

# Copiar o restante do código
COPY . .

# Fazer o build da aplicação para produção
RUN npm run build

# Etapa 2: Servidor Web (Nginx)
FROM nginx:alpine

# Copiar os arquivos de build para o diretório público do nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configurar o Nginx para roteamento do Single Page Application (SPA)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expor a porta 80
EXPOSE 80

# Iniciar o nginx
CMD ["nginx", "-g", "daemon off;"]
