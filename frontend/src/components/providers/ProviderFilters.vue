<script setup lang="ts">
import type { Category, ProviderFilters } from '@/types'
import { useProvidersStore } from '@/stores/providers'
import { storeToRefs } from 'pinia'

const store = useProvidersStore()
const { filters } = storeToRefs(store)

const CATEGORIES: { value: Category | ''; label: string }[] = [
  { value: '',              label: 'Todas las categorías' },
  { value: 'PINTURA',       label: 'Pintura' },
  { value: 'SOLDADURA',     label: 'Soldadura' },
  { value: 'ELECTRICO',     label: 'Eléctrico' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'LIMPIEZA',      label: 'Limpieza' },
  { value: 'GASFITERIA',    label: 'Gasfitería' },
  { value: 'CLIMATIZACION', label: 'Climatización' },
  { value: 'CONSTRUCCION',  label: 'Construcción' },
  { value: 'OTRO',          label: 'Otro' }
]

const REGIONS = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama',
  'Coquimbo', 'Valparaíso', 'Metropolitana', "O'Higgins",
  'Maule', 'Ñuble', 'Biobío', 'Araucanía',
  'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
]

const SCORE_OPTIONS = [
  { value: 0,   label: 'Todos' },
  { value: 2.5, label: '≥ 2.5 — Bronce' },
  { value: 3.5, label: '≥ 3.5 — Plata' },
  { value: 4.5, label: '≥ 4.5 — Oro' }
]

function update<K extends keyof ProviderFilters>(key: K, value: ProviderFilters[K]) {
  store.setFilters({ [key]: value })
}
</script>

<template>
  <div class="bg-white rounded-lg shadow p-5 space-y-5">
    <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filtros</h2>

    <!-- Categoría -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5">Categoría</label>
      <select
        :value="filters.category"
        @change="update('category', ($event.target as HTMLSelectElement).value as Category | '')"
        class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white
               focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        <option v-for="cat in CATEGORIES" :key="cat.value" :value="cat.value">
          {{ cat.label }}
        </option>
      </select>
    </div>

    <!-- Región -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5">Región</label>
      <select
        :value="filters.region"
        @change="update('region', ($event.target as HTMLSelectElement).value)"
        class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white
               focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        <option value="">Todas las regiones</option>
        <option v-for="region in REGIONS" :key="region" :value="region">
          {{ region }}
        </option>
      </select>
    </div>

    <!-- Score mínimo -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1.5">Score mínimo</label>
      <div class="space-y-1.5">
        <button
          v-for="opt in SCORE_OPTIONS"
          :key="opt.value"
          @click="update('minScore', opt.value)"
          :class="[
            'w-full text-left text-sm px-3 py-1.5 rounded-md border transition-colors',
            filters.minScore === opt.value
              ? 'bg-primary-700 text-white border-primary-700'
              : 'border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50'
          ]"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Limpiar -->
    <button
      @click="store.resetFilters()"
      class="w-full text-sm text-primary-600 hover:text-primary-800 font-medium py-1 transition-colors"
    >
      <i class="fas fa-times mr-1"></i>Limpiar filtros
    </button>
  </div>
</template>
