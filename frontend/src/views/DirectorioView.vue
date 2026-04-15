<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProvidersStore } from '@/stores/providers'
import { storeToRefs } from 'pinia'
import ProviderCard from '@/components/providers/ProviderCard.vue'
import ProviderFilters from '@/components/providers/ProviderFilters.vue'

const store = useProvidersStore()
const { providers, total, page, loading, error, filters, totalPages } = storeToRefs(store)

const showMobileFilters = ref(false)
const searchInput = ref(filters.value.search)
let debounceTimer: ReturnType<typeof setTimeout>

function onSearchInput() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    store.setFilters({ search: searchInput.value })
  }, 400)
}

onMounted(() => {
  store.fetchProviders()
})

const ORDER_OPTIONS = [
  { value: 'score',     label: 'Mayor score' },
  { value: 'createdAt', label: 'Más recientes' },
  { value: 'name',      label: 'Nombre A–Z' }
]

const pages = computed(() =>
  Array.from({ length: totalPages.value }, (_, i) => i + 1)
)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Buscador superior -->
    <div class="bg-primary-700 py-8 px-4">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-white text-xl font-bold mb-4 text-center">
          Directorio de proveedores industriales
        </h1>
        <div class="relative">
          <i
            class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
          ></i>
          <input
            v-model="searchInput"
            @input="onSearchInput"
            type="text"
            placeholder="Buscar por nombre, servicio o descripción..."
            class="w-full pl-9 pr-4 py-2.5 rounded-md border-0 text-sm
                   focus:outline-none focus:ring-2 focus:ring-primary-300 shadow-sm"
          />
        </div>
      </div>
    </div>

    <!-- Layout principal -->
    <div class="max-w-6xl mx-auto px-4 py-6">
      <!-- Toggle filtros (mobile) -->
      <div class="lg:hidden mb-4">
        <button
          @click="showMobileFilters = !showMobileFilters"
          class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300
                 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <i class="fas fa-sliders-h"></i>
          Filtros
          <i
            :class="showMobileFilters ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
            class="text-xs text-gray-400"
          ></i>
        </button>
      </div>

      <!-- Filtros mobile (colapsable) -->
      <div v-if="showMobileFilters" class="lg:hidden mb-4">
        <ProviderFilters />
      </div>

      <div class="flex gap-6">
        <!-- Sidebar filtros (desktop) -->
        <aside class="hidden lg:block w-56 shrink-0">
          <ProviderFilters />
        </aside>

        <!-- Resultados -->
        <div class="flex-1 min-w-0">
          <!-- Barra de herramientas -->
          <div class="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <p class="text-sm text-gray-600">
              <template v-if="!loading">
                <span class="font-semibold text-gray-800">{{ total }}</span>
                {{ total === 1 ? ' proveedor encontrado' : ' proveedores encontrados' }}
              </template>
              <span v-else class="text-gray-400">Buscando...</span>
            </p>
            <select
              :value="filters.orderBy"
              @change="store.setFilters({ orderBy: ($event.target as HTMLSelectElement).value as 'score' | 'createdAt' | 'name' })"
              class="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white
                     focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option v-for="opt in ORDER_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Skeleton de carga -->
          <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div
              v-for="i in 6"
              :key="i"
              class="bg-white rounded-lg shadow p-5 space-y-3 animate-pulse"
            >
              <div class="flex justify-between">
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                <div class="h-5 bg-gray-100 rounded-full w-14"></div>
              </div>
              <div class="flex gap-0.5">
                <div v-for="j in 5" :key="j" class="h-3 w-3 bg-gray-100 rounded-sm"></div>
              </div>
              <div class="h-3 bg-gray-100 rounded w-1/3"></div>
              <div class="flex gap-1.5">
                <div class="h-5 bg-gray-100 rounded-full w-16"></div>
                <div class="h-5 bg-gray-100 rounded-full w-20"></div>
              </div>
              <div class="space-y-1.5 pt-1">
                <div class="h-3 bg-gray-100 rounded w-full"></div>
                <div class="h-3 bg-gray-100 rounded w-5/6"></div>
              </div>
              <div class="flex gap-2 pt-2">
                <div class="h-7 bg-gray-100 rounded w-1/2"></div>
                <div class="h-7 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>

          <!-- Error -->
          <div
            v-else-if="error"
            class="bg-red-50 border border-red-200 rounded-lg p-8 text-center"
          >
            <i class="fas fa-exclamation-circle text-red-400 text-3xl mb-3"></i>
            <p class="text-red-700 font-medium">{{ error }}</p>
            <button
              @click="store.fetchProviders()"
              class="mt-3 text-sm text-red-600 underline hover:no-underline"
            >
              Reintentar
            </button>
          </div>

          <!-- Sin resultados -->
          <div
            v-else-if="!providers.length"
            class="bg-white rounded-lg shadow p-12 text-center"
          >
            <i class="fas fa-search text-gray-200 text-5xl mb-4"></i>
            <p class="text-gray-600 font-medium mb-1">No se encontraron proveedores</p>
            <p class="text-gray-400 text-sm mb-5">Intenta con otros filtros o términos de búsqueda</p>
            <button
              @click="store.resetFilters(); searchInput = ''"
              class="text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              <i class="fas fa-times mr-1"></i>Limpiar todos los filtros
            </button>
          </div>

          <!-- Grid de tarjetas -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <ProviderCard
              v-for="provider in providers"
              :key="provider.id"
              :provider="provider"
            />
          </div>

          <!-- Paginación -->
          <div v-if="totalPages > 1" class="mt-8 flex justify-center gap-1 flex-wrap">
            <button
              @click="store.setPage(page - 1)"
              :disabled="page <= 1"
              class="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300
                     text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
            >
              <i class="fas fa-chevron-left text-xs"></i>
            </button>
            <button
              v-for="p in pages"
              :key="p"
              @click="store.setPage(p)"
              :class="[
                'px-3 py-1.5 rounded-md text-sm font-medium border transition-colors',
                page === p
                  ? 'bg-primary-700 text-white border-primary-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              ]"
            >
              {{ p }}
            </button>
            <button
              @click="store.setPage(page + 1)"
              :disabled="page >= totalPages"
              class="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300
                     text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
            >
              <i class="fas fa-chevron-right text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
