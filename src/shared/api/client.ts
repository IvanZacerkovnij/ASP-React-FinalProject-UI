import { env } from '../config/env'
import { createHttpClient } from './http-client'

export const api = createHttpClient({ baseUrl: env.apiBaseUrl })
