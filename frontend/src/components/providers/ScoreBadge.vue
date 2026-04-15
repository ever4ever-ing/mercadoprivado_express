<script setup lang="ts">
import type { Badge } from '@/types'
import { computed } from 'vue'

const props = defineProps<{
  badge: Badge
  size?: 'sm' | 'md'
}>()

const config = {
  GOLD:   { label: 'Oro',    icon: 'fas fa-award',       classes: 'bg-yellow-100 text-yellow-800 border border-yellow-300' },
  SILVER: { label: 'Plata',  icon: 'fas fa-medal',       classes: 'bg-gray-100 text-gray-700 border border-gray-300' },
  BRONZE: { label: 'Bronce', icon: 'fas fa-certificate', classes: 'bg-amber-100 text-amber-800 border border-amber-300' }
}

const info = computed(() => (props.badge ? config[props.badge] : null))
const sizeClass = computed(() =>
  props.size === 'md' ? 'text-sm px-2.5 py-1' : 'text-xs px-2 py-0.5'
)
</script>

<template>
  <span
    v-if="info"
    :class="[info.classes, sizeClass, 'inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap shrink-0']"
  >
    <i :class="info.icon" class="text-xs"></i>
    {{ info.label }}
  </span>
</template>
