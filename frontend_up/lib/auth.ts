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
  if (typeof window !== "undefined") {
    if (token && token !== "null" && token !== "undefined") {
      localStorage.setItem("auth_token", token)
    } else {
      localStorage.removeItem("auth_token")
    }
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    const directToken = localStorage.getItem("auth_token")
    if (directToken && directToken !== "null" && directToken !== "undefined") {
      return directToken
    }
    const user = getUser()
    if (user?.token && user.token !== "null" && user.token !== "undefined") {
      return user.token
    }
  }
  return null
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user")
  }
}

export function setUser(user: AuthUser) {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user))
    if (user?.token && user.token !== "null" && user.token !== "undefined") {
      localStorage.setItem("auth_token", user.token)
    }
  }
}

export function getUser(): AuthUser | null {
  if (typeof window !== "undefined") {
    try {
      const user = localStorage.getItem("user")
      return user ? JSON.parse(user) : null
    } catch {
      return null
    }
  }
  return null
}

export function isAuthenticated(): boolean {
  return !!getUser()
}

