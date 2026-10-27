import { api } from '../../../shared/api/client'
import type {
  AuthResponse, LoginRequest, RegisterRequest, GoogleLoginRequest,
  VerifyEmailRequest, ResendVerificationCodeRequest, MessageResponse,
  ForgotPasswordRequest, VerifyResetCodeRequest, ResetPasswordRequest,
  StartPasswordChangeRequest, ConfirmPasswordChangeRequest,
} from '../types/auth'
import type { SessionUser } from '../types/session'

const publicOptions = { skipAuth: true }

export const authApi = {
  login: (body: LoginRequest) => api.post<AuthResponse>('/auth/login', { body, ...publicOptions }),
  register: (body: RegisterRequest) => api.post<MessageResponse>('/auth/register', { body, ...publicOptions }),
  verifyEmail: (body: VerifyEmailRequest) => api.post<AuthResponse>('/auth/verify-email', { body, ...publicOptions }),
  resendVerificationCode: (body: ResendVerificationCodeRequest) => api.post<MessageResponse>('/auth/resend-verification-code', { body, ...publicOptions }),
  refresh: (refreshToken: string) => api.post<AuthResponse>('/auth/refresh', { body: { refreshToken }, ...publicOptions }),
  logout: (refreshToken: string) => api.post<void>('/auth/logout', { body: { refreshToken }, ...publicOptions }),
  me: (signal?: AbortSignal) => api.get<SessionUser>('/me', { signal }),
  loginWithGoogle: (body: GoogleLoginRequest, signal?: AbortSignal) => api.post<AuthResponse>('/auth/google', { body, signal, ...publicOptions }),
  linkGoogle: (body: GoogleLoginRequest, signal?: AbortSignal) => api.post<void>('/auth/google/link', { body, signal }),
  forgotPassword: (body: ForgotPasswordRequest) => api.post<MessageResponse>('/auth/forgot-password', { body, ...publicOptions }),
  verifyResetCode: (body: VerifyResetCodeRequest) => api.post<MessageResponse>('/auth/verify-reset-code', { body, ...publicOptions }),
  resetPassword: (body: ResetPasswordRequest) => api.post<MessageResponse>('/auth/reset-password', { body, ...publicOptions }),
  startPasswordChange: (body: StartPasswordChangeRequest) => api.post<MessageResponse>('/me/change-password/start', { body }),
  confirmPasswordChange: (body: ConfirmPasswordChangeRequest) => api.post<MessageResponse>('/me/change-password/confirm', { body }),
}
