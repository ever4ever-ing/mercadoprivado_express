# PostgreSQL desde consola

Referencia rápida para administrar la base de datos del proyecto, tanto en local (Docker) como en EC2.

---

## Acceder a PostgreSQL en Docker

```bash
# Entrar al contenedor de la base de datos
docker exec -it mercadoprivado_db psql -U mpuser -d mercadoprivado
```

O en dos pasos:

```bash
# 1. Entrar al contenedor
docker exec -it mercadoprivado_db sh

# 2. Conectarse a psql
psql -U mpuser -d mercadoprivado
```

---

## Comandos básicos de psql

| Comando       | Descripción                          |
|---------------|--------------------------------------|
| `\l`          | Listar todas las bases de datos      |
| `\c nombre`   | Conectarse a otra base de datos      |
| `\dt`         | Listar tablas del esquema actual     |
| `\d tabla`    | Describir estructura de una tabla    |
| `\du`         | Listar usuarios/roles                |
| `\x`          | Activar/desactivar modo expandido    |
| `\q`          | Salir de psql                        |
| `\?`          | Ayuda de comandos psql               |
| `\h SELECT`   | Ayuda de un comando SQL              |

---

## Consultas frecuentes

### Ver todos los proveedores
```sql
SELECT id, "businessName", status, score FROM "Provider";
```

### Ver usuarios registrados
```sql
SELECT id, email, role, "createdAt" FROM "User" ORDER BY "createdAt" DESC;
```

### Ver reseñas
```sql
SELECT r.id, r.rating, r.comment, u.email AS autor
FROM "Review" r
JOIN "User" u ON r."authorId" = u.id
ORDER BY r."createdAt" DESC;
```

### Ver inquiries (consultas de empresas)
```sql
SELECT i.id, i.status, i.message, u.email AS empresa
FROM "Inquiry" i
JOIN "User" u ON i."companyId" = u.id
ORDER BY i."createdAt" DESC;
```

### Contar registros por tabla
```sql
SELECT
  (SELECT COUNT(*) FROM "User")     AS usuarios,
  (SELECT COUNT(*) FROM "Provider") AS proveedores,
  (SELECT COUNT(*) FROM "Review")   AS reseñas,
  (SELECT COUNT(*) FROM "Inquiry")  AS inquiries;
```

---

## Operaciones de mantenimiento

### Backup de la base de datos

```bash
# Desde fuera del contenedor
docker exec mercadoprivado_db pg_dump -U mpuser mercadoprivado > backup_$(date +%Y%m%d).sql
```

### Restaurar un backup

```bash
# 1. Copiar el archivo al contenedor
docker cp backup_20260415.sql mercadoprivado_db:/tmp/

# 2. Restaurar
docker exec -it mercadoprivado_db psql -U mpuser -d mercadoprivado -f /tmp/backup_20260415.sql
```

### Resetear la base de datos (⚠️ borra todo)

```bash
docker compose down -v          # elimina el volumen con los datos
docker compose up -d            # recrea todo desde cero (corre migraciones)
```

---

## Gestión desde el backend (Prisma)

Estos comandos se ejecutan en el directorio `backend/` o dentro del contenedor:

```bash
# Aplicar migraciones pendientes (producción)
docker exec mercadoprivado_backend npx prisma migrate deploy

# Ver estado de migraciones
docker exec mercadoprivado_backend npx prisma migrate status

# Abrir Prisma Studio (GUI web, solo desarrollo local)
cd backend && npx prisma studio
```

---

## Logs de PostgreSQL en Docker

```bash
# Ver logs en tiempo real
docker logs -f mercadoprivado_db

# Ver últimas 50 líneas
docker logs --tail 50 mercadoprivado_db
```

---

## Conexión desde cliente externo (TablePlus, DBeaver, etc.)

Para conectarte desde tu máquina local cuando corre en Docker, expón el puerto en `docker-compose.yml`:

```yaml
postgres:
  ports:
    - "5432:5432"   # agregar solo en desarrollo, no en producción
```

Luego conecta con:

| Campo    | Valor        |
|----------|--------------|
| Host     | `localhost`  |
| Port     | `5432`       |
| Database | `mercadoprivado` |
| User     | `mpuser`     |
| Password | *(la del .env)* |
