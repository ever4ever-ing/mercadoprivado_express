<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="bg-primary-700 text-white py-20 px-4">
      <div class="max-w-3xl mx-auto text-center">
        <h1 class="text-3xl md:text-4xl font-bold mb-4 leading-tight">
          El directorio B2B de servicios industriales de Chile
        </h1>
        <p class="text-lg text-primary-100 mb-8 max-w-xl mx-auto">
          Conectamos empresas con proveedores verificados de pintura, soldadura,
          electricidad, mantenimiento y más.
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <RouterLink
            to="/directorio"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-700 font-semibold rounded-md hover:bg-primary-50 transition-colors shadow"
          >
            <i class="fas fa-search"></i> Buscar proveedores
          </RouterLink>
          <RouterLink
            v-if="auth.isAuthenticated && auth.user?.role === 'PROVEEDOR'"
            to="/perfil/proveedor"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-white text-white font-semibold rounded-md hover:bg-primary-600 transition-colors"
          >
            <i class="fas fa-plus"></i> Publicar mi servicio
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="max-w-5xl mx-auto px-4 py-16">
      <h2 class="text-center text-2xl font-bold text-gray-800 mb-10">
        ¿Por qué Mercado Privado Chile?
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="text-center">
          <div
            class="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <i class="fas fa-shield-alt text-2xl text-primary-600"></i>
          </div>
          <h3 class="font-semibold text-gray-800 mb-2">Proveedores verificados</h3>
          <p class="text-gray-500 text-sm leading-relaxed">
            Cada proveedor tiene un score de confiabilidad calculado con reseñas,
            documentación y actividad en la plataforma.
          </p>
        </div>
        <div class="text-center">
          <div
            class="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <i class="fas fa-filter text-2xl text-primary-600"></i>
          </div>
          <h3 class="font-semibold text-gray-800 mb-2">Búsqueda inteligente</h3>
          <p class="text-gray-500 text-sm leading-relaxed">
            Filtra por tipo de servicio, región geográfica y nivel de score para
            encontrar al proveedor ideal.
          </p>
        </div>
        <div class="text-center">
          <div
            class="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <i class="fas fa-handshake text-2xl text-primary-600"></i>
          </div>
          <h3 class="font-semibold text-gray-800 mb-2">Contacto directo</h3>
          <p class="text-gray-500 text-sm leading-relaxed">
            Envía solicitudes de cotización y recibe respuestas directas desde el
            panel del proveedor.
          </p>
        </div>
      </div>
    </section>

    <!-- Badges section -->
    <section class="bg-gray-100 py-12 px-4">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-center text-xl font-bold text-gray-800 mb-8">
          Sistema de confiabilidad
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white rounded-lg p-5 text-center shadow-sm border border-yellow-100">
            <span
              class="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-800 border border-yellow-300 text-sm px-3 py-1 rounded-full font-medium mb-3"
            >
              <i class="fas fa-award"></i> Oro
            </span>
            <p class="text-2xl font-bold text-gray-800 mb-1">≥ 4.5</p>
            <p class="text-sm text-gray-500">Excelencia comprobada con historial verificado</p>
          </div>
          <div class="bg-white rounded-lg p-5 text-center shadow-sm border border-gray-100">
            <span
              class="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 border border-gray-300 text-sm px-3 py-1 rounded-full font-medium mb-3"
            >
              <i class="fas fa-medal"></i> Plata
            </span>
            <p class="text-2xl font-bold text-gray-800 mb-1">≥ 3.5</p>
            <p class="text-sm text-gray-500">Buen desempeño con reseñas positivas</p>
          </div>
          <div class="bg-white rounded-lg p-5 text-center shadow-sm border border-amber-50">
            <span
              class="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 border border-amber-300 text-sm px-3 py-1 rounded-full font-medium mb-3"
            >
              <i class="fas fa-certificate"></i> Bronce
            </span>
            <p class="text-2xl font-bold text-gray-800 mb-1">≥ 2.5</p>
            <p class="text-sm text-gray-500">Proveedor activo en proceso de consolidación</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 px-4">
      <div class="max-w-2xl mx-auto text-center">
        <h2 class="text-2xl font-bold text-gray-800 mb-3">
          ¿Ofreces servicios industriales?
        </h2>
        <p class="text-gray-500 mb-6">
          Crea tu perfil gratuito y comienza a recibir solicitudes de empresas en todo Chile.
        </p>
        <RouterLink
          :to="auth.isAuthenticated && auth.user?.role === 'PROVEEDOR' ? '/perfil/proveedor' : '/registro'"
          class="inline-flex items-center justify-center gap-2 px-7 py-3 bg-primary-700 text-white font-semibold rounded-md hover:bg-primary-800 transition-colors shadow"
        >
          {{ auth.isAuthenticated && auth.user?.role === 'PROVEEDOR' ? 'Publicar mi servicio' : 'Registrar cuenta de proveedor' }}
          <i class="fas fa-arrow-right"></i>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
