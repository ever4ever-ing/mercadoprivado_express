<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  getStats,
  listAdminProviders,
  updateProviderStatus,
  deleteReview,
  listAdminUsers,
  setUserActive,
  deleteAdminUser,
  type AdminProvider,
  type AdminUser,
  type AdminStats
} from '@/services/admin'

const auth   = useAuthStore()
const router = useRouter()

const activeTab = ref<'providers' | 'users'>('providers')

// — Stats —
const stats = ref<AdminStats | null>(null)

// — Proveedores —
const providers = ref<AdminProvider[]>([])
const totalProviders   = ref(0)
const pageProv         = ref(1)
const statusFilter     = ref('')
const loadingProviders = ref(false)

// — Usuarios —
const users        = ref<AdminUser[]>([])
const totalUsers   = ref(0)
const pageUsers    = ref(1)
const roleFilter   = ref('')
const searchFilter = ref('')
const loadingUsers = ref(false)

const actionError = ref<string | null>(null)

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

// — Proveedores —
async function loadProviders() {
  loadingProviders.value = true
  actionError.value = null
  try {
    const res = await listAdminProviders(pageProv.value, statusFilter.value || undefined)
    providers.value    = res.data
    totalProviders.value = res.total
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
    const p = providers.value.find(p => p.id === providerId)
    if (p) p._count.reviews = Math.max(0, p._count.reviews - 1)
    await loadStats()
  } catch {
    actionError.value = 'No se pudo eliminar la reseña.'
  }
}

// — Usuarios —
async function loadUsers() {
  loadingUsers.value = true
  actionError.value = null
  try {
    const res = await listAdminUsers(
      pageUsers.value,
      roleFilter.value || undefined,
      searchFilter.value || undefined
    )
    users.value      = res.data
    totalUsers.value = res.total
  } finally {
    loadingUsers.value = false
  }
}

async function toggleActive(user: AdminUser) {
  actionError.value = null
  try {
    await setUserActive(user.id, !user.active)
    user.active = !user.active
    await loadStats()
  } catch {
    actionError.value = 'No se pudo actualizar el usuario.'
  }
}

async function removeUser(user: AdminUser) {
  if (!confirm(`¿Eliminar el usuario "${user.email}"? Esta acción no se puede deshacer.`)) return
  actionError.value = null
  try {
    await deleteAdminUser(user.id)
    users.value = users.value.filter(u => u.id !== user.id)
    totalUsers.value--
    await loadStats()
  } catch {
    actionError.value = 'No se pudo eliminar el usuario.'
  }
}

let searchTimeout: ReturnType<typeof setTimeout>
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { pageUsers.value = 1; loadUsers() }, 400)
}

watch(statusFilter, () => { pageProv.value  = 1; loadProviders() })
watch(roleFilter,   () => { pageUsers.value = 1; loadUsers() })

onMounted(async () => {
  if (auth.user?.role !== 'ADMIN') {
    router.replace({ name: 'home' })
    return
  }
  await Promise.all([loadStats(), loadProviders(), loadUsers()])
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
        <p class="text-xs text-gray-500 uppercase tracking-wide">Usuarios registrados</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ (stats.users.empresas + stats.users.proveedores) }}</p>
        <p class="text-xs text-gray-500 mt-1">
          {{ stats.users.empresas }} empresas · {{ stats.users.proveedores }} proveedores
        </p>
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

    <!-- Tabs -->
    <div class="border-b border-gray-200">
      <nav class="flex gap-6">
        <button
          @click="activeTab = 'providers'"
          class="pb-3 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === 'providers'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Proveedores
        </button>
        <button
          @click="activeTab = 'users'"
          class="pb-3 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === 'users'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Usuarios
          <span v-if="stats?.users.inactive" class="ml-1.5 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
            {{ stats.users.inactive }} inactivos
          </span>
        </button>
      </nav>
    </div>

    <p v-if="actionError" class="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{{ actionError }}</p>

    <!-- Tab: Proveedores -->
    <section v-if="activeTab === 'providers'" class="bg-white rounded-lg shadow">
      <div class="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-gray-900">Proveedores</h2>
        <select
          v-model="statusFilter"
          class="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="PENDING">Pendientes</option>
          <option value="ACTIVE">Activos</option>
          <option value="SUSPENDED">Suspendidos</option>
        </select>
      </div>

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
            >Activar</button>
            <button
              v-if="p.status !== 'PENDING'"
              @click="setStatus(p, 'PENDING')"
              class="px-3 py-1.5 text-xs bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            >Pendiente</button>
            <button
              v-if="p.status !== 'SUSPENDED'"
              @click="setStatus(p, 'SUSPENDED')"
              class="px-3 py-1.5 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
            >Suspender</button>
          </div>
        </div>
      </div>

      <div v-if="totalProviders > 20" class="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
        <p class="text-xs text-gray-500">{{ totalProviders }} proveedores en total</p>
        <div class="flex gap-2">
          <button
            :disabled="pageProv === 1"
            @click="pageProv--; loadProviders()"
            class="px-3 py-1.5 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
          >Anterior</button>
          <button
            :disabled="pageProv * 20 >= totalProviders"
            @click="pageProv++; loadProviders()"
            class="px-3 py-1.5 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
          >Siguiente</button>
        </div>
      </div>
    </section>

    <!-- Tab: Usuarios -->
    <section v-if="activeTab === 'users'" class="bg-white rounded-lg shadow">
      <div class="p-5 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <h2 class="text-lg font-semibold text-gray-900 mr-auto">Usuarios registrados</h2>
        <input
          v-model="searchFilter"
          @input="onSearchInput"
          type="text"
          placeholder="Buscar por nombre o email..."
          class="text-sm border border-gray-300 rounded-md px-3 py-1.5 w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          v-model="roleFilter"
          class="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los roles</option>
          <option value="EMPRESA">Empresa</option>
          <option value="PROVEEDOR">Proveedor</option>
        </select>
      </div>

      <div v-if="loadingUsers" class="p-6 text-sm text-gray-500">Cargando...</div>

      <div v-else-if="!users.length" class="p-6 text-sm text-gray-500">
        No se encontraron usuarios.
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="u in users"
          :key="u.id"
          class="px-5 py-4 flex flex-wrap items-start justify-between gap-4"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="font-medium text-gray-900 text-sm">{{ u.name }}</p>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800">
                {{ u.role === 'EMPRESA' ? 'Empresa' : 'Proveedor' }}
              </span>
              <span
                v-if="!u.active"
                class="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600"
              >Inactivo</span>
            </div>
            <p class="text-xs text-gray-500 mt-0.5">{{ u.email }}</p>
            <p class="text-xs text-gray-400 mt-0.5">
              <span v-if="u.phone">{{ u.phone }} · </span>
              <span v-if="u.provider">{{ u.provider.businessName }} · </span>
              registrado {{ new Date(u.createdAt).toLocaleDateString('es-CL') }}
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              @click="toggleActive(u)"
              class="px-3 py-1.5 text-xs rounded-md"
              :class="u.active
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'"
            >
              {{ u.active ? 'Desactivar' : 'Activar' }}
            </button>
            <button
              @click="removeUser(u)"
              class="px-3 py-1.5 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
            >Eliminar</button>
          </div>
        </div>
      </div>

      <div v-if="totalUsers > 20" class="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
        <p class="text-xs text-gray-500">{{ totalUsers }} usuarios en total</p>
        <div class="flex gap-2">
          <button
            :disabled="pageUsers === 1"
            @click="pageUsers--; loadUsers()"
            class="px-3 py-1.5 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
          >Anterior</button>
          <button
            :disabled="pageUsers * 20 >= totalUsers"
            @click="pageUsers++; loadUsers()"
            class="px-3 py-1.5 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
          >Siguiente</button>
        </div>
      </div>
    </section>
  </div>
</template>
