<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { RegisterPayload } from '@/types'

const router = useRouter()
const auth = useAuthStore()

const form = ref<RegisterPayload>({
  email: '',
  password: '',
  name: '',
  phone: '',
  role: 'EMPRESA'
})

async function submit() {
  try {
    await auth.register(form.value)
    await router.push({ name: 'home' })
  } catch {
    // El error de UI se maneja en el store
  }
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 py-10">
    <div class="bg-white rounded-lg shadow p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-1">Crear cuenta</h1>
      <p class="text-sm text-gray-500 mb-6">Regístrate para contactar o publicar servicios.</p>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            v-model="form.name"
            type="text"
            autocomplete="name"
            required
            class="form-input"
            placeholder="Nombre y apellido"
          />
        </div>

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
          <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
          <input
            v-model="form.phone"
            type="tel"
            autocomplete="tel"
            class="form-input"
            placeholder="+56 9 1234 5678"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
            class="form-input"
            placeholder="Mínimo 8 caracteres"
          />
          <p class="text-xs text-gray-400 mt-1">Debe incluir al menos una mayúscula y un número.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de cuenta</label>
          <select v-model="form.role" class="form-select">
            <option value="EMPRESA">Empresa</option>
            <option value="PROVEEDOR">Proveedor</option>
          </select>
        </div>

        <p v-if="auth.error" class="text-sm text-red-600">{{ auth.error }}</p>

        <button type="submit" class="btn-primary w-full" :disabled="auth.loading">
          <span v-if="auth.loading">Creando cuenta...</span>
          <span v-else>Registrarme</span>
        </button>
      </form>

      <p class="mt-5 text-sm text-gray-600">
        ¿Ya tienes cuenta?
        <RouterLink to="/login" class="text-primary-700 font-medium hover:underline">
          Inicia sesión
        </RouterLink>
      </p>
    </div>
  </div>
</template>
