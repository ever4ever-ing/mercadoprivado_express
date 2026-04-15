# Backend — Directorio B2B de Servicios

Stack: Node.js · Express · PostgreSQL · Prisma · TypeScript

---

## Setup inicial

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y completa los valores:

```bash
cp .env.example .env
```

```env
# Base de datos
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/directorio_b2b"

# JWT
JWT_SECRET="cambia_esto_por_un_secreto_seguro"
JWT_REFRESH_SECRET="otro_secreto_para_refresh"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Servidor
PORT=3000
NODE_ENV=development

# Cloudinary (imágenes)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Nodemailer (correos)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@directorio.cl"

# Frontend (para CORS)
FRONTEND_URL="http://localhost:5173"
```

### 3. Crear la base de datos

```bash
# Crear la base de datos en PostgreSQL primero
createdb directorio_b2b

# O con psql:
psql -U postgres -c "CREATE DATABASE directorio_b2b;"
```

### 4. Ejecutar migraciones

```bash
npm run db:migrate
# Nombre sugerido para la primera migración: init
```

Esto genera las tablas en la base de datos y el cliente de Prisma.

### 5. Poblar con datos de prueba

```bash
npm run db:seed
```

Crea un admin, una empresa cliente y un proveedor demo con sus credenciales impresas en consola.

### 6. Iniciar el servidor en desarrollo

```bash
npm run dev
```

El servidor queda escuchando en `http://localhost:3000`.

---

## Comandos útiles de Prisma

| Comando | Descripción |
|---|---|
| `npm run db:migrate` | Aplica migraciones pendientes |
| `npm run db:generate` | Regenera el cliente Prisma |
| `npm run db:studio` | Abre Prisma Studio en el navegador |
| `npm run db:seed` | Ejecuta el seed de datos |
| `npm run db:reset` | Borra y recrea la base de datos (¡cuidado!) |

---

## Estructura de carpetas

```
backend/
├── prisma/
│   ├── schema.prisma       ← Modelo de datos completo
│   └── seed.ts             ← Datos iniciales de prueba
├── src/
│   ├── routes/             ← Definición de endpoints por recurso
│   ├── controllers/        ← Lógica de cada endpoint
│   ├── services/
│   │   └── score.service.ts ← Cálculo automático del score
│   ├── middleware/         ← Auth JWT, errores, rate limit, CORS
│   ├── validators/         ← Esquemas Zod por recurso
│   └── index.ts            ← Entry point del servidor
├── package.json
└── .env
```

---

## Score de confiabilidad

El score se recalcula automáticamente al crear/eliminar una reseña, aprobar un documento o actualizar el tiempo de respuesta. El archivo `src/services/score.service.ts` contiene la lógica completa con los pesos:

- **50%** promedio de reseñas (1–5 estrellas)
- **30%** documentos verificados (RUT, inicio de actividades, seguro)
- **20%** actividad (tiempo de respuesta promedio)

El badge se asigna automáticamente según el score resultante:
- **Oro** → score ≥ 4.5 (mínimo 2 reseñas)
- **Plata** → score ≥ 3.5
- **Bronce** → score ≥ 2.5
