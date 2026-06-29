import { apiClient } from '@/lib/api/client';
import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
  ChangePasswordData,
  ResetPasswordData,
} from '@/types/api';

export const authApi = {
  register: (data: RegisterCredentials) =>
    apiClient.post<AuthResponse>('/auth/register', data),

  login: (data: LoginCredentials) =>
    apiClient.post<AuthResponse>('/auth/login', data),

  logout: () => apiClient.post<null>('/auth/logout'),

  refresh: () =>
    apiClient.post<{ accessToken: string; expiresIn: number }>('/auth/refresh'),

  getMe: () => apiClient.get<User>('/auth/me'),

  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (data: ResetPasswordData) =>
    apiClient.post<{ message: string }>('/auth/reset-password', data),

  changePassword: (data: ChangePasswordData) =>
    apiClient.post<{ message: string }>('/auth/change-password', data),
};

export const rbacApi = {
  getPermissions: () => apiClient.get<unknown[]>('/rbac/permissions'),
  getRoles: () => apiClient.get<unknown[]>('/rbac/roles'),
};
