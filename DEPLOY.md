# Guía de despliegue en EC2

Stack: Vue 3 + Express + PostgreSQL + Docker  
Instancia: `t3.micro` — Ubuntu 24.04 LTS  
IP: `52.54.104.52`

---

## 1. Abrir puerto 80 en AWS

1. AWS Console → EC2 → **Security Groups**
2. Seleccionar el Security Group de la instancia
3. **Inbound rules** → Edit → Add rule
   - Type: `HTTP` | Port: `80` | Source: `0.0.0.0/0`
4. Save rules

---

## 2. Conectarse a la instancia

```bash
ssh -i tu-key.pem ubuntu@52.54.104.52
```

---

## 3. Instalar Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
exit
```

Reconectar para que el grupo `docker` tome efecto:

```bash
ssh -i tu-key.pem ubuntu@52.54.104.52
```

---

## 4. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/mercadoprivadochile.git
cd mercadoprivadochile
```

---

## 5. Configurar variables de entorno

```bash
cp .env.example .env
nano .env
```

Valores a completar:

```env
# PostgreSQL
POSTGRES_DB=mercadoprivado
POSTGRES_USER=mpuser
POSTGRES_PASSWORD=una_password_segura

# JWT (generar con el comando de abajo)
JWT_SECRET=
JWT_REFRESH_SECRET=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# SMTP
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# URL pública
FRONTEND_URL=http://52.54.104.52
```

Generar secrets seguros:

```bash
openssl rand -base64 64   # copiar resultado → JWT_SECRET
openssl rand -base64 64   # copiar resultado → JWT_REFRESH_SECRET
```

---

## 6. Levantar los contenedores

```bash
docker compose up -d --build
```

El primer build tarda ~3-5 minutos. Al terminar verifica:

```bash
docker compose ps
```

Todos los servicios deben aparecer como `running`:

```
NAME                        STATUS
mercadoprivado_db           running
mercadoprivado_backend      running
mercadoprivado_frontend     running
mercadoprivado_nginx        running
```

---

## 7. Verificar migraciones

```bash
docker compose logs backend
```

Debe aparecer algo como:

```
All migrations have been successfully applied.
Server running on port 3000
```

---

## 8. Acceder a la app

Abrir en el navegador:

```
http://52.54.104.52
```

---

## Comandos útiles post-despliegue

```bash
# Ver logs en tiempo real
docker compose logs -f

# Reiniciar un servicio
docker compose restart backend

# Detener todo
docker compose down

# Detener y borrar volúmenes (⚠️ borra la base de datos)
docker compose down -v

# Actualizar después de un git pull
git pull
docker compose up -d --build
```

---

## Actualizar la app (después de cambios en GitHub)

```bash
git pull
docker compose up -d --build
```

---

## Agregar SSL cuando tengas dominio

1. Apuntar el dominio a `52.54.104.52` (registro A en tu DNS)
2. Instalar Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   ```
3. Obtener certificado:
   ```bash
   sudo certbot --nginx -d tudominio.com
   ```
4. Actualizar `FRONTEND_URL=https://tudominio.com` en `.env`
5. `docker compose up -d --build`
