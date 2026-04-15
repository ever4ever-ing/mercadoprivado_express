# Frontend — Mercado Privado Chile

SPA construida con **Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS**.

---

## Requisitos

- Node.js 20+
- Backend corriendo en `http://localhost:3000`

---

## Instalación

```bash
cd frontend
npm install
cp .env.example .env   # opcional, ver variables de abajo
npm run dev            # http://localhost:5173
```

---

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `VITE_API_URL` | URL base de la API | `/api` (usa proxy de Vite en dev) |

En desarrollo no es necesario definirla — Vite proxea `/api` → `http://localhost:3000` automáticamente.

---

## Comandos

```bash
npm run dev       # servidor de desarrollo con HMR en http://localhost:5173
npm run build     # type check + build de producción → dist/
npm run preview   # preview del build de producción
```

---

## Rutas

| Ruta | Vista | Acceso |
|---|---|---|
| `/` | `HomeView` | Público |
| `/directorio` | `DirectorioView` | Público |
| `/proveedores/:id` | `ProviderDetailView` | Público |
| `/login` | `LoginView` | Solo invitados |
| `/registro` | `RegisterView` | Solo invitados |
| `/perfil/proveedor` | `ProviderProfileView` | PROVEEDOR |
| `/perfil/empresa` | `CompanyProfileView` | EMPRESA |
| `/admin` | `AdminView` | ADMIN |

### Guards de navegación

- `requiresAuth` — redirige a `/login` si no hay sesión activa
- `guestOnly` — redirige a `/` si ya hay sesión activa
- Redirección automática por rol en rutas de perfil

---

## Estructura

```
src/
├── main.ts                  # Entry point
├── App.vue                  # Root component
├── router/
│   └── index.ts             # Rutas + navigation guards
├── stores/
│   ├── auth.ts              # Sesión: JWT, refresh token, usuario
│   └── providers.ts         # Lista de proveedores, filtros, paginación
├── services/
│   ├── api.ts               # Axios: interceptores de auth y refresh token
│   ├── auth.ts              # Llamadas a /api/auth
│   ├── providers.ts         # Llamadas a /api/providers
│   └── admin.ts             # Llamadas a /api/admin
├── views/                   # Páginas (una por ruta)
├── components/
│   ├── layout/              # AppHeader, AppFooter
│   └── providers/           # ProviderCard, ProviderFilters, ScoreBadge
├── composables/             # Lógica reutilizable
└── types/                   # Tipos e interfaces TypeScript
```

---

## Autenticación

El flujo de tokens está centralizado en `services/api.ts`:

1. El interceptor de request adjunta `Authorization: Bearer <token>` en cada llamada
2. En respuesta 401, llama automáticamente a `/api/auth/refresh` (una sola vez, deduplicado)
3. Si el refresh es exitoso, reintenta el request original con el nuevo token
4. Si falla, limpia localStorage y redirige al login

Los tokens se persisten en `localStorage` mediante el store de Pinia `auth`.
