import type {
  Exercise,
  User,
  UserPreferences,
  ProgressionSuggestion,
  ProgressionRule,
  UserProgression,
  WorkoutTemplate,
  WorkoutSession,
  ExerciseRecord,
  WeeklyVolume,
  AddExerciseRequest,
  SearchExercisesRequest,
  CreateUserRequest,
  UpdatePreferencesRequest,
  SuggestWeightRequest,
  RecordExerciseRequest,
  CreateTemplateRequest,
  StartSessionRequest
} from '../types/api';
import { getUserId } from './auth';

const API_BASE_URL = '/api';
const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Enhanced API Error class with specific error types
 * 
 * Design Rationale:
 * - Specific error types for better error handling in UI
 * - Preserves HTTP status codes for conditional handling
 * - User-friendly error messages
 */
class ApiError extends Error {
  constructor(
    message: string, 
    public status?: number,
    public isTimeout: boolean = false,
    public isUserNotFound: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Enhanced API request function with:
 * - Timeout handling (504 errors)
 * - User not found error detection
 * - Automatic userId injection for authenticated requests
 * - Better error messages
 * 
 * Design Rationale:
 * - Centralized error handling reduces code duplication
 * - Automatic authentication ensures all requests include userId when available
 * - Timeout handling prevents hanging requests
 * - Specific error detection enables targeted UI responses
 */
async function apiRequest<T>(
  endpoint: string, 
  data: any = {},
  options: { requireAuth?: boolean; timeout?: number } = {}
): Promise<T> {
  const { requireAuth = false, timeout = REQUEST_TIMEOUT } = options;
  
  // Inject userId if authentication is required and user is available
  if (requireAuth) {
    const userId = getUserId();
    if (!userId) {
      throw new ApiError('User authentication required. Please select a user.', 401);
    }
    
    // Always use the authenticated user ID when requireAuth is true
    // This ensures consistency and prevents issues with empty or incorrect user values
    // Handle both 'user' and 'userId' field names
    data.user = userId;
    if (data.userId) {
      delete data.userId; // Remove userId if present to avoid confusion
    }
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle HTTP errors
    if (!response.ok) {
      // Handle 504 Gateway Timeout
      if (response.status === 504) {
        throw new ApiError(
          'Request timed out. The server took too long to respond. Please try again.',
          504,
          true
        );
      }

      // Try to parse error response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorResult = await response.json();
        if (errorResult.error) {
          errorMessage = errorResult.error;
          
          // Check for "User not found" error
          const isUserNotFound = errorMessage.toLowerCase().includes('user not found');
          
          throw new ApiError(
            errorMessage,
            response.status,
            false,
            isUserNotFound
          );
        }
      } catch (parseError) {
        // If JSON parsing fails, use generic error
        throw new ApiError(errorMessage, response.status);
      }
    }

    const result = await response.json();
    
    // Check for error in response body
    if (result.error) {
      const errorMessage = result.error;
      const isUserNotFound = errorMessage.toLowerCase().includes('user not found');
      
      throw new ApiError(
        errorMessage,
        response.status,
        false,
        isUserNotFound
      );
    }

    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(
        'Request timed out. The server took too long to respond. Please try again.',
        504,
        true
      );
    }
    
    // Re-throw ApiError instances
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(
        'Network error: Unable to connect to server. Please check your connection.',
        0
      );
    }
    
    // Generic error fallback
    throw new ApiError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0
    );
  }
}

// Exercise Catalog API
export const exerciseCatalogApi = {
  async addExercise(data: AddExerciseRequest): Promise<{ exerciseId: string }> {
    return apiRequest('/ExerciseCatalog/addExercise', data);
  },

  async searchExercises(data: SearchExercisesRequest): Promise<{ exercises: Exercise[] }> {
    return apiRequest('/ExerciseCatalog/searchExercises', data);
  },

  async getExercise(exerciseId: string): Promise<{ exercise: Exercise }> {
    return apiRequest('/ExerciseCatalog/getExercise', { exerciseId });
  },

  async recommendExercises(muscleGroup: string, limit: number): Promise<{ exerciseIds: string[] }> {
    return apiRequest('/ExerciseCatalog/recommendExercises', { muscleGroup, limit });
  },

  async getExercisesByMovementPattern(movementPattern: string): Promise<{ exerciseIds: string[] }> {
    return apiRequest('/ExerciseCatalog/getExercisesByMovementPattern', { movementPattern });
  },

  async getAllExercises(): Promise<{ exercises: Exercise[] }> {
    return apiRequest('/ExerciseCatalog/_getAllExercises', {});
  },

  async getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
    return apiRequest('/ExerciseCatalog/_getExercisesByMuscleGroup', { muscleGroup });
  },

  async getExercisesByEquipment(equipment: string): Promise<Exercise[]> {
    return apiRequest('/ExerciseCatalog/_getExercisesByEquipment', { equipment });
  }
};

// User Management API
export const userManagementApi = {
  async createUser(data: CreateUserRequest): Promise<{ userId: string }> {
    return apiRequest('/UserManagement/createUser', data);
  },

  async getUser(userId: string): Promise<{ user: User }> {
    return apiRequest('/UserManagement/getUser', { userId });
  },

  async getUserPreferencesId(userId: string): Promise<{ preferencesId: string }> {
    return apiRequest('/UserManagement/getUserPreferencesId', { userId });
  },

  async createDefaultPreferences(userId: string): Promise<{ preferencesId: string }> {
    return apiRequest('/UserManagement/createDefaultPreferences', { userId });
  },

  async updatePreferences(data: UpdatePreferencesRequest): Promise<void> {
    return apiRequest('/UserManagement/updatePreferences', data);
  },

  async updatePreferencesById(preferencesId: string, preferences: Partial<UserPreferences>): Promise<void> {
    return apiRequest('/UserManagement/updatePreferencesById', { preferencesId, preferences });
  },

  async getPreferences(preferencesId: string): Promise<UserPreferences> {
    return apiRequest('/UserManagement/getPreferences', { preferencesId });
  },

  async getPreferencesByUser(userId: string): Promise<{ preferencesId: string }> {
    return apiRequest('/UserManagement/getPreferencesByUser', { userId });
  },

  async getAllUsers(): Promise<User[]> {
    return apiRequest('/UserManagement/_getAllUsers', {});
  },

  async deleteUser(userId: string): Promise<void> {
    return apiRequest('/UserManagement/deleteUser', { userId });
  }
};

// Progression Engine API
export const progressionEngineApi = {
  async suggestWeight(data: SuggestWeightRequest): Promise<{ suggestion: ProgressionSuggestion }> {
    // requireAuth: true - automatically injects userId from auth state
    return apiRequest('/ProgressionEngine/suggestWeight', data, { requireAuth: true });
  },

  async updateProgression(user: string, exercise: string, newWeight: number): Promise<void> {
    // requireAuth: true - automatically injects userId from auth state
    return apiRequest('/ProgressionEngine/updateProgression', { user, exercise, newWeight }, { requireAuth: true });
  },

  async getProgressionRule(exercise: string): Promise<{ rule: ProgressionRule }> {
    return apiRequest('/ProgressionEngine/getProgressionRule', { exercise });
  },

  async createProgressionRule(data: ProgressionRule): Promise<void> {
    return apiRequest('/ProgressionEngine/createProgressionRule', data);
  },

  async getUserProgression(user: string, exercise: string): Promise<UserProgression[]> {
    // requireAuth: true - automatically injects userId from auth state
    return apiRequest('/ProgressionEngine/_getUserProgression', { user, exercise }, { requireAuth: true });
  },

  async getAllProgressionRules(): Promise<ProgressionRule[]> {
    return apiRequest('/ProgressionEngine/_getAllProgressionRules', {});
  },

  async getAllUserProgressions(): Promise<UserProgression[]> {
    return apiRequest('/ProgressionEngine/_getAllUserProgressions', {});
  },

  async deleteProgressionRule(exercise: string): Promise<void> {
    return apiRequest('/ProgressionEngine/deleteProgressionRule', { exercise });
  }
};

// Routine Planner API
export const routinePlannerApi = {
  async createTemplate(data: CreateTemplateRequest): Promise<{ templateId: string }> {
    // requireAuth: true - automatically injects userId from auth state
    return apiRequest('/RoutinePlanner/createTemplate', data, { requireAuth: true });
  },

  async getSuggestedWorkout(user: string, date: string): Promise<{ template: WorkoutTemplate | null }> {
    // requireAuth: true - automatically injects userId from auth state
    return apiRequest('/RoutinePlanner/getSuggestedWorkout', { user, date }, { requireAuth: true });
  },

  async updateVolume(user: string, exercise: string, sets: number, reps: number, weight: number, weekStart?: string): Promise<void> {
    // requireAuth: true - automatically injects userId from auth state
    return apiRequest('/RoutinePlanner/updateVolume', { user, exercise, sets, reps, weight, weekStart }, { requireAuth: true });
  },

  async checkBalance(user: string, weekStart: string): Promise<{ imbalance: string[] }> {
    // requireAuth: true - automatically injects userId from auth state
    return apiRequest('/RoutinePlanner/checkBalance', { user, weekStart }, { requireAuth: true });
  },

  async getTemplate(templateId: string): Promise<WorkoutTemplate> {
    return apiRequest('/RoutinePlanner/getTemplate', { templateId });
  },

  async setDefaultTemplate(user: string, templateId: string): Promise<void> {
    // requireAuth: true - automatically injects userId from auth state
    return apiRequest('/RoutinePlanner/setDefaultTemplate', { user, templateId }, { requireAuth: true });
  },

  async getUserTemplates(user: string): Promise<WorkoutTemplate[]> {
    // requireAuth: true - automatically injects userId from auth state
    // Always use the authenticated user ID from auth state
    const result = await apiRequest<any>('/RoutinePlanner/_getUserTemplates', { user }, { requireAuth: true });
    // Handle both direct array response and wrapped response formats
    if (Array.isArray(result)) {
      return result;
    }
    // If backend returns wrapped format like { templates: [...] } or { data: [...] }
    if (result.templates && Array.isArray(result.templates)) {
      return result.templates;
    }
    if (result.data && Array.isArray(result.data)) {
      return result.data;
    }
    // If it's an empty object or unexpected format, return empty array
    console.warn('Unexpected response format from getUserTemplates:', result);
    return [];
  },

  async getWeeklyVolume(user: string, weekStart: string): Promise<WeeklyVolume[]> {
    // requireAuth: true - automatically injects userId from auth state
    return apiRequest('/RoutinePlanner/_getWeeklyVolume', { user, weekStart }, { requireAuth: true });
  }
};

// Workout Tracking API
export const workoutTrackingApi = {
  async startSession(data: StartSessionRequest): Promise<{ sessionId: string }> {
    // requireAuth: true - automatically injects userId from auth state
    return apiRequest('/WorkoutTracking/startSession', data, { requireAuth: true });
  },

  async recordExercise(data: RecordExerciseRequest): Promise<void> {
    return apiRequest('/WorkoutTracking/recordExercise', data);
  },

  async getLastWeight(user: string, exercise: string): Promise<{ weight: number | null }> {
    // requireAuth: true - automatically injects userId from auth state
    return apiRequest('/WorkoutTracking/getLastWeight', { user, exercise }, { requireAuth: true });
  },

  async getWorkoutHistory(user: string, exercise: string, limit: number): Promise<{ records: ExerciseRecord[] }> {
    // requireAuth: true - automatically injects userId from auth state
    return apiRequest('/WorkoutTracking/getWorkoutHistory', { user, exercise, limit }, { requireAuth: true });
  },

  async updateVolume(user: string, exercise: string, sets: number, reps: number, weight: number, weekStart?: string): Promise<void> {
    // requireAuth: true - automatically injects userId from auth state
    return apiRequest('/WorkoutTracking/updateVolume', { user, exercise, sets, reps, weight, weekStart }, { requireAuth: true });
  },

  async checkBalance(user: string, weekStart: string): Promise<{ imbalance: string[] }> {
    // requireAuth: true - automatically injects userId from auth state
    return apiRequest('/WorkoutTracking/checkBalance', { user, weekStart }, { requireAuth: true });
  },

  async getWeeklyVolume(user: string, weekStart: string): Promise<{ volumes: { muscleGroup: string; volume: number }[] }> {
    // requireAuth: true - automatically injects userId from auth state
    return apiRequest('/WorkoutTracking/getWeeklyVolume', { user, weekStart }, { requireAuth: true });
  },

  async getUserSessions(user: string): Promise<WorkoutSession[]> {
    // requireAuth: true - automatically injects userId from auth state
    return apiRequest('/WorkoutTracking/_getUserSessions', { user }, { requireAuth: true });
  },

  async getSessionRecords(sessionId: string): Promise<ExerciseRecord[]> {
    return apiRequest('/WorkoutTracking/_getSessionRecords', { sessionId });
  },

  async getUserRecords(user: string): Promise<ExerciseRecord[]> {
    // requireAuth: true - automatically injects userId from auth state
    return apiRequest('/WorkoutTracking/_getUserRecords', { user }, { requireAuth: true });
  },

  async deleteSession(sessionId: string): Promise<void> {
    return apiRequest('/WorkoutTracking/deleteSession', { sessionId });
  }
};

export { ApiError };
