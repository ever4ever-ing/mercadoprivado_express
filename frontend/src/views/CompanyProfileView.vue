<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const loggingOut = ref(false)

const roleLabel = computed(() => {
  if (auth.user?.role === 'EMPRESA') return 'Empresa'
  if (auth.user?.role === 'PROVEEDOR') return 'Proveedor'
  return 'Administrador'
})

if (!auth.isAuthenticated) {
  router.replace({ name: 'login' })
}

async function goToDirectory() {
  await router.push({ name: 'directorio' })
}

async function doLogout() {
  loggingOut.value = true
  try {
    await auth.logout()
    await router.push({ name: 'home' })
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <div class="bg-white rounded-lg shadow p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-1">Perfil de empresa</h1>
      <p class="text-sm text-gray-500 mb-6">Información de tu cuenta para solicitar cotizaciones.</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div class="bg-gray-50 rounded-md p-3">
          <p class="text-xs uppercase tracking-wide text-gray-500">Nombre</p>
          <p class="font-semibold text-gray-900 mt-1">{{ auth.user?.name || '-' }}</p>
        </div>
        <div class="bg-gray-50 rounded-md p-3">
          <p class="text-xs uppercase tracking-wide text-gray-500">Email</p>
          <p class="font-semibold text-gray-900 mt-1">{{ auth.user?.email || '-' }}</p>
        </div>
        <div class="bg-gray-50 rounded-md p-3">
          <p class="text-xs uppercase tracking-wide text-gray-500">Tipo de cuenta</p>
          <p class="font-semibold text-gray-900 mt-1">{{ roleLabel }}</p>
        </div>
        <div class="bg-gray-50 rounded-md p-3">
          <p class="text-xs uppercase tracking-wide text-gray-500">Estado sesión</p>
          <p class="font-semibold text-emerald-700 mt-1">Activa</p>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap gap-2">
        <button class="btn-primary" @click="goToDirectory">
          <i class="fas fa-search"></i>
          Buscar proveedores
        </button>
        <button class="btn-outline" :disabled="loggingOut" @click="doLogout">
          <i class="fas fa-sign-out-alt"></i>
          <span v-if="loggingOut">Saliendo...</span>
          <span v-else>Cerrar sesión</span>
        </button>
      </div>
    </div>
  </div>
</template>
