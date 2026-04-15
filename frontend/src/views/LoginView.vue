<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const form = ref({
  email: '',
  password: ''
})

async function submit() {
  try {
    await auth.login(form.value)
    await router.push({ name: 'home' })
  } catch {
    // El error de UI se maneja en el store
  }
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 py-10">
    <div class="bg-white rounded-lg shadow p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-1">Iniciar sesión</h1>
      <p class="text-sm text-gray-500 mb-6">Accede a tu cuenta para gestionar tu actividad.</p>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            v-model="form.email"
            type="email"
            autocomplete="email"
            required
            class="form-input"
            placeholder="tu@empresa.cl"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            required
            class="form-input"
            placeholder="********"
          />
        </div>

        <p v-if="auth.error" class="text-sm text-red-600">{{ auth.error }}</p>

        <button type="submit" class="btn-primary w-full" :disabled="auth.loading">
          <span v-if="auth.loading">Ingresando...</span>
          <span v-else>Ingresar</span>
        </button>
      </form>

      <p class="mt-5 text-sm text-gray-600">
        ¿No tienes cuenta?
        <RouterLink to="/registro" class="text-primary-700 font-medium hover:underline">
          Regístrate
        </RouterLink>
      </p>
    </div>
  </div>
</template>
