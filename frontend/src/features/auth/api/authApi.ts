import { apiClient } from '@/lib/apiClient';
import type { ApiResponse, User } from '@/types/api';
import type {
  RegisterFormValues,
  LoginFormValues,
  ChangePasswordFormValues,
  UpdateProfileFormValues,
} from '../lib/authValidation';

export interface AuthLoginResponseData {
  accessToken: string;
  user: User;
}

export interface RegisterResponseData {
  message: string;
  username: string;
  email: string;
}

export const registerApi = async (data: RegisterFormValues): Promise<RegisterResponseData> => {
  const response = await apiClient.post<ApiResponse<RegisterResponseData>>('/auth/register', data);
  return response.data.data;
};

export const loginApi = async (data: LoginFormValues): Promise<AuthLoginResponseData> => {
  const response = await apiClient.post<ApiResponse<AuthLoginResponseData>>('/auth/login', {
    username: data.username,
    password: data.password,
  });
  return response.data.data;
};

export const logoutApi = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};

export const getProfileApi = async (): Promise<User> => {
  const response = await apiClient.get<ApiResponse<User>>('/auth/me');
  return response.data.data;
};

export const updateProfileApi = async (data: UpdateProfileFormValues): Promise<User> => {
  const response = await apiClient.put<ApiResponse<User>>('/auth/profile', data);
  return response.data.data;
};

export const changePasswordApi = async (data: ChangePasswordFormValues): Promise<string> => {
  const response = await apiClient.put<ApiResponse<string>>('/auth/change-password', data);
  return response.data.data;
};
