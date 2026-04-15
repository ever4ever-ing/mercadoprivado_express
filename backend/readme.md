# Backend — Mercado Privado Chile

API REST construida con **Express + TypeScript + Prisma + PostgreSQL**.

---

## Requisitos

- Node.js 20+
- PostgreSQL 15+

---

## Instalación

```bash
cd backend
npm install
cp .env.example .env   # completar variables (ver sección de abajo)
```

---

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Secret para access tokens (15m) | cadena aleatoria ≥32 chars |
| `JWT_REFRESH_SECRET` | Secret para refresh tokens (7d) | cadena aleatoria distinta |
| `PORT` | Puerto del servidor | `3000` |
| `FRONTEND_URL` | Origen permitido por CORS | `http://localhost:5173` |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud en Cloudinary | — |
| `CLOUDINARY_API_KEY` | API key de Cloudinary | — |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary | — |
| `SMTP_HOST` | Servidor SMTP para emails | `smtp.gmail.com` |
| `SMTP_PORT` | Puerto SMTP | `587` |
| `SMTP_USER` | Usuario SMTP | — |
| `SMTP_PASS` | Contraseña SMTP | — |

---

## Comandos

```bash
npm run dev          # servidor con hot reload en http://localhost:3000
npm run build        # compila TypeScript → dist/
npm run start        # corre dist/index.js (producción)

npm run db:migrate   # aplica migraciones pendientes
npm run db:generate  # regenera el cliente Prisma tras cambios en schema
npm run db:seed      # carga datos de prueba
npm run db:reset     # resetea la DB y re-corre migraciones + seed
npm run db:studio    # abre Prisma Studio en http://localhost:5555
```

---

## Endpoints

### Auth — `/api/auth`
> Rate limit: 20 requests / 15 min

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/register` | Registro de usuario |
| `POST` | `/login` | Login, retorna access + refresh token |
| `POST` | `/refresh` | Renueva el access token |
| `POST` | `/logout` | Invalida el refresh token |

### Proveedores — `/api/providers`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/` | — | Listar proveedores (filtros + paginación) |
| `GET` | `/:id` | — | Detalle de un proveedor |
| `GET` | `/me/profile` | PROVEEDOR | Perfil propio |
| `POST` | `/` | PROVEEDOR | Crear perfil de proveedor |
| `PUT` | `/:id` | PROVEEDOR | Actualizar perfil |
| `GET` | `/:id/reviews` | — | Listar reseñas de un proveedor |
| `POST` | `/:id/reviews` | EMPRESA | Crear reseña |
| `PATCH` | `/:id/reviews/:reviewId/reply` | PROVEEDOR | Responder reseña |

### Inquiries — `/api/inquiries`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/` | EMPRESA | Enviar solicitud de contacto |
| `GET` | `/received` | PROVEEDOR | Ver solicitudes recibidas |
| `PATCH` | `/:id/status` | PROVEEDOR | Actualizar estado de solicitud |

### Admin — `/api/admin`
> Todos requieren rol `ADMIN`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/stats` | Estadísticas generales |
| `GET` | `/providers` | Listar todos los proveedores |
| `PATCH` | `/providers/:id/status` | Cambiar estado de un proveedor |
| `DELETE` | `/reviews/:id` | Eliminar reseña |
| `PATCH` | `/documents/:id/status` | Verificar documento |

### Health check

```
GET /health   → { status: "ok", timestamp: "..." }
```

---

## Arquitectura

```
src/
├── index.ts              # Entry point: Express, CORS, rutas, error handler
├── routes/               # Definición de rutas por recurso
├── controllers/          # Handlers de cada endpoint
├── middleware/           # authenticate, requireRole, errorHandler
├── services/             # Lógica de negocio (score, email, Cloudinary)
├── validators/           # Schemas Zod para validación de requests
└── lib/                  # prisma client, catchAsync
prisma/
├── schema.prisma         # Modelos de datos
├── migrations/           # Historial de migraciones
└── seed.ts               # Datos de prueba
```

### Score de proveedores

```
score = 50% promedio de reseñas
      + 30% nivel de verificación de documentos
      + 20% actividad reciente
```

| Score | Badge |
|---|---|
| ≥ 4.5 | Gold |
| 3.5 – 4.4 | Silver |
| 2.5 – 3.4 | Bronze |
