import type { AuthResponse } from './auth'

export interface StoredSession extends AuthResponse {
  sessionId: string
}

export interface SessionUser {
  location?: import('../../profiles').User['location']
  birthDate?: string | null
  birthDateVisibility?: import('../../profiles').BirthDateVisibility | null
  birthYearVisibility?: import('../../profiles').BirthDateVisibility | null
  isBlocked?: boolean
  id: string
  username: string
  email: string | null
  displayName: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  bio: string | null
  role: 'User' | 'Admin'
  isVerified: boolean
  followersCount: number
  followingCount: number
  postsCount: number
  isFollowedByCurrentUser: boolean
  createdAt: string
}
