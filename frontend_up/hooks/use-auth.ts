"use client"

import { useEffect, useState, useCallback } from "react"
import { type AuthUser, getAuthToken, getUser, isAuthenticated, clearAuthToken } from "@/lib/auth"
import { apiClient } from "@/lib/api" // Import apiClient

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedUser = await apiClient.getProfile() as AuthUser;
      setUser(fetchedUser);
      localStorage.setItem("user", JSON.stringify(fetchedUser)); // Update localStorage
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
      setUser(null); // Clear user if profile fetch fails
      clearAuthToken();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      setUser(null);
      clearAuthToken();
    }
  }, []);

  useEffect(() => {
    const authUser = getUser()
    if (authUser) {
      setUser(authUser)
      // Optionally, refresh user data on mount to ensure it's fresh
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]) // Add refreshUser to dependency array

  return {
    user,
    setUser,
    isLoading,
    isAuthenticated: isAuthenticated(),
    token: getAuthToken(),
    refreshUser, // Expose refreshUser
    logout, // Expose logout
  }
}
