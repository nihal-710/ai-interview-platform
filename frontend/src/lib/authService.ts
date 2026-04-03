const API_URL = process.env.NEXT_PUBLIC_API_URL

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────
export type AuthUser = {
  id:        string
  name:      string
  email:     string
  role:      string
  createdAt: string
}

export type AuthResponse = {
  success: boolean
  message: string
  data?: {
    user:  AuthUser
    token: string
  }
}

// ─────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────
export const register = async (
  name:     string,
  email:    string,
  password: string
): Promise<AuthResponse> => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name, email, password }),
  })
  return res.json()
}

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────
export const login = async (
  email:    string,
  password: string
): Promise<AuthResponse> => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  })
  return res.json()
}

// ─────────────────────────────────────────
// TOKEN HELPERS
// ─────────────────────────────────────────
export const saveToken = (token: string): void => {
  localStorage.setItem('prepai_token', token)
}

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('prepai_token')
}

export const removeToken = (): void => {
  localStorage.removeItem('prepai_token')
  localStorage.removeItem('prepai_user')
}

// ─────────────────────────────────────────
// USER HELPERS
// ─────────────────────────────────────────
export const saveUser = (user: AuthUser): void => {
  localStorage.setItem('prepai_user', JSON.stringify(user))
}

export const getUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('prepai_user')
  return raw ? JSON.parse(raw) : null
}

// ─────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────
export const logout = (): void => {
  removeToken()
  window.location.href = '/login'
}

// ─────────────────────────────────────────
// AUTH CHECK
// ─────────────────────────────────────────
export const isAuthenticated = (): boolean => {
  return !!getToken()
}