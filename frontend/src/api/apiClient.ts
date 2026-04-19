import axios from 'axios'

/**
 * Спільний Axios-інстанс для всіх API-запитів.
 * Заголовок Authorization встановлюється AuthContext при зміні токена.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL ?? 'http://localhost:8080',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

/* Автоматичне додавання токена з localStorage (для першого завантаження) */
const savedToken = localStorage.getItem('thesis-auth-token')
if (savedToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
}
