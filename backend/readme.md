cd backend
cp .env.example .env        # completar DATABASE_URL y JWT_SECRET
npm run db:migrate           # crea las tablas
npm run db:seed              # datos de prueba
npm run dev                  # http://localhost:3000
