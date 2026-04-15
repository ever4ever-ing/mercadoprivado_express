# Requerimientos — Directorio B2B de Servicios Industriales

**Versión:** 1.0  
**Fecha:** Abril 2026  
**Stack:** Vue 3 + Express + PostgreSQL + Prisma

---

## 1. Descripción general

Aplicación web para publicitar y contratar servicios industriales (pintura, soldadura, eléctrico, mantenimiento, limpieza, entre otros), orientada a empresas. Los proveedores de servicios publican su perfil y los clientes empresariales los buscan, evalúan y contactan. Cada proveedor cuenta con un score de confiabilidad calculado a partir de reseñas verificadas, historial de actividad y documentación validada.

---

## 2. Actores del sistema

### 2.1 Empresa cliente
Organización que busca contratar servicios externos. Puede buscar proveedores, ver perfiles, enviar solicitudes de cotización y dejar reseñas tras completar un trabajo.

### 2.2 Proveedor de servicios
Empresa o persona natural que ofrece uno o más servicios. Crea y gestiona su perfil, recibe solicitudes de contacto y acumula puntuación de confiabilidad.

### 2.3 Administrador de plataforma
Rol interno que modera perfiles, valida documentación, gestiona categorías y puede suspender o destacar proveedores.

---

## 3. Módulos funcionales

### 3.1 Directorio y búsqueda

- Listado paginado de proveedores con vista de tarjetas.
- Filtros por categoría de servicio, región geográfica y rango de score.
- Búsqueda por palabra clave (nombre, descripción, tags).
- Ordenamiento por relevancia, score, o fecha de registro.
- Vista de mapa opcional (v2).

### 3.2 Perfil del proveedor

- Nombre, logo y descripción del negocio.
- Listado de servicios ofrecidos con descripción por cada uno.
- Cobertura geográfica (regiones o comunas).
- Portfolio: galería de fotos de trabajos realizados.
- Datos de contacto: teléfono, correo, sitio web.
- Score de confiabilidad visible con badge (Oro / Plata / Bronce).
- Historial de reseñas con paginación.

### 3.3 Sistema de puntuación (score de confiabilidad)

El score se calcula automáticamente combinando tres factores:

| Factor | Peso | Descripción |
|---|---|---|
| Reseñas de clientes | 50% | Promedio de calificaciones 1–5 de clientes verificados |
| Verificación documental | 30% | RUT, inicio de actividades, seguro de responsabilidad |
| Actividad en plataforma | 20% | Tiempo de respuesta promedio, trabajos completados |

El score final se traduce en un badge:

- **Oro:** score ≥ 4.5
- **Plata:** score entre 3.5 y 4.4
- **Bronce:** score entre 2.5 y 3.4
- Sin badge si score < 2.5 o sin datos suficientes.

### 3.4 Contacto y cotización

- Formulario de solicitud de contacto asociado a un proveedor.
- Campos: nombre contacto, empresa, servicio requerido, descripción, teléfono, correo.
- Notificación por correo al proveedor al recibir una solicitud (Nodemailer).
- Bandeja de solicitudes recibidas en el panel del proveedor.
- Estado de solicitud: pendiente, respondida, cerrada.

### 3.5 Panel del proveedor

- Edición de perfil y servicios.
- Subida y gestión de imágenes del portfolio (Cloudinary).
- Vista de solicitudes recibidas con detalle.
- Historial de reseñas recibidas.
- Indicador de completitud del perfil (incentiva llenar todos los campos).

### 3.6 Panel de administración

- Listado de proveedores con filtro por estado (pendiente, activo, suspendido).
- Aprobación o rechazo de nuevos proveedores.
- Verificación de documentos adjuntos.
- Moderación de reseñas (eliminar abusivas o falsas).
- Gestión de categorías de servicio.
- Métricas básicas: total de proveedores, solicitudes enviadas, reseñas del mes.

---

## 4. Requerimientos no funcionales

### 4.1 Seguridad

- Autenticación con JWT (access token + refresh token).
- Roles definidos: `empresa`, `proveedor`, `admin`.
- Rate limiting en endpoints de autenticación.
- Validación de inputs en backend con Zod.
- HTTPS obligatorio en producción.
- Solo el propio proveedor puede editar su perfil.
- Solo empresas con historial de contacto pueden dejar reseña (v2: validación estricta).

### 4.2 Rendimiento

- Paginación en todos los listados (máximo 20 items por página).
- Índices en PostgreSQL sobre `score`, `categoria`, `region`, `created_at`.
- Imágenes servidas desde CDN (Cloudinary).
- Lazy loading de imágenes en el frontend.

### 4.3 Usabilidad

- Diseño responsive (móvil, tablet y escritorio).
- Tiempo de carga inicial < 3 segundos en red estándar.
- Mensajes de error claros en formularios.
- Formularios con validación en el cliente antes de enviar al servidor.

---

## 5. Arquitectura técnica

### 5.1 Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Vue 3 + Vite + Vue Router + Pinia |
| Estilos | Tailwind CSS |
| HTTP client | Axios |
| Backend | Node.js + Express |
| Validación | Zod |
| ORM | Prisma |
| Base de datos | PostgreSQL |
| Autenticación | JWT (jsonwebtoken) |
| Correo | Nodemailer |
| Imágenes | Cloudinary |
| Pagos (v2) | Stripe |
| Contenedores | Docker + Docker Compose |

### 5.2 Estructura del proyecto (monorepo)

```
/proyecto-raiz
├── /frontend
│   ├── /src
│   │   ├── /views          # Páginas: Home, Directorio, Perfil, Login, Panel...
│   │   ├── /components     # Componentes reutilizables
│   │   ├── /stores         # Estado global con Pinia
│   │   ├── /router         # Vue Router con guards por rol
│   │   ├── /services       # Llamadas a la API (Axios)
│   │   └── /composables    # Lógica reutilizable (useAuth, useFilters...)
│   ├── vite.config.js
│   └── .env
├── /backend
│   ├── /src
│   │   ├── /routes         # Definición de endpoints
│   │   ├── /controllers    # Lógica de cada endpoint
│   │   ├── /services       # Lógica de negocio (score, notificaciones...)
│   │   ├── /middleware     # Auth JWT, errores, rate limit, CORS
│   │   └── /validators     # Esquemas Zod por recurso
│   ├── /prisma
│   │   ├── schema.prisma
│   │   └── /migrations
│   └── .env
├── docker-compose.yml
└── README.md
```

### 5.3 Endpoints principales de la API

#### Auth
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Registro de usuario | No |
| POST | `/api/auth/login` | Login, devuelve JWT | No |
| POST | `/api/auth/refresh` | Renueva access token | No |

#### Proveedores
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/api/providers` | Listar con filtros y paginación | No |
| GET | `/api/providers/:id` | Perfil público + score | No |
| POST | `/api/providers` | Crear perfil proveedor | Proveedor |
| PUT | `/api/providers/:id` | Editar perfil | Proveedor (propio) |

#### Reseñas
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/api/providers/:id/reviews` | Reseñas paginadas | No |
| POST | `/api/providers/:id/reviews` | Crear reseña | Empresa |

#### Solicitudes
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/api/inquiries` | Enviar solicitud de contacto | Empresa |
| GET | `/api/inquiries/received` | Solicitudes recibidas | Proveedor |
| PATCH | `/api/inquiries/:id/status` | Actualizar estado | Proveedor |

#### Administración
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| PATCH | `/api/admin/providers/:id/status` | Aprobar o suspender | Admin |
| DELETE | `/api/admin/reviews/:id` | Eliminar reseña abusiva | Admin |
| GET | `/api/admin/stats` | Métricas generales | Admin |

### 5.4 Modelo de datos principal (Prisma)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      Role     @default(EMPRESA)
  createdAt DateTime @default(now())
  provider  Provider?
  reviews   Review[]
  inquiries Inquiry[]
}

model Provider {
  id          String    @id @default(uuid())
  userId      String    @unique
  user        User      @relation(fields: [userId], references: [id])
  name        String
  description String?
  region      String
  score       Float     @default(0)
  badge       Badge?
  verified    Boolean   @default(false)
  status      Status    @default(PENDING)
  services    Service[]
  reviews     Review[]
  inquiries   Inquiry[]
  createdAt   DateTime  @default(now())
}

model Service {
  id          String   @id @default(uuid())
  providerId  String
  provider    Provider @relation(fields: [providerId], references: [id])
  category    Category
  description String?
}

model Review {
  id         String   @id @default(uuid())
  providerId String
  provider   Provider @relation(fields: [providerId], references: [id])
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  rating     Int      // 1–5
  comment    String?
  verified   Boolean  @default(false)
  createdAt  DateTime @default(now())
}

model Inquiry {
  id          String        @id @default(uuid())
  providerId  String
  provider    Provider      @relation(fields: [providerId], references: [id])
  userId      String
  user        User          @relation(fields: [userId], references: [id])
  service     String
  description String
  status      InquiryStatus @default(PENDING)
  createdAt   DateTime      @default(now())
}

enum Role     { EMPRESA PROVEEDOR ADMIN }
enum Status   { PENDING ACTIVE SUSPENDED }
enum Badge    { GOLD SILVER BRONZE }
enum Category { PINTURA SOLDADURA ELECTRICO MANTENIMIENTO LIMPIEZA OTRO }
enum InquiryStatus { PENDING REPLIED CLOSED }
```

---

## 6. Modelo de negocio

### 6.1 Plan gratuito (proveedor)
- Perfil básico con una categoría de servicio.
- Datos de contacto visibles.
- Aparece en resultados de búsqueda sin prioridad.

### 6.2 Plan premium (proveedor)
- Perfil destacado en búsquedas.
- Portfolio con hasta 20 fotos.
- Estadísticas de visitas al perfil.
- Badge de proveedor verificado.

### 6.3 Leads (opcional, v2)
- El proveedor paga por solicitud de cotización recibida.
- O comisión mensual por cupo de leads incluidos.

---

## 7. Alcance del MVP

El MVP (primera versión funcional) incluye:

1. Registro y login de empresas y proveedores (JWT).
2. Creación y edición de perfil de proveedor.
3. Directorio público con búsqueda y filtros básicos (categoría y región).
4. Formulario de contacto/cotización con notificación por correo.
5. Score de confiabilidad basado en reseñas (sin verificación documental aún).
6. Panel básico del proveedor (ver solicitudes, editar perfil).
7. Panel de administración mínimo (aprobar/suspender proveedores).

Quedan para v2: verificación documental, mensajería interna, planes de pago, comisión por leads, vista de mapa.

---

## 8. Variables de entorno

### Backend (`.env`)
```
DATABASE_URL=postgresql://user:password@localhost:5432/directorio_b2b
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
PORT=3000
```

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:3000/api
```
