export const AUTH_LIMITS = {
  VERIFICATION_CODE_LENGTH: 6,
  USERNAME_MIN_LENGTH: 1,
  USERNAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 64,
} as const

export const MAX_NAME_LENGTH = 100
export const PASSWORD_SUCCESS_REDIRECT_MS = 2_000
export const GOOGLE_CLIENT_ID = env.googleClientId
import { env } from '../../../shared/config/env'
