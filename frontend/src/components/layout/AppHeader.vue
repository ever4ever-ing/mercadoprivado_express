<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const mobileMenuOpen = ref(false)
const auth = useAuthStore()

async function onLogout() {
  try {
    await auth.logout()
  } finally {
    mobileMenuOpen.value = false
  }
}
</script>

<template>
  <header class="bg-primary-700 text-white shadow-md">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <!-- Logo -->
      <RouterLink
        to="/"
        class="flex items-center gap-2 font-bold text-lg hover:opacity-90 transition-opacity"
      >
        <i class="fas fa-industry text-xl"></i>
        <span class="hidden sm:inline">Mercado Privado Chile</span>
        <span class="sm:hidden">MPC</span>
      </RouterLink>

      <!-- Desktop nav -->
      <nav class="hidden md:flex items-center gap-6 text-sm font-medium">
        <RouterLink
          to="/"
          :class="route.name === 'home' ? 'text-white' : 'text-primary-100 hover:text-white'"
          class="transition-colors"
        >
          Inicio
        </RouterLink>
        <RouterLink
          to="/directorio"
          :class="route.name === 'directorio' ? 'text-white' : 'text-primary-100 hover:text-white'"
          class="transition-colors"
        >
          Directorio
        </RouterLink>
        <RouterLink
          v-if="!auth.isAuthenticated"
          to="/login"
          :class="route.name === 'login' ? 'text-white' : 'text-primary-100 hover:text-white'"
          class="transition-colors"
        >
          Ingresar
        </RouterLink>
        <RouterLink
          v-if="!auth.isAuthenticated"
          to="/registro"
          :class="route.name === 'registro' ? 'text-white' : 'text-primary-100 hover:text-white'"
          class="transition-colors"
        >
          Registro
        </RouterLink>
        <span v-if="auth.isAuthenticated" class="text-primary-100">
          Hola, {{ auth.user?.name }}
        </span>
        <RouterLink
          v-if="auth.isAuthenticated && auth.user?.role === 'ADMIN'"
          to="/admin"
          :class="route.name === 'admin' ? 'text-white' : 'text-primary-100 hover:text-white'"
          class="transition-colors font-semibold"
        >
          Panel Admin
        </RouterLink>
        <RouterLink
          v-if="auth.isAuthenticated && auth.user?.role !== 'ADMIN'"
          :to="auth.user?.role === 'PROVEEDOR' ? '/perfil/proveedor' : '/perfil/empresa'"
          :class="(route.name === 'perfil-proveedor' || route.name === 'perfil-empresa') ? 'text-white' : 'text-primary-100 hover:text-white'"
          class="transition-colors"
        >
          Mi perfil
        </RouterLink>
        <button
          v-if="auth.isAuthenticated"
          class="text-primary-100 hover:text-white transition-colors"
          @click="onLogout"
        >
          Salir
        </button>
        <RouterLink
          v-if="auth.isAuthenticated && auth.user?.role === 'PROVEEDOR'"
          to="/perfil/proveedor"
          class="bg-white text-primary-700 px-4 py-1.5 rounded-md hover:bg-primary-50 transition-colors font-semibold"
        >
          Publicar servicio
        </RouterLink>
      </nav>

      <!-- Mobile menu button -->
      <button
        class="md:hidden p-2 rounded-md hover:bg-primary-600 transition-colors"
        @click="mobileMenuOpen = !mobileMenuOpen"
        :aria-label="mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'"
      >
        <i :class="mobileMenuOpen ? 'fas fa-times' : 'fas fa-bars'" class="text-lg w-5"></i>
      </button>
    </div>

    <!-- Mobile menu -->
    <div
      v-if="mobileMenuOpen"
      class="md:hidden border-t border-primary-600 px-4 py-3 flex flex-col gap-3 text-sm"
    >
      <RouterLink
        to="/"
        @click="mobileMenuOpen = false"
        class="hover:text-primary-200 transition-colors py-1"
      >
        <i class="fas fa-home mr-2 w-4"></i>Inicio
      </RouterLink>
      <RouterLink
        to="/directorio"
        @click="mobileMenuOpen = false"
        class="hover:text-primary-200 transition-colors py-1"
      >
        <i class="fas fa-list mr-2 w-4"></i>Directorio
      </RouterLink>
      <RouterLink
        v-if="!auth.isAuthenticated"
        to="/login"
        @click="mobileMenuOpen = false"
        class="hover:text-primary-200 transition-colors py-1"
      >
        <i class="fas fa-sign-in-alt mr-2 w-4"></i>Ingresar
      </RouterLink>
      <RouterLink
        v-if="!auth.isAuthenticated"
        to="/registro"
        @click="mobileMenuOpen = false"
        class="hover:text-primary-200 transition-colors py-1"
      >
        <i class="fas fa-user-plus mr-2 w-4"></i>Registro
      </RouterLink>
      <RouterLink
        v-if="auth.isAuthenticated && auth.user?.role === 'ADMIN'"
        to="/admin"
        @click="mobileMenuOpen = false"
        class="hover:text-primary-200 transition-colors py-1 font-semibold"
      >
        <i class="fas fa-shield-alt mr-2 w-4"></i>Panel Admin
      </RouterLink>
      <RouterLink
        v-if="auth.isAuthenticated && auth.user?.role !== 'ADMIN'"
        :to="auth.user?.role === 'PROVEEDOR' ? '/perfil/proveedor' : '/perfil/empresa'"
        @click="mobileMenuOpen = false"
        class="hover:text-primary-200 transition-colors py-1"
      >
        <i class="fas fa-user mr-2 w-4"></i>Mi perfil
      </RouterLink>
      <button
        v-if="auth.isAuthenticated"
        @click="onLogout"
        class="text-left hover:text-primary-200 transition-colors py-1"
      >
        <i class="fas fa-sign-out-alt mr-2 w-4"></i>Salir
      </button>
      <RouterLink
        v-if="auth.isAuthenticated && auth.user?.role === 'PROVEEDOR'"
        to="/perfil/proveedor"
        @click="mobileMenuOpen = false"
        class="mt-1 bg-white text-primary-700 px-4 py-2 rounded-md font-semibold text-center hover:bg-primary-50 transition-colors"
      >
        Publicar servicio
      </RouterLink>
    </div>
  </header>
</template>
