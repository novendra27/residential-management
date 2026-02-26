import { api } from '@/lib/apiClient'
import type { LoginResponse, User } from '@/types'

export const authService = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),

  me: () =>
    api.get<User>('/auth/me'),

  logout: () =>
    api.post<null>('/auth/logout'),
}
