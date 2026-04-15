<script setup lang="ts">
import { computed } from 'vue'
import type { Provider, Category } from '@/types'
import ScoreBadge from './ScoreBadge.vue'

const props = defineProps<{ provider: Provider }>()

const CATEGORY_LABELS: Record<Category, string> = {
  PINTURA:       'Pintura',
  SOLDADURA:     'Soldadura',
  ELECTRICO:     'Eléctrico',
  MANTENIMIENTO: 'Mantenimiento',
  LIMPIEZA:      'Limpieza',
  GASFITERIA:    'Gasfitería',
  CLIMATIZACION: 'Climatización',
  CONSTRUCCION:  'Construcción',
  OTRO:          'Otro'
}

const categories = computed(() =>
  [...new Set(props.provider.services.map((s) => s.category))].map((c) => ({
    key: c,
    label: CATEGORY_LABELS[c]
  }))
)

const stars = computed(() => {
  const s = props.provider.score
  return Array.from({ length: 5 }, (_, i) => {
    if (i + 1 <= Math.floor(s)) return 'full'
    if (i < s) return 'half'
    return 'empty'
  })
})

const normalizedPhone = computed(() => {
  const raw = props.provider.phone?.trim()
  if (!raw) return ''
  return raw.replace(/[^\d]/g, '')
})

const whatsappUrl = computed(() => {
  if (!normalizedPhone.value) return ''
  const message = encodeURIComponent(`Hola ${props.provider.name}, te contacto desde Mercado Privado Chile.`)
  return `https://wa.me/${normalizedPhone.value}?text=${message}`
})
</script>

<template>
  <div class="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-5 flex flex-col gap-3">
    <!-- Nombre + badge -->
    <div class="flex items-start justify-between gap-2">
      <h3 class="font-semibold text-gray-900 text-base leading-snug">
        {{ provider.name }}
      </h3>
      <ScoreBadge :badge="provider.badge" />
    </div>

    <!-- Score -->
    <div class="flex items-center gap-1.5">
      <span class="flex gap-0.5">
        <i
          v-for="(star, i) in stars"
          :key="i"
          :class="{
            'fas fa-star text-yellow-400': star === 'full',
            'fas fa-star-half-alt text-yellow-400': star === 'half',
            'far fa-star text-gray-200': star === 'empty'
          }"
          class="text-sm"
        ></i>
      </span>
      <span class="text-sm font-medium text-gray-700">{{ provider.score.toFixed(1) }}</span>
      <span class="text-sm text-gray-400">({{ provider.reviewCount }})</span>
    </div>

    <!-- Región -->
    <div class="flex items-center gap-1.5 text-sm text-gray-500">
      <i class="fas fa-map-marker-alt text-primary-600 text-xs w-3.5 text-center"></i>
      {{ provider.region }}
    </div>

    <!-- Categorías -->
    <div class="flex flex-wrap gap-1.5">
      <span
        v-for="cat in categories"
        :key="cat.key"
        class="text-xs bg-primary-50 text-primary-700 border border-primary-100 px-2 py-0.5 rounded-full"
      >
        {{ cat.label }}
      </span>
    </div>

    <!-- Descripción -->
    <p
      v-if="provider.description"
      class="text-sm text-gray-500 leading-relaxed line-clamp-2 flex-1"
    >
      {{ provider.description }}
    </p>

    <!-- Acciones -->
    <div class="mt-auto pt-2 flex gap-2">
      <RouterLink
        :to="`/proveedores/${provider.id}`"
        class="flex-1 text-center inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Ver perfil
      </RouterLink>
      <a
        v-if="whatsappUrl"
        :href="whatsappUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
      >
        <i class="fab fa-whatsapp"></i> WhatsApp
      </a>
      <span
        v-else
        class="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-200 text-gray-500"
      >
        <i class="fas fa-phone"></i> Sin teléfono
      </span>
    </div>
  </div>
</template>
