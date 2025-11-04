/**
 * Error Handling Utility
 * 
 * Design Rationale:
 * - Centralized error handling for consistent UX
 * - Specific handling for timeout and user not found errors
 * - User-friendly error messages
 * - Extensible for future error types
 */

import { ApiError } from '../services/api'

/**
 * Handle API errors with user-friendly messages
 */
export function handleApiError(error: unknown, defaultMessage: string = 'An error occurred'): void {
  if (error instanceof ApiError) {
    // Handle specific error types
    if (error.isTimeout) {
      alert('Request timed out. The server took too long to respond. Please try again.')
      return
    }
    
    if (error.isUserNotFound) {
      alert('User not found. Please select a different user or create a new one.')
      return
    }
    
    // Handle authentication errors
    if (error.status === 401) {
      alert('Please select a user to continue.')
      return
    }
    
    // Use the error message from the API
    alert(error.message || defaultMessage)
    return
  }
  
  // Generic error fallback
  const message = error instanceof Error ? error.message : defaultMessage
  alert(message)
  
  // Log to console for debugging
  console.error('API Error:', error)
}

/**
 * Get user-friendly error message from error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isTimeout) {
      return 'Request timed out. Please try again.'
    }
    
    if (error.isUserNotFound) {
      return 'User not found. Please select a different user.'
    }
    
    return error.message || 'An error occurred'
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unknown error occurred'
}

