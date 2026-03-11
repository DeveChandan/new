export interface AuthUser {
  _id: string
  name: string
  email: string
  role: "worker" | "employer" | "admin"
  token: string
  mobile?: string
  companyName?: string
  businessType?: string
  companyDetails?: any
  availability?: "available" | "unavailable"
  rating?: number
  skills?: string[]
  workerType?: string[]
  profilePicture?: string
}

export function setAuthToken(token: string) {
  // Legacy support for older code, but we no longer store tokens in localStorage
  return;
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token")
  }
  return null
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user")
  }
}

export function setUser(user: AuthUser) {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user))
  }
}

export function getUser(): AuthUser | null {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user")
    return user ? JSON.parse(user) : null
  }
  return null
}

export function isAuthenticated(): boolean {
  return !!getUser()
}
