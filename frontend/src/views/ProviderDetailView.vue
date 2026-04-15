<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getProviderById, createReview, listProviderReviews } from '@/services/providers'
import type { ProviderDetail, ProviderReview } from '@/types'
import ScoreBadge from '@/components/providers/ScoreBadge.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const loading = ref(true)
const error = ref<string | null>(null)
const provider = ref<ProviderDetail | null>(null)

// Formulario de reseña
const hoverRating = ref(0)
const reviewForm = ref({ rating: 0, comment: '' })
const reviewSubmitting = ref(false)
const reviewError = ref<string | null>(null)
const reviewSuccess = ref(false)
const alreadyReviewed = ref(false)

const canReview = computed(
  () => auth.isAuthenticated && auth.user?.role === 'EMPRESA'
)

// Paginación de reseñas
const reviewsPage = ref(1)
const reviewsTotal = ref(0)
const reviewsLoading = ref(false)
const REVIEWS_LIMIT = 5

async function loadMoreReviews() {
  if (!provider.value) return
  reviewsLoading.value = true
  try {
    reviewsPage.value++
    const res = await listProviderReviews(String(route.params.id), reviewsPage.value, REVIEWS_LIMIT)
    reviewsTotal.value = res.total
    provider.value.reviews = [...(provider.value.reviews ?? []), ...res.data]
  } finally {
    reviewsLoading.value = false
  }
}

async function submitReview() {
  if (reviewForm.value.rating === 0) return
  reviewSubmitting.value = true
  reviewError.value = null
  try {
    const newReview = await createReview(String(route.params.id), {
      rating: reviewForm.value.rating,
      comment: reviewForm.value.comment.trim() || undefined
    })
    // Insertar la reseña al inicio de la lista sin recargar
    if (provider.value) {
      provider.value.reviews = [newReview, ...(provider.value.reviews ?? [])]
      provider.value.reviewCount = (provider.value.reviewCount ?? 0) + 1
    }
    reviewSuccess.value = true
    reviewForm.value = { rating: 0, comment: '' }
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number; data?: { error?: string } } })?.response?.status
    const msg    = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
    if (status === 409) {
      alreadyReviewed.value = true
    } else {
      reviewError.value = msg ?? 'No se pudo enviar la reseña. Intenta nuevamente.'
    }
  } finally {
    reviewSubmitting.value = false
  }
}

const createdAtLabel = computed(() => {
  if (!provider.value?.createdAt) return '-'
  return new Date(provider.value.createdAt).toLocaleDateString('es-CL')
})

const displayPhone = computed(() => provider.value?.phone?.trim() || '')

const normalizedPhone = computed(() => {
  if (!displayPhone.value) return ''
  return displayPhone.value.replace(/[^\d]/g, '')
})

const whatsappUrl = computed(() => {
  if (!normalizedPhone.value || !provider.value) return ''
  const message = encodeURIComponent(`Hola ${provider.value.name}, te contacto desde Mercado Privado Chile.`)
  return `https://wa.me/${normalizedPhone.value}?text=${message}`
})

async function loadProvider() {
  const id = String(route.params.id || '')
  if (!id) {
    error.value = 'Proveedor inválido.'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null
  try {
    provider.value = await getProviderById(id)
    reviewsTotal.value = provider.value.reviewCount ?? 0
  } catch {
    error.value = 'No se pudo cargar el perfil del proveedor.'
  } finally {
    loading.value = false
  }
}

onMounted(loadProvider)
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div v-if="loading" class="bg-white rounded-lg shadow p-6 text-gray-500">Cargando perfil...</div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
      {{ error }}
    </div>

    <div v-else-if="provider" class="space-y-6">
      <section class="bg-white rounded-lg shadow p-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ provider.name }}</h1>
            <p class="text-sm text-gray-500 mt-1">
              {{ provider.region }}<span v-if="provider.city">, {{ provider.city }}</span>
            </p>
            <p v-if="provider.address" class="text-sm text-gray-500 mt-1">{{ provider.address }}</p>
          </div>
          <ScoreBadge :badge="provider.badge" />
        </div>

        <p v-if="provider.description" class="mt-4 text-gray-700 leading-relaxed">{{ provider.description }}</p>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div class="bg-gray-50 rounded-md p-3">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Score</p>
            <p class="text-xl font-semibold text-gray-900">{{ provider.score.toFixed(1) }}</p>
          </div>
          <div class="bg-gray-50 rounded-md p-3">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Reseñas</p>
            <p class="text-xl font-semibold text-gray-900">{{ provider.reviewCount }}</p>
          </div>
          <div class="bg-gray-50 rounded-md p-3">
            <p class="text-xs text-gray-500 uppercase tracking-wide">En plataforma desde</p>
            <p class="text-base font-semibold text-gray-900">{{ createdAtLabel }}</p>
          </div>
        </div>
      </section>

      <section class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Servicios</h2>
        <div v-if="provider.services.length" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="service in provider.services"
            :key="service.id"
            class="border border-gray-200 rounded-md p-3"
          >
            <p class="text-sm font-semibold text-gray-800">{{ service.title || service.category }}</p>
            <p v-if="service.description" class="text-sm text-gray-500 mt-1">{{ service.description }}</p>
          </div>
        </div>
        <p v-else class="text-sm text-gray-500">No hay servicios informados.</p>
      </section>

      <section v-if="provider.reviews && provider.reviews.length" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Reseñas
          <span class="text-sm font-normal text-gray-500 ml-2">({{ provider.reviewCount }} en total)</span>
        </h2>
        <div class="space-y-5">
          <div
            v-for="review in provider.reviews"
            :key="review.id"
            class="border-b border-gray-100 pb-5 last:border-b-0 last:pb-0"
          >
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-800 text-sm">{{ review.author?.name || 'Empresa' }}</span>
                <span
                  v-if="review.verified"
                  class="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-medium"
                >
                  <i class="fas fa-check-circle"></i> Verificada
                </span>
              </div>
              <div class="flex items-center gap-0.5">
                <span
                  v-for="n in 5"
                  :key="n"
                  :class="n <= review.rating ? 'text-yellow-400' : 'text-gray-300'"
                  class="text-base leading-none"
                >★</span>
              </div>
            </div>
            <p v-if="review.comment" class="text-sm text-gray-600 mt-2">{{ review.comment }}</p>
            <p class="text-xs text-gray-400 mt-1">
              {{ new Date(review.createdAt).toLocaleDateString('es-CL') }}
            </p>
            <!-- Respuesta del proveedor -->
            <div
              v-if="review.providerReply"
              class="mt-3 ml-4 pl-3 border-l-2 border-primary-200 bg-gray-50 rounded-r-md p-3"
            >
              <p class="text-xs font-semibold text-primary-700 mb-1">Respuesta del proveedor</p>
              <p class="text-sm text-gray-700">{{ review.providerReply }}</p>
              <p class="text-xs text-gray-400 mt-1">
                {{ review.repliedAt ? new Date(review.repliedAt).toLocaleDateString('es-CL') : '' }}
              </p>
            </div>
          </div>
        </div>
        <!-- Ver más -->
        <div
          v-if="(provider.reviews?.length ?? 0) < reviewsTotal"
          class="mt-5 text-center"
        >
          <button
            @click="loadMoreReviews"
            :disabled="reviewsLoading"
            class="px-4 py-2 text-sm text-primary-700 border border-primary-300 rounded-md hover:bg-primary-50 transition-colors disabled:opacity-50"
          >
            {{ reviewsLoading ? 'Cargando...' : 'Ver más reseñas' }}
          </button>
        </div>
      </section>

      <!-- Formulario: solo para empresas autenticadas -->
      <section v-if="canReview" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Escribe una reseña</h2>

        <div
          v-if="reviewSuccess"
          class="bg-emerald-50 border border-emerald-200 rounded-md p-4 text-emerald-700 text-sm"
        >
          Tu reseña fue enviada exitosamente. ¡Gracias por tu opinión!
        </div>

        <div
          v-else-if="alreadyReviewed"
          class="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-700 text-sm"
        >
          Ya dejaste una reseña para este proveedor.
        </div>

        <form v-else @submit.prevent="submitReview" class="space-y-4">
          <div>
            <p class="text-sm text-gray-600 mb-1">Calificación <span class="text-red-500">*</span></p>
            <div class="flex gap-1">
              <button
                v-for="n in 5"
                :key="n"
                type="button"
                @click="reviewForm.rating = n"
                @mouseenter="hoverRating = n"
                @mouseleave="hoverRating = 0"
                :class="n <= (hoverRating || reviewForm.rating) ? 'text-yellow-400' : 'text-gray-300'"
                class="text-3xl leading-none focus:outline-none transition-colors"
              >★</button>
            </div>
          </div>

          <div>
            <label for="review-comment" class="block text-sm text-gray-600 mb-1">
              Comentario <span class="text-gray-400">(opcional)</span>
            </label>
            <textarea
              id="review-comment"
              v-model="reviewForm.comment"
              rows="3"
              maxlength="1000"
              placeholder="Describe tu experiencia con este proveedor..."
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            ></textarea>
            <p class="text-xs text-gray-400 mt-0.5 text-right">{{ reviewForm.comment.length }}/1000</p>
          </div>

          <p v-if="reviewError" class="text-sm text-red-600">{{ reviewError }}</p>

          <button
            type="submit"
            :disabled="reviewSubmitting || reviewForm.rating === 0"
            class="px-4 py-2 bg-primary-700 text-white text-sm font-medium rounded-md hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ reviewSubmitting ? 'Enviando...' : 'Enviar reseña' }}
          </button>
        </form>
      </section>

      <section class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Contacto</h2>
        <div class="text-sm text-gray-700 space-y-2">
          <p>
            <span class="text-gray-500">Teléfono:</span>
            <span v-if="displayPhone">{{ displayPhone }}</span>
            <span v-else>No informado</span>
          </p>
          <p>
            <span class="text-gray-500">Sitio web:</span>
            <a
              v-if="provider.website"
              :href="provider.website"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-700 hover:underline"
            >
              {{ provider.website }}
            </a>
            <span v-else>No informado</span>
          </p>
          <p>
            <span class="text-gray-500">Estado de verificación:</span>
            <span>{{ provider.verified ? 'Verificado' : 'Pendiente' }}</span>
          </p>
          <a
            v-if="whatsappUrl"
            :href="whatsappUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <i class="fab fa-whatsapp"></i>
            Contactar por WhatsApp
          </a>
        </div>
      </section>
    </div>
  </div>
</template>
