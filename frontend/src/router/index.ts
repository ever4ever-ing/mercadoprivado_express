import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/directorio',
      name: 'directorio',
      component: () => import('@/views/DirectorioView.vue')
    },
    {
      path: '/proveedores/:id',
      name: 'proveedor-detalle',
      component: () => import('@/views/ProviderDetailView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/registro',
      name: 'registro',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/perfil/proveedor',
      name: 'perfil-proveedor',
      component: () => import('@/views/ProviderProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/perfil/empresa',
      name: 'perfil-empresa',
      component: () => import('@/views/CompanyProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'home' }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.name === 'perfil-proveedor' && auth.user?.role !== 'PROVEEDOR') {
    return { name: 'perfil-empresa' }
  }

  if (to.name === 'perfil-empresa' && auth.user?.role === 'PROVEEDOR') {
    return { name: 'perfil-proveedor' }
  }
})

export default router
