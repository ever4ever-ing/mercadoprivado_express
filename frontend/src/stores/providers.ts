import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Provider, ProviderFilters, ProvidersResponse } from '@/types'
import { getProviders } from '@/services/providers'

const DEFAULT_FILTERS: ProviderFilters = {
  search: '',
  category: '',
  region: '',
  minScore: 0,
  orderBy: 'score'
}

export const useProvidersStore = defineStore('providers', () => {
  const providers = ref<Provider[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(9)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<ProviderFilters>({ ...DEFAULT_FILTERS })

  const totalPages = computed(() => Math.ceil(total.value / limit.value))

  async function fetchProviders() {
    loading.value = true
    error.value = null
    try {
      const response: ProvidersResponse = await getProviders(
        filters.value,
        page.value,
        limit.value
      )
      providers.value = response.data
      total.value = response.total
    } catch (e) {
      error.value = 'Error al cargar los proveedores. Intenta nuevamente.'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  function setFilters(newFilters: Partial<ProviderFilters>) {
    filters.value = { ...filters.value, ...newFilters }
    page.value = 1
    fetchProviders()
  }

  function resetFilters() {
    filters.value = { ...DEFAULT_FILTERS }
    page.value = 1
    fetchProviders()
  }

  function setPage(newPage: number) {
    page.value = newPage
    fetchProviders()
  }

  return {
    providers,
    total,
    page,
    limit,
    loading,
    error,
    filters,
    totalPages,
    fetchProviders,
    setFilters,
    resetFilters,
    setPage
  }
})
