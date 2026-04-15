<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { createProvider, getMyProviderProfile, updateProvider, replyToReview } from '@/services/providers'
import type { Category, ProviderDetail, ProviderReview, ProviderUpsertPayload, Status } from '@/types'
import ScoreBadge from '@/components/providers/ScoreBadge.vue'

const auth = useAuthStore()
const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const provider = ref<ProviderDetail | null>(null)
const showSetupForm = ref(false)
const saving = ref(false)
const saveError = ref<string | null>(null)

// Completitud del perfil
const completionSteps = computed(() => {
  const p = provider.value
  if (!p) return []
  return [
    { label: 'Descripción',            done: !!p.description?.trim() },
    { label: 'Ciudad o dirección',     done: !!(p.city?.trim() || p.address?.trim()) },
    { label: 'Sitio web',              done: !!p.website?.trim() },
    { label: 'Al menos un servicio',   done: (p.services?.length ?? 0) > 0 },
  ]
})
const completionPct = computed(() => {
  if (!completionSteps.value.length) return 0
  return Math.round(completionSteps.value.filter(s => s.done).length / completionSteps.value.length * 100)
})

// Respuesta a reseñas
const replyingId  = ref<string | null>(null)
const replyText   = ref('')
const replySaving = ref(false)
const replyError  = ref<string | null>(null)

function startReply(review: ProviderReview) {
  replyingId.value = review.id
  replyText.value  = review.providerReply ?? ''
  replyError.value = null
}
function cancelReply() {
  replyingId.value = null
  replyText.value  = ''
}
async function submitReply(review: ProviderReview) {
  if (!provider.value || !replyText.value.trim()) return
  replySaving.value = true
  replyError.value  = null
  try {
    const updated = await replyToReview(provider.value.id, review.id, replyText.value.trim())
    const idx = provider.value.reviews?.findIndex(r => r.id === review.id) ?? -1
    if (idx >= 0 && provider.value.reviews) provider.value.reviews[idx] = updated
    replyingId.value = null
  } catch {
    replyError.value = 'No se pudo guardar la respuesta.'
  } finally {
    replySaving.value = false
  }
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'PINTURA', label: 'Pintura' },
  { value: 'SOLDADURA', label: 'Soldadura' },
  { value: 'ELECTRICO', label: 'Eléctrico' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'LIMPIEZA', label: 'Limpieza' },
  { value: 'GASFITERIA', label: 'Gasfitería' },
  { value: 'CLIMATIZACION', label: 'Climatización' },
  { value: 'CONSTRUCCION', label: 'Construcción' },
  { value: 'OTRO', label: 'Otro' }
]

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'ACTIVE', label: 'Activo (visible en el directorio)' },
  { value: 'PENDING', label: 'Pendiente (oculto en el directorio)' },
  { value: 'SUSPENDED', label: 'Suspendido (oculto en el directorio)' }
]

const form = ref<ProviderUpsertPayload>({
  businessName: '',
  description: '',
  region: '',
  city: '',
  address: '',
  website: '',
  status: 'ACTIVE',
  services: [
    {
      category: 'OTRO',
      title: '',
      description: '',
      priceFrom: undefined,
      priceTo: undefined
    }
  ]
})

const joinedAt = computed(() => {
  if (!provider.value?.createdAt) return '-'
  return new Date(provider.value.createdAt).toLocaleDateString('es-CL')
})

const responseRateText = computed(() => {
  if (!provider.value) return '-'
  return provider.value.profileComplete ? 'Perfil completo' : 'Perfil en construcción'
})

async function loadProfile() {
  loading.value = true
  error.value = null
  showSetupForm.value = false
  try {
    provider.value = await getMyProviderProfile()
    form.value = {
      businessName: provider.value.businessName || provider.value.name || '',
      description: provider.value.description || '',
      region: provider.value.region || '',
      city: provider.value.city || '',
      address: provider.value.address || '',
      website: provider.value.website || '',
      status: provider.value.status || 'ACTIVE',
      services: provider.value.services.length
        ? provider.value.services.map((s) => ({
            category: s.category,
            title: s.title || '',
            description: s.description || '',
            priceFrom: s.priceFrom,
            priceTo: s.priceTo
          }))
        : [{ category: 'OTRO', title: '', description: '', priceFrom: undefined, priceTo: undefined }]
    }
  } catch (e: any) {
    const backendError = e?.response?.data?.error
    if (e?.response?.status === 404 && backendError === 'Tu cuenta aún no tiene perfil de proveedor creado.') {
      showSetupForm.value = true
    } else {
      error.value = 'No fue posible cargar tu perfil de proveedor.'
    }
  } finally {
    loading.value = false
  }
}

function addService() {
  form.value.services.push({
    category: 'OTRO',
    title: '',
    description: '',
    priceFrom: undefined,
    priceTo: undefined
  })
}

function removeService(index: number) {
  if (form.value.services.length === 1) return
  form.value.services.splice(index, 1)
}

function sanitizePayload(payload: ProviderUpsertPayload): ProviderUpsertPayload {
  return {
    businessName: payload.businessName.trim(),
    description: payload.description?.trim() || '',
    region: payload.region.trim(),
    city: payload.city?.trim() || '',
    address: payload.address?.trim() || '',
    website: payload.website?.trim() || '',
    status: payload.status || 'ACTIVE',
    services: payload.services.map((s) => ({
      category: s.category,
      title: s.title.trim(),
      description: s.description?.trim() || '',
      ...(s.priceFrom !== undefined && s.priceFrom !== null ? { priceFrom: s.priceFrom } : {}),
      ...(s.priceTo !== undefined && s.priceTo !== null ? { priceTo: s.priceTo } : {})
    }))
  }
}

async function saveProfile() {
  saveError.value = null
  saving.value = true
  try {
    const payload = sanitizePayload(form.value)
    if (provider.value?.id) {
      await updateProvider(provider.value.id, payload)
    } else {
      await createProvider(payload)
    }
    await loadProfile()
  } catch (e: any) {
    saveError.value = e?.response?.data?.error || 'No fue posible guardar tu perfil.'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (!auth.isAuthenticated || auth.user?.role !== 'PROVEEDOR') {
    await router.replace({ name: 'login' })
    return
  }
  await loadProfile()
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Mi perfil de proveedor</h1>
        <p class="text-sm text-gray-500">Resumen público y estado actual de tu perfil.</p>
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-lg shadow p-6 text-gray-500">Cargando perfil...</div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
      {{ error }}
    </div>

    <div v-else-if="showSetupForm" class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-1">Configura tu perfil de proveedor</h2>
      <p class="text-sm text-gray-500 mb-6">Completa estos datos para empezar a publicar y ofrecer tus servicios.</p>

      <form class="space-y-6" @submit.prevent="saveProfile">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre comercial</label>
            <input v-model="form.businessName" required class="form-input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Región</label>
            <input v-model="form.region" required class="form-input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <input v-model="form.city" class="form-input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sitio web</label>
            <input v-model="form.website" type="url" class="form-input" placeholder="https://..." />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select v-model="form.status" class="form-select">
              <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
          <input v-model="form.address" class="form-input" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Descripción del negocio</label>
          <textarea v-model="form.description" rows="3" class="form-input"></textarea>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-800">Servicios ofrecidos</h3>
            <button type="button" class="btn-outline" @click="addService">
              <i class="fas fa-plus"></i> Agregar servicio
            </button>
          </div>

          <div
            v-for="(service, idx) in form.services"
            :key="idx"
            class="border border-gray-200 rounded-md p-4 space-y-3"
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select v-model="service.category" class="form-select">
                  <option v-for="cat in CATEGORIES" :key="cat.value" :value="cat.value">
                    {{ cat.label }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Título del servicio</label>
                <input v-model="service.title" required class="form-input" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Precio desde (opcional)</label>
                <input v-model.number="service.priceFrom" type="number" min="0" class="form-input" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Precio hasta (opcional)</label>
                <input v-model.number="service.priceTo" type="number" min="0" class="form-input" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
              <textarea v-model="service.description" rows="2" class="form-input"></textarea>
            </div>
            <div class="flex justify-end">
              <button
                type="button"
                class="text-sm text-red-600 hover:text-red-700 disabled:opacity-40"
                :disabled="form.services.length === 1"
                @click="removeService(idx)"
              >
                Eliminar servicio
              </button>
            </div>
          </div>
        </div>

        <p v-if="saveError" class="text-sm text-red-600">{{ saveError }}</p>

        <button type="submit" class="btn-primary" :disabled="saving">
          <span v-if="saving">Guardando...</span>
          <span v-else>Publicar servicios</span>
        </button>
      </form>
    </div>

    <div v-else-if="provider" class="space-y-6">
      <section class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between gap-3 mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Editar y publicar servicios</h3>
          <button class="btn-primary" :disabled="saving" @click="saveProfile">
            <span v-if="saving">Guardando...</span>
            <span v-else>Guardar cambios</span>
          </button>
        </div>

        <form class="space-y-5" @submit.prevent="saveProfile">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre comercial</label>
              <input v-model="form.businessName" required class="form-input" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Región</label>
              <input v-model="form.region" required class="form-input" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input v-model="form.city" class="form-input" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Sitio web</label>
              <input v-model="form.website" type="url" class="form-input" placeholder="https://..." />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select v-model="form.status" class="form-select">
                <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input v-model="form.address" class="form-input" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea v-model="form.description" rows="3" class="form-input"></textarea>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-semibold text-gray-800">Servicios</h4>
              <button type="button" class="btn-outline" @click="addService">
                <i class="fas fa-plus"></i> Agregar servicio
              </button>
            </div>
            <div
              v-for="(service, idx) in form.services"
              :key="idx"
              class="border border-gray-200 rounded-md p-4 space-y-3"
            >
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select v-model="service.category" class="form-select">
                    <option v-for="cat in CATEGORIES" :key="cat.value" :value="cat.value">
                      {{ cat.label }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <input v-model="service.title" required class="form-input" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Precio desde</label>
                  <input v-model.number="service.priceFrom" type="number" min="0" class="form-input" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Precio hasta</label>
                  <input v-model.number="service.priceTo" type="number" min="0" class="form-input" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea v-model="service.description" rows="2" class="form-input"></textarea>
              </div>
              <div class="flex justify-end">
                <button
                  type="button"
                  class="text-sm text-red-600 hover:text-red-700 disabled:opacity-40"
                  :disabled="form.services.length === 1"
                  @click="removeService(idx)"
                >
                  Eliminar servicio
                </button>
              </div>
            </div>
          </div>

          <p v-if="saveError" class="text-sm text-red-600">{{ saveError }}</p>
        </form>
      </section>

      <section class="bg-white rounded-lg shadow p-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">{{ provider.name }}</h2>
            <p class="text-sm text-gray-500 mt-1">{{ provider.region }}<span v-if="provider.city">, {{ provider.city }}</span></p>
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
            <p class="text-xs text-gray-500 uppercase tracking-wide">Estado perfil</p>
            <p class="text-base font-semibold text-gray-900">{{ responseRateText }}</p>
          </div>
        </div>

        <!-- Barra de completitud -->
        <div class="mt-6">
          <div class="flex items-center justify-between mb-1">
            <p class="text-sm font-medium text-gray-700">Completitud del perfil</p>
            <p class="text-sm font-semibold" :class="completionPct === 100 ? 'text-emerald-600' : 'text-primary-700'">
              {{ completionPct }}%
            </p>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all duration-500"
              :class="completionPct === 100 ? 'bg-emerald-500' : 'bg-primary-600'"
              :style="{ width: completionPct + '%' }"
            ></div>
          </div>
          <ul class="mt-2 grid grid-cols-2 gap-1">
            <li
              v-for="step in completionSteps"
              :key="step.label"
              class="flex items-center gap-1.5 text-xs"
              :class="step.done ? 'text-emerald-600' : 'text-gray-400'"
            >
              <i :class="step.done ? 'fas fa-check-circle' : 'far fa-circle'"></i>
              {{ step.label }}
            </li>
          </ul>
        </div>
      </section>

      <section class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">Servicios</h3>
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
        <p v-else class="text-sm text-gray-500">Aún no tienes servicios cargados.</p>
      </section>

      <section class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          Reseñas recibidas
          <span class="text-sm font-normal text-gray-500 ml-1">({{ provider.reviewCount }})</span>
        </h3>
        <div v-if="provider.reviews && provider.reviews.length" class="space-y-5">
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
                <span v-for="n in 5" :key="n" :class="n <= review.rating ? 'text-yellow-400' : 'text-gray-300'" class="text-base leading-none">★</span>
              </div>
            </div>
            <p v-if="review.comment" class="text-sm text-gray-600 mt-2">{{ review.comment }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ new Date(review.createdAt).toLocaleDateString('es-CL') }}</p>

            <!-- Respuesta existente -->
            <div v-if="review.providerReply && replyingId !== review.id" class="mt-3 ml-4 pl-3 border-l-2 border-primary-200 bg-gray-50 rounded-r-md p-3">
              <p class="text-xs font-semibold text-primary-700 mb-1">Tu respuesta</p>
              <p class="text-sm text-gray-700">{{ review.providerReply }}</p>
            </div>

            <!-- Formulario de respuesta -->
            <div v-if="replyingId === review.id" class="mt-3">
              <textarea
                v-model="replyText"
                rows="2"
                maxlength="500"
                placeholder="Escribe tu respuesta pública..."
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              ></textarea>
              <p v-if="replyError" class="text-xs text-red-600 mt-1">{{ replyError }}</p>
              <div class="flex gap-2 mt-2">
                <button @click="submitReply(review)" :disabled="replySaving || !replyText.trim()" class="px-3 py-1.5 bg-primary-700 text-white text-xs font-medium rounded-md hover:bg-primary-800 disabled:opacity-50">
                  {{ replySaving ? 'Guardando...' : 'Publicar respuesta' }}
                </button>
                <button @click="cancelReply" class="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
              </div>
            </div>

            <!-- Botón para responder -->
            <button
              v-if="replyingId !== review.id"
              @click="startReply(review)"
              class="mt-2 text-xs text-primary-600 hover:text-primary-800 font-medium"
            >
              {{ review.providerReply ? 'Editar respuesta' : 'Responder reseña' }}
            </button>
          </div>
        </div>
        <p v-else class="text-sm text-gray-500">Aún no has recibido reseñas.</p>
      </section>

      <section class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">Información de cuenta</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <p><span class="text-gray-500">Nombre usuario:</span> <span class="text-gray-900">{{ auth.user?.name }}</span></p>
          <p><span class="text-gray-500">Email:</span> <span class="text-gray-900">{{ auth.user?.email }}</span></p>
          <p><span class="text-gray-500">Registro:</span> <span class="text-gray-900">{{ joinedAt }}</span></p>
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
            <span v-else class="text-gray-900">No informado</span>
          </p>
        </div>
      </section>
    </div>
  </div>
</template>
