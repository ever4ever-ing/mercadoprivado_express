# Mercado Privado Chile

Marketplace B2B de servicios industriales en Chile. Conecta empresas con proveedores verificados.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS |
| Backend | Express + TypeScript + Prisma |
| Base de datos | PostgreSQL |
| Imágenes | Cloudinary |
| Despliegue | Docker + Nginx |

## Estructura

```
mercadoprivadochile/
├── frontend/        # Vue 3 SPA
├── backend/         # API REST Express
├── nginx/           # Configuración del reverse proxy
├── docker-compose.yml
├── .env.example
└── DEPLOY.md        # Guía de despliegue en EC2
```

## Inicio rápido (desarrollo local)

```bash
# 1. Variables de entorno
cp .env.example .env    # editar con tus valores

# 2. Levantar con Docker
docker compose up -d --build

# 3. Cargar datos de prueba
docker exec mercadoprivado_backend npx prisma db seed
```

La app queda disponible en `http://localhost`.

## Cuentas de prueba

Disponibles tras ejecutar el seed:

| Rol | Email | Contraseña | Acceso |
|---|---|---|---|
| Admin | `admin@directorio.cl` | `Admin1234!` | Panel de administración (`/admin`) |
| Empresa | `empresa@demo.cl` | `Empresa1234!` | Directorio, solicitudes, reseñas |
| Proveedor | `proveedor@demo.cl` | `Proveedor1234!` | Perfil, servicios, portfolio |

## Documentación

- [backend/readme.md](backend/readme.md) — endpoints, variables de entorno, arquitectura
- [frontend/readme.md](frontend/readme.md) — rutas, stores, flujo de autenticación
- [DEPLOY.md](DEPLOY.md) — guía paso a paso para desplegar en EC2
- [.doc/postgres_consola.md](.doc/postgres_consola.md) — comandos de base de datos
