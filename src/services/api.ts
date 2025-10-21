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

const API_BASE_URL = '/api';

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(endpoint: string, data: any = {}): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new ApiError(`HTTP error! status: ${response.status}`, response.status);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new ApiError(result.error);
    }

    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  }
};

// Progression Engine API
export const progressionEngineApi = {
  async suggestWeight(data: SuggestWeightRequest): Promise<{ suggestion: ProgressionSuggestion }> {
    return apiRequest('/ProgressionEngine/suggestWeight', data);
  },

  async updateProgression(user: string, exercise: string, newWeight: number): Promise<void> {
    return apiRequest('/ProgressionEngine/updateProgression', { user, exercise, newWeight });
  },

  async getProgressionRule(exercise: string): Promise<{ rule: ProgressionRule }> {
    return apiRequest('/ProgressionEngine/getProgressionRule', { exercise });
  },

  async createProgressionRule(data: ProgressionRule): Promise<void> {
    return apiRequest('/ProgressionEngine/createProgressionRule', data);
  },

  async getUserProgression(user: string, exercise: string): Promise<UserProgression[]> {
    return apiRequest('/ProgressionEngine/_getUserProgression', { user, exercise });
  },

  async getAllProgressionRules(): Promise<ProgressionRule[]> {
    return apiRequest('/ProgressionEngine/_getAllProgressionRules', {});
  },

  async getAllUserProgressions(): Promise<UserProgression[]> {
    return apiRequest('/ProgressionEngine/_getAllUserProgressions', {});
  }
};

// Routine Planner API
export const routinePlannerApi = {
  async createTemplate(data: CreateTemplateRequest): Promise<{ templateId: string }> {
    return apiRequest('/RoutinePlanner/createTemplate', data);
  },

  async getSuggestedWorkout(user: string, date: string): Promise<{ template: WorkoutTemplate | null }> {
    return apiRequest('/RoutinePlanner/getSuggestedWorkout', { user, date });
  },

  async updateVolume(user: string, exercise: string, sets: number, reps: number, weight: number, weekStart?: string): Promise<void> {
    return apiRequest('/RoutinePlanner/updateVolume', { user, exercise, sets, reps, weight, weekStart });
  },

  async checkBalance(user: string, weekStart: string): Promise<{ imbalance: string[] }> {
    return apiRequest('/RoutinePlanner/checkBalance', { user, weekStart });
  },

  async getTemplate(templateId: string): Promise<WorkoutTemplate> {
    return apiRequest('/RoutinePlanner/getTemplate', { templateId });
  },

  async setDefaultTemplate(user: string, templateId: string): Promise<void> {
    return apiRequest('/RoutinePlanner/setDefaultTemplate', { user, templateId });
  },

  async getUserTemplates(user: string): Promise<WorkoutTemplate[]> {
    return apiRequest('/RoutinePlanner/_getUserTemplates', { user });
  },

  async getWeeklyVolume(user: string, weekStart: string): Promise<WeeklyVolume[]> {
    return apiRequest('/RoutinePlanner/_getWeeklyVolume', { user, weekStart });
  }
};

// Workout Tracking API
export const workoutTrackingApi = {
  async startSession(data: StartSessionRequest): Promise<{ sessionId: string }> {
    return apiRequest('/WorkoutTracking/startSession', data);
  },

  async recordExercise(data: RecordExerciseRequest): Promise<void> {
    return apiRequest('/WorkoutTracking/recordExercise', data);
  },

  async getLastWeight(user: string, exercise: string): Promise<{ weight: number | null }> {
    return apiRequest('/WorkoutTracking/getLastWeight', { user, exercise });
  },

  async getWorkoutHistory(user: string, exercise: string, limit: number): Promise<{ records: ExerciseRecord[] }> {
    return apiRequest('/WorkoutTracking/getWorkoutHistory', { user, exercise, limit });
  },

  async updateVolume(user: string, exercise: string, sets: number, reps: number, weight: number, weekStart?: string): Promise<void> {
    return apiRequest('/WorkoutTracking/updateVolume', { user, exercise, sets, reps, weight, weekStart });
  },

  async checkBalance(user: string, weekStart: string): Promise<{ imbalance: string[] }> {
    return apiRequest('/WorkoutTracking/checkBalance', { user, weekStart });
  },

  async getWeeklyVolume(user: string, weekStart: string): Promise<{ volumes: { muscleGroup: string; volume: number }[] }> {
    return apiRequest('/WorkoutTracking/getWeeklyVolume', { user, weekStart });
  },

  async getUserSessions(user: string): Promise<WorkoutSession[]> {
    return apiRequest('/WorkoutTracking/_getUserSessions', { user });
  },

  async getSessionRecords(sessionId: string): Promise<ExerciseRecord[]> {
    return apiRequest('/WorkoutTracking/_getSessionRecords', { sessionId });
  },

  async getUserRecords(user: string): Promise<ExerciseRecord[]> {
    return apiRequest('/WorkoutTracking/_getUserRecords', { user });
  },

  async deleteSession(sessionId: string): Promise<void> {
    return apiRequest('/WorkoutTracking/deleteSession', { sessionId });
  }
};

export { ApiError };
