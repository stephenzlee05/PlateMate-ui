// API Types for PlateMate Backend

export interface Exercise {
  exerciseId: string;
  name: string;
  muscleGroups: string[];
  movementPattern: string;
  equipment: string | null;
  instructions: string | null;
}

export interface User {
  userId: string;
  username: string;
  email: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  defaultIncrement: number;
  units: string;
  notifications: boolean;
}

export interface ProgressionSuggestion {
  newWeight: number;
  reason: string;
  action: 'increase' | 'maintain' | 'deload';
}

export interface ProgressionRule {
  exercise: string;
  increment: number;
  deloadThreshold: number;
  targetSessions: number;
}

export interface UserProgression {
  user: string;
  exercise: string;
  currentWeight: number;
  sessionsAtWeight: number;
  lastProgression: string;
}

export interface WorkoutTemplate {
  templateId: string;
  name: string;
  exercises: string[];
  muscleGroups: string[];
}

export interface WorkoutSession {
  sessionId: string;
  user: string;
  date: string;
  name?: string;
}

export interface ExerciseRecord {
  sessionId: string;
  exercise: string;
  weight: number;
  sets: number;
  reps: number;
  notes: string | null;
  recordedAt: string;
}

export interface WeeklyVolume {
  user: string;
  muscleGroup: string;
  weekStart: string;
  volume: number;
}

// API Request/Response Types
export interface AddExerciseRequest {
  name: string;
  muscleGroups: string[];
  movementPattern: string;
  equipment: string | null;
  instructions: string | null;
}

export interface SearchExercisesRequest {
  query: string | null;
  muscleGroup: string | null;
}

export interface CreateUserRequest {
  username: string;
  email: string;
}

export interface UpdatePreferencesRequest {
  userId: string;
  preferences: Partial<UserPreferences>;
}

export interface SuggestWeightRequest {
  user: string;
  exercise: string;
  lastWeight: number;
  lastSets: number;
  lastReps: number;
}

export interface RecordExerciseRequest {
  sessionId: string;
  exercise: string;
  weight: number;
  sets: number;
  reps: number;
  notes: string | null;
}

export interface CreateTemplateRequest {
  user: string;
  name: string;
  exercises: string[];
}

export interface StartSessionRequest {
  user: string;
  date: string;
  name?: string;
}

