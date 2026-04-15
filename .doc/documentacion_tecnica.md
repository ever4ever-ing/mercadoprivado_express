# Documentación Técnica — Mercado Privado Chile

**Versión:** 1.1  
**Fecha:** Abril 2026  
**Stack:** Vue 3 + Express + PostgreSQL + Prisma

---

## 1. Descripción general

Directorio B2B de servicios industriales. Las **empresas cliente** buscan y contratan proveedores. Los **proveedores** publican su perfil y acumulan reputación mediante reseñas. Un **administrador** modera la plataforma.

---

## 2. Arquitectura

```
frontend/ (Vue 3 + Vite)          backend/ (Node.js + Express)
├── views/                         ├── routes/
├── components/                    ├── controllers/
├── stores/ (Pinia)           ←→   ├── services/
├── services/ (Axios)              ├── middleware/
├── router/ (Vue Router)           ├── validators/ (Zod)
└── types/                         └── prisma/ (PostgreSQL)
```

El frontend se comunica con el backend exclusivamente vía REST (`/api/*`). No hay SSR — el backend sirve solo JSON.

---

## 3. Autenticación

### Flujo
1. El usuario llama a `POST /api/auth/login` con email y contraseña.
2. El backend devuelve un **access token** (JWT, 15 min) y un **refresh token** (JWT, 7 días).
3. El frontend guarda ambos en `localStorage` y adjunta el access token como `Authorization: Bearer <token>` en cada petición (interceptor de Axios).
4. Cuando el access token expira, Axios reintenta con `POST /api/auth/refresh` usando el refresh token.

### Roles
| Rol | Descripción |
|-----|-------------|
| `EMPRESA` | Busca proveedores, envía solicitudes, escribe reseñas |
| `PROVEEDOR` | Gestiona su perfil, recibe y gestiona solicitudes |
| `ADMIN` | Modera proveedores, documentos y reseñas |

El rol se incluye en el JWT y se valida en cada endpoint mediante el middleware `requireRole`.

---

## 4. Módulos funcionales

### 4.1 Directorio público
- Listado paginado de proveedores con estado `ACTIVE`.
- Filtros: palabra clave, categoría de servicio, región, score mínimo.
- Ordenamiento: por score, fecha de registro o nombre.
- Ruta: `GET /api/providers`

### 4.2 Perfil del proveedor
- Muestra: nombre, descripción, servicios, portfolio, score, badge, reseñas (últimas 5) y contacto.
- El campo `verified` en el perfil equivale a `profileComplete` — indica que el proveedor llenó todos sus datos.
- Ruta: `GET /api/providers/:id`

### 4.3 Sistema de score

El score es un número de **0 a 5** calculado automáticamente cada vez que se crea o elimina una reseña.

**Fórmula actual:**
```
score = promedio ponderado de reseñas no reportadas
```

Las **reseñas verificadas** tienen peso 2, las no verificadas peso 1:
```
score = Σ(rating × peso) / Σ(peso)
```

**Insignias:**
| Badge | Condición |
|-------|-----------|
| Oro   | score ≥ 4.5 y mínimo 2 reseñas |
| Plata | score ≥ 3.5 y mínimo 2 reseñas |
| Bronce | score ≥ 2.5 y mínimo 2 reseñas |
| Sin badge | score < 2.5 o menos de 2 reseñas |

Cada cambio de score queda registrado en la tabla `ScoreLog` para auditoría.

### 4.4 Reseñas verificadas

Una reseña se marca `verified: true` automáticamente si existe al menos una **Inquiry cerrada** (`status: CLOSED`) entre la empresa que escribe la reseña y el proveedor reseñado. Esto garantiza que la empresa efectivamente contrató al proveedor.

Flujo:
1. Empresa envía solicitud de contacto (`Inquiry`).
2. Proveedor atiende y cierra la solicitud.
3. Empresa escribe reseña → el sistema detecta la inquiry cerrada → `verified: true`.

Solo usuarios con rol `EMPRESA` pueden escribir reseñas. Un proveedor no puede reseñar su propio perfil. Solo se permite una reseña por empresa por proveedor.

### 4.5 Solicitudes de contacto (Inquiries)

1. Empresa completa formulario con: nombre, empresa, servicio requerido, descripción, teléfono, correo.
2. Backend guarda la solicitud y envía notificación por email al proveedor (Nodemailer).
3. El proveedor ve la solicitud en su panel y puede cambiar el estado a `REPLIED` o `CLOSED`.
4. Una solicitud `CLOSED` habilita la posibilidad de reseña verificada.

Estados: `PENDING` → `REPLIED` → `CLOSED`

### 4.6 Panel del proveedor
- Edición de perfil y servicios.
- Gestión de portfolio de imágenes (Cloudinary).
- Bandeja de solicitudes recibidas con detalle y cambio de estado.
- Historial de reseñas recibidas.

### 4.7 Panel de administración
- Listar proveedores por estado (pendiente, activo, suspendido).
- Aprobar o suspender proveedores (`PATCH /api/admin/providers/:id/status`).
- Verificar documentos adjuntos (`PATCH /api/admin/documents/:id/status`).
- Eliminar reseñas abusivas (`DELETE /api/admin/reviews/:id`).
- Ver métricas generales: total proveedores, solicitudes e-mail enviadas, reseñas del mes.

---

## 5. Modelo de datos

```
User ─────────────── Provider (1:1)
  │                      │
  ├── ReviewAuthor        ├── Review[]
  └── InquirySender       ├── Inquiry[]
                          ├── Service[]
                          ├── PortfolioImage[]
                          ├── ProviderDocument[]
                          └── ScoreLog[]
```

**Tablas principales:**

| Tabla | Descripción |
|-------|-------------|
| `users` | Cuentas (email, password hash, rol) |
| `providers` | Perfiles de proveedor con score y badge |
| `services` | Servicios ofrecidos por proveedor (categoría + descripción) |
| `reviews` | Reseñas con rating 1–5, flag `verified` y `reported` |
| `inquiries` | Solicitudes de contacto con estado |
| `provider_documents` | Documentos adjuntos (RUT, seguros, etc.) |
| `portfolio_images` | Imágenes del portfolio en Cloudinary |
| `score_logs` | Historial de cambios de score |
| `refresh_tokens` | Tokens de sesión activos |

---

## 6. API — Endpoints

### Auth
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Registro | No |
| POST | `/api/auth/login` | Login, devuelve tokens | No |
| POST | `/api/auth/refresh` | Renueva access token | No |
| POST | `/api/auth/logout` | Invalida refresh token | No |

### Proveedores
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/providers` | Listar con filtros y paginación | No |
| GET | `/api/providers/:id` | Perfil público | No |
| GET | `/api/providers/me/profile` | Perfil del proveedor autenticado | Proveedor |
| POST | `/api/providers` | Crear perfil | Proveedor |
| PUT | `/api/providers/:id` | Editar perfil | Proveedor (propio) |
| GET | `/api/providers/:id/reviews` | Reseñas paginadas | No |
| POST | `/api/providers/:id/reviews` | Crear reseña | Empresa |

### Solicitudes
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/inquiries` | Enviar solicitud | Empresa |
| GET | `/api/inquiries/received` | Solicitudes recibidas | Proveedor |
| PATCH | `/api/inquiries/:id/status` | Cambiar estado | Proveedor |

### Administración
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/admin/providers` | Listar todos | Admin |
| PATCH | `/api/admin/providers/:id/status` | Aprobar/suspender | Admin |
| DELETE | `/api/admin/reviews/:id` | Eliminar reseña | Admin |
| PATCH | `/api/admin/documents/:id/status` | Verificar documento | Admin |
| GET | `/api/admin/stats` | Métricas generales | Admin |

---

## 7. Variables de entorno

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=noreply@mercadoprivadochile.cl
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:3000/api
```

---

## 8. Mejoras propuestas

### Alta prioridad

**8.1 Respuesta del proveedor a reseñas**  
Actualmente el proveedor no puede responder públicamente a una reseña. Agregar campo `providerReply` en la tabla `reviews` y un endpoint `PATCH /api/reviews/:id/reply` restringido al proveedor dueño del perfil. Genera confianza y mejora la percepción pública.

**8.2 Paginación de reseñas en el perfil**  
El perfil público solo muestra las últimas 5 reseñas y no hay botón "ver más". El endpoint `GET /api/providers/:id/reviews` ya soporta paginación — falta exponerla en el frontend.

**8.3 Indicador de completitud del perfil**  
El campo `profileComplete` existe en la BD pero no hay lógica que lo calcule. Implementar una función que evalúe si el proveedor tiene: descripción, logo, al menos un servicio, teléfono o sitio web, y al menos una imagen de portfolio. Mostrar barra de progreso en el panel del proveedor.

**8.4 Notificación por email al recibir reseña**  
El proveedor no recibe aviso cuando le dejan una reseña. Agregar envío de email en `createReview` usando el `mail.service` existente.

**8.5 Panel de administración en el frontend**  
El backend de administración está completo pero el frontend no tiene vistas de administración. Es necesario crear rutas y vistas para: lista de proveedores, cambio de estado, verificación de documentos y métricas.

---

### Media prioridad

**8.6 Tiempo de respuesta promedio (responseTimeHs)**  
El campo existe en la BD pero nunca se actualiza. Calcular automáticamente cuando el proveedor cambia el estado de una inquiry a `REPLIED`: diferencia entre `createdAt` y `repliedAt`. Mostrar en el perfil como "responde en promedio en X horas".

**8.7 Reporte de reseñas abusivas por parte de proveedores**  
Hoy solo el admin puede eliminar reseñas. Agregar endpoint `POST /api/reviews/:id/report` (solo proveedores, sobre sus propias reseñas) que marque `reported: true` y genere una notificación al admin para revisión.

**8.8 Búsqueda por texto completo**  
El filtro de búsqueda actual usa `ILIKE` con `%texto%` en tres campos. Para mayor rendimiento y relevancia, migrar a búsqueda full-text de PostgreSQL (`tsvector` + `tsquery`) o integrar un índice GIN.

**8.9 Caché de listado de proveedores**  
El listado es la página más consultada. Implementar caché en memoria (Redis o simple `node-cache`) con TTL de 60 segundos para la query de `GET /api/providers` con filtros frecuentes.

**8.10 Refresh automático del access token**  
El interceptor de Axios reintenta la petición fallida pero no hace cola si hay múltiples peticiones simultáneas que expiran a la vez, generando múltiples llamadas a `/refresh`. Implementar un mutex para serializar los refrescos.

---

### Baja prioridad / v2

**8.11 Vista de mapa de proveedores**  
Ya está mencionado en los requerimientos. Integrar Leaflet + OpenStreetMap con coordenadas por región/ciudad. No requiere GPS preciso — alcanza con centroide por ciudad.

**8.12 Planes de suscripción para proveedores (Stripe)**  
Plataforma preparada para ello (`featuredUntil` en la BD). Integrar Stripe Checkout con dos planes: básico (gratuito) y premium (perfil destacado en búsquedas + más fotos en portfolio).

**8.13 Mensajería interna**  
Reemplazar el flujo actual de inquiry por correo con un chat asincrónico dentro de la plataforma. Requiere tabla `messages` y WebSocket (Socket.io) o polling.

**8.14 Estadísticas de visitas al perfil**  
Registrar vistas únicas por proveedor (por IP o por usuario autenticado) en una tabla `profile_views`. Mostrar en el panel del proveedor: visitas del mes, conversiones a inquiry.

**8.15 Exportar solicitudes a CSV**  
El proveedor debería poder descargar su historial de inquiries en formato CSV para integrarlo con su CRM o herramientas externas.
