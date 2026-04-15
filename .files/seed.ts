// prisma/seed.ts
// Ejecutar con: npx prisma db seed

import { PrismaClient, Role, ProviderStatus, Category, Badge } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // ── Admin ────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@directorio.cl' },
    update: {},
    create: {
      email: 'admin@directorio.cl',
      password: await bcrypt.hash('Admin1234!', 10),
      name: 'Administrador',
      role: Role.ADMIN,
    },
  })
  console.log('✅ Admin creado:', admin.email)

  // ── Empresa cliente ──────────────────────────────────────
  const empresa = await prisma.user.upsert({
    where: { email: 'empresa@demo.cl' },
    update: {},
    create: {
      email: 'empresa@demo.cl',
      password: await bcrypt.hash('Empresa1234!', 10),
      name: 'Constructora Demo SpA',
      role: Role.EMPRESA,
      phone: '+56912345678',
    },
  })
  console.log('✅ Empresa creada:', empresa.email)

  // ── Proveedor demo ───────────────────────────────────────
  const proveedorUser = await prisma.user.upsert({
    where: { email: 'proveedor@demo.cl' },
    update: {},
    create: {
      email: 'proveedor@demo.cl',
      password: await bcrypt.hash('Proveedor1234!', 10),
      name: 'Juan Pérez',
      role: Role.PROVEEDOR,
      phone: '+56987654321',
    },
  })

  const proveedor = await prisma.provider.upsert({
    where: { userId: proveedorUser.id },
    update: {},
    create: {
      userId: proveedorUser.id,
      businessName: 'Servicios Integrales JPM',
      description: 'Empresa con más de 10 años de experiencia en pintura industrial, soldadura y mantenimiento general para empresas de la región.',
      region: 'Araucanía',
      city: 'Temuco',
      score: 4.6,
      badge: Badge.GOLD,
      reviewCount: 3,
      status: ProviderStatus.ACTIVE,
      profileComplete: true,
      services: {
        create: [
          { category: Category.PINTURA, title: 'Pintura industrial', description: 'Pintura de naves industriales, bodegas y estructuras metálicas.' },
          { category: Category.SOLDADURA, title: 'Soldadura MIG/TIG', description: 'Soldadura de estructuras, reparación y fabricación de piezas metálicas.' },
          { category: Category.MANTENIMIENTO, title: 'Mantenimiento preventivo', description: 'Planes de mantenimiento mensual para plantas industriales.' },
        ],
      },
    },
  })

  // Reseña demo
  await prisma.review.upsert({
    where: { providerId_authorId: { providerId: proveedor.id, authorId: empresa.id } },
    update: {},
    create: {
      providerId: proveedor.id,
      authorId: empresa.id,
      rating: 5,
      comment: 'Excelente trabajo, cumplieron plazos y la calidad fue muy buena. Totalmente recomendados.',
      verified: true,
    },
  })

  console.log('✅ Proveedor creado:', proveedorUser.email)
  console.log('\n🎉 Seed completado exitosamente.')
  console.log('\n📋 Credenciales de acceso:')
  console.log('   Admin:     admin@directorio.cl     / Admin1234!')
  console.log('   Empresa:   empresa@demo.cl         / Empresa1234!')
  console.log('   Proveedor: proveedor@demo.cl       / Proveedor1234!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
