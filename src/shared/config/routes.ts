export const APP_ROUTES = {
  LANDING: '/', HOME: '/home', LOGIN: '/login', REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email', FORGOT_PASSWORD: '/forgot-password',
  VERIFY_RESET_CODE: '/verify-reset-code', RESET_PASSWORD: '/reset-password',
  SETTINGS: '/settings/account', SETTINGS_CHANGE_PASSWORD: '/settings/change-password',
  ACCOUNT_SECURITY: '/settings/account',
  PREFERENCES: '/settings',
  ABOUT: '/about', PRIVACY: '/privacy', TERMS: '/terms', HELP: '/help',
  SEARCH: '/search', EXPLORE: '/explore', BOOKMARKS: '/bookmarks', FOLLOW_RECOMMENDATIONS: '/follow',
  POST: '/post/:postId', PROFILE: '/:username', FOLLOWING: '/:username/following', FOLLOWERS: '/:username/followers',
  ADMIN: '/admin', ADMIN_USERS: '/admin/users', ADMIN_USER: '/admin/users/:userId',
  ADMIN_MODERATION: '/admin/moderation', ADMIN_REPORT: '/admin/moderation/:reportId', ADMIN_SETTINGS: '/admin/settings',
  SETTINGS_CHANGE_PASSWORD_RESET: '/settings/change-password/reset',
  profile: (username: string) => `/${encodeURIComponent(username)}`,
  post: (id: string) => `/post/${encodeURIComponent(id)}`,
  following: (username: string) => `/${encodeURIComponent(username)}/following`,
  followers: (username: string) => `/${encodeURIComponent(username)}/followers`,
  adminUser: (id: string) => `/admin/users/${encodeURIComponent(id)}`,
  adminReport: (id: string) => `/admin/moderation/${encodeURIComponent(id)}`,
  adminModerationForTarget: (type: string, id: string) => `/admin/moderation?${new URLSearchParams({ type, search: id })}`,
  followRecommendations: () => '/follow',
  explore: (tab = 'overview') => tab === 'overview' ? '/explore' : `/explore?${new URLSearchParams({ tab })}`,
  search: (criteria: object = {}) => {
    const params = new URLSearchParams({ type: 'posts' })
    for (const [key, value] of Object.entries(criteria)) {
      if (value === undefined || value === '' || value === false || value === 'anyone' || value === 'anywhere') continue
      params.set(key === 'query' ? 'q' : key, String(value))
    }
    return `/search?${params}`
  },
  forgotPassword: () => '/forgot-password',
} as const

export function safeReturnTo(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') && value.split(/[?#]/)[0] !== APP_ROUTES.LOGIN
    ? value : APP_ROUTES.HOME
}
