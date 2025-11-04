/**
 * Authentication State Management
 * 
 * Design Rationale:
 * - Centralized authentication state management
 * - Simple user selection/authentication (no passwords for now - backend handles user IDs)
 * - Persistent storage using localStorage for UX
 * - Reactive state for Vue components
 */

import { ref, computed } from 'vue'
import type { User } from '../types/api'

// Reactive state
const currentUser = ref<User | null>(null)
const isAuthenticated = computed(() => currentUser.value !== null)

// Load user from localStorage on initialization
const loadStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem('platemate_current_user')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading stored user:', error)
    localStorage.removeItem('platemate_current_user')
  }
  return null
}

// Initialize from storage
const storedUser = loadStoredUser()
if (storedUser) {
  currentUser.value = storedUser
}

/**
 * Set the current authenticated user
 */
const setUser = (user: User | null): void => {
  currentUser.value = user
  if (user) {
    localStorage.setItem('platemate_current_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('platemate_current_user')
  }
}

/**
 * Get the current user ID
 */
const getUserId = (): string | null => {
  return currentUser.value?.userId || null
}

/**
 * Clear authentication (logout)
 */
const clearAuth = (): void => {
  setUser(null)
}

export {
  currentUser,
  isAuthenticated,
  setUser,
  getUserId,
  clearAuth
}

