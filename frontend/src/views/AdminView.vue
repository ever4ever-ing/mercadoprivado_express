<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  getStats,
  listAdminProviders,
  updateProviderStatus,
  deleteReview,
  type AdminProvider,
  type AdminStats
} from '@/services/admin'

const auth   = useAuthStore()
const router = useRouter()

const stats     = ref<AdminStats | null>(null)
const providers = ref<AdminProvider[]>([])
const total     = ref(0)
const page      = ref(1)
const statusFilter = ref('')
const loadingProviders = ref(false)
const actionError      = ref<string | null>(null)

const STATUS_LABELS: Record<string, string> = {
  ACTIVE:    'Activo',
  PENDING:   'Pendiente',
  SUSPENDED: 'Suspendido'
}
const STATUS_COLORS: Record<string, string> = {
  ACTIVE:    'bg-emerald-100 text-emerald-800',
  PENDING:   'bg-yellow-100 text-yellow-800',
  SUSPENDED: 'bg-red-100 text-red-800'
}

async function loadStats() {
  stats.value = await getStats()
}

async function loadProviders() {
  loadingProviders.value = true
  actionError.value = null
  try {
    const res = await listAdminProviders(page.value, statusFilter.value || undefined)
    providers.value = res.data
    total.value     = res.total
  } finally {
    loadingProviders.value = false
  }
}

async function setStatus(provider: AdminProvider, status: string) {
  actionError.value = null
  try {
    await updateProviderStatus(provider.id, status)
    provider.status = status as AdminProvider['status']
    await loadStats()
  } catch {
    actionError.value = 'No se pudo actualizar el estado.'
  }
}

async function removeReview(reviewId: string, providerId: string) {
  if (!confirm('¿Eliminar esta reseña?')) return
  actionError.value = null
  try {
    await deleteReview(reviewId)
    // Actualizar el contador en el proveedor correspondiente
    const p = providers.value.find(p => p.id === providerId)
    if (p) p._count.reviews = Math.max(0, p._count.reviews - 1)
    await loadStats()
  } catch {
    actionError.value = 'No se pudo eliminar la reseña.'
  }
}

watch(statusFilter, () => { page.value = 1; loadProviders() })

onMounted(async () => {
  if (auth.user?.role !== 'ADMIN') {
    router.replace({ name: 'home' })
    return
  }
  await Promise.all([loadStats(), loadProviders()])
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8 space-y-8">
    <h1 class="text-2xl font-bold text-gray-900">Panel de administración</h1>

    <!-- Stats -->
    <section v-if="stats" class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg shadow p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Proveedores</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.providers.total }}</p>
        <p class="text-xs text-gray-500 mt-1">
          {{ stats.providers.active }} activos · {{ stats.providers.pending }} pendientes
        </p>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Suspendidos</p>
        <p class="text-2xl font-bold text-red-600 mt-1">{{ stats.providers.suspended }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Solicitudes</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.inquiries.total }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ stats.inquiries.lastMonth }} este mes</p>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Reseñas</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.reviews.total }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ stats.reviews.lastMonth }} este mes</p>
      </div>
    </section>

    <!-- Proveedores -->
    <section class="bg-white rounded-lg shadow">
      <div class="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-gray-900">Proveedores</h2>
        <select
          v-model="statusFilter"
          class="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todos los estados</option>
          <option value="PENDING">Pendientes</option>
          <option value="ACTIVE">Activos</option>
          <option value="SUSPENDED">Suspendidos</option>
        </select>
      </div>

      <p v-if="actionError" class="px-5 py-3 text-sm text-red-600 bg-red-50">{{ actionError }}</p>

      <div v-if="loadingProviders" class="p-6 text-sm text-gray-500">Cargando...</div>

      <div v-else-if="!providers.length" class="p-6 text-sm text-gray-500">
        No hay proveedores con ese filtro.
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="p in providers"
          :key="p.id"
          class="px-5 py-4 flex flex-wrap items-start justify-between gap-4"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="font-medium text-gray-900 text-sm">{{ p.businessName }}</p>
              <span
                class="text-xs px-2 py-0.5 rounded-full font-medium"
                :class="STATUS_COLORS[p.status]"
              >
                {{ STATUS_LABELS[p.status] }}
              </span>
            </div>
            <p class="text-xs text-gray-500 mt-0.5">{{ p.user.email }}</p>
            <p class="text-xs text-gray-400 mt-0.5">
              Score {{ p.score.toFixed(1) }} ·
              {{ p._count.reviews }} reseñas ·
              {{ p._count.inquiries }} solicitudes ·
              desde {{ new Date(p.createdAt).toLocaleDateString('es-CL') }}
            </p>
          </div>

          <div class="flex items-center gap-2 flex-wrap shrink-0">
            <button
              v-if="p.status !== 'ACTIVE'"
              @click="setStatus(p, 'ACTIVE')"
              class="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            >
              Activar
            </button>
            <button
              v-if="p.status !== 'PENDING'"
              @click="setStatus(p, 'PENDING')"
              class="px-3 py-1.5 text-xs bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            >
              Pendiente
            </button>
            <button
              v-if="p.status !== 'SUSPENDED'"
              @click="setStatus(p, 'SUSPENDED')"
              class="px-3 py-1.5 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Suspender
            </button>
          </div>
        </div>
      </div>

      <!-- Paginación -->
      <div v-if="total > 20" class="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
        <p class="text-xs text-gray-500">{{ total }} proveedores en total</p>
        <div class="flex gap-2">
          <button
            :disabled="page === 1"
            @click="page--; loadProviders()"
            class="px-3 py-1.5 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
          >
            Anterior
          </button>
          <button
            :disabled="page * 20 >= total"
            @click="page++; loadProviders()"
            class="px-3 py-1.5 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
