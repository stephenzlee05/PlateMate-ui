<template>
  <div class="workout-tracking">
    <div class="header">
      <h2>Workout Tracking</h2>
      <div class="header-controls">
        <select v-model="selectedUserId" class="user-select">
          <option value="">Select User</option>
          <option v-for="user in users" :key="user.userId" :value="user.userId">
            {{ user.username }}
          </option>
        </select>
        <button @click="startNewSession" class="btn btn-primary" :disabled="!selectedUserId || loading">
          {{ loading ? 'Starting...' : 'Start New Session' }}
        </button>
      </div>
    </div>

    <!-- Current Session -->
    <div v-if="currentSession" class="current-session">
      <h3>Current Session</h3>
      <div class="session-info">
        <div class="info-item">
          <strong>Session ID:</strong> {{ currentSession.sessionId }}
        </div>
        <div class="info-item">
          <strong>Name:</strong> {{ currentSession.name || 'Unnamed Session' }}
        </div>
        <div class="info-item">
          <strong>Date:</strong> {{ formatDate(currentSession.date) }}
        </div>
      </div>

      <!-- Add Exercise to Session -->
      <div class="add-exercise-form">
        <h4>Add Exercise</h4>
        <form @submit.prevent="addExerciseToSession">
          <div class="form-row">
            <div class="form-group">
              <label for="exerciseSelect">Exercise:</label>
              <select id="exerciseSelect" v-model="exerciseForm.exercise" required>
                <option value="">Select Exercise</option>
                <option v-for="exercise in exercises" :key="exercise.exerciseId" :value="exercise.exerciseId">
                  {{ exercise.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="weight">Weight:</label>
              <input 
                id="weight" 
                v-model.number="exerciseForm.weight" 
                type="number" 
                step="0.5"
                min="0"
                required
              />
            </div>

            <div class="form-group">
              <label for="sets">Sets:</label>
              <input 
                id="sets" 
                v-model.number="exerciseForm.sets" 
                type="number" 
                min="1"
                required
              />
            </div>

            <div class="form-group">
              <label for="reps">Reps:</label>
              <input 
                id="reps" 
                v-model.number="exerciseForm.reps" 
                type="number" 
                min="1"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="notes">Notes:</label>
            <textarea 
              id="notes" 
              v-model="exerciseForm.notes" 
              rows="2"
              placeholder="Optional notes about this exercise..."
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Adding...' : 'Add Exercise' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Session Exercises -->
      <div v-if="sessionExercises.length > 0" class="session-exercises">
        <h4>Exercises in This Session</h4>
        <div class="exercises-list">
          <div v-for="exercise in sessionExercises" :key="`${exercise.sessionId}-${exercise.exercise}`" class="exercise-item">
            <div class="exercise-details">
              <strong>{{ getExerciseName(exercise.exercise) }}</strong>
              <div class="exercise-stats">
                {{ exercise.weight }}lbs × {{ exercise.sets }} sets × {{ exercise.reps }} reps
              </div>
              <div v-if="exercise.notes" class="exercise-notes">
                {{ exercise.notes }}
              </div>
            </div>
            <div class="exercise-time">
              {{ formatTime(exercise.recordedAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Workout History -->
    <div class="workout-history">
      <h3>Workout History</h3>
      
      <div class="history-controls">
        <select v-model="historyExerciseFilter" class="filter-select">
          <option value="">All Exercises</option>
          <option v-for="exercise in exercises" :key="exercise.exerciseId" :value="exercise.exerciseId">
            {{ exercise.name }}
          </option>
        </select>
        <input 
          v-model.number="historyLimit" 
          type="number" 
          min="1" 
          max="100" 
          placeholder="Limit"
          class="limit-input"
        />
        <button @click="loadWorkoutHistory" class="btn btn-secondary" :disabled="!selectedUserId">
          Load History
        </button>
      </div>

      <div v-if="workoutHistory.length > 0" class="history-list">
        <div v-for="record in workoutHistory" :key="`${record.sessionId}-${record.exercise}-${record.recordedAt}`" class="history-item">
          <div class="history-details">
            <div class="history-exercise">
              <strong>{{ getExerciseName(record.exercise) }}</strong>
            </div>
            <div class="history-stats">
              {{ record.weight }}lbs × {{ record.sets }} sets × {{ record.reps }} reps
            </div>
            <div v-if="record.notes" class="history-notes">
              {{ record.notes }}
            </div>
          </div>
          <div class="history-meta">
            <div class="history-date">{{ formatDate(record.recordedAt) }}</div>
            <div class="history-time">{{ formatTime(record.recordedAt) }}</div>
          </div>
        </div>
      </div>

      <div v-else-if="!loading" class="no-history">
        No workout history found.
      </div>
    </div>

    <!-- User Sessions -->
    <div v-if="selectedUserId" class="user-sessions">
      <h3>All Sessions</h3>
      <div v-if="userSessions.length > 0" class="sessions-list">
        <div v-for="session in userSessions" :key="session.sessionId" class="session-item">
          <div class="session-details">
            <strong>{{ session.name || 'Unnamed Session' }}</strong>
            <div class="session-meta">
              <span class="session-id">ID: {{ session.sessionId }}</span>
              <span class="session-date">{{ formatDate(session.date) }}</span>
            </div>
          </div>
          <div class="session-actions">
            <button @click="loadSessionDetails(session.sessionId)" class="btn btn-sm btn-secondary">
              View Details
            </button>
            <button @click="deleteSession(session.sessionId)" class="btn btn-sm btn-danger" :disabled="loading">
              {{ loading ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
      <div v-else class="no-sessions">
        No sessions found for this user.
      </div>
    </div>

    <!-- Selected Session Details -->
    <div v-if="selectedSessionDetails.length > 0" class="session-details-modal">
      <h3>{{ getSessionName(selectedSessionId) }} Details</h3>
      <div class="details-exercises">
        <div v-for="exercise in selectedSessionDetails" :key="`${exercise.sessionId}-${exercise.exercise}-${exercise.recordedAt}`" class="detail-exercise-item">
          <div class="detail-exercise-info">
            <strong>{{ getExerciseName(exercise.exercise) }}</strong>
            <div class="detail-exercise-stats">
              {{ exercise.weight }}lbs × {{ exercise.sets }} sets × {{ exercise.reps }} reps
            </div>
            <div v-if="exercise.notes" class="detail-exercise-notes">
              {{ exercise.notes }}
            </div>
          </div>
          <div class="detail-exercise-time">
            {{ formatTime(exercise.recordedAt) }}
          </div>
        </div>
      </div>
      <div class="details-actions">
        <button @click="selectedSessionDetails = []; selectedSessionId = null" class="btn btn-secondary">
          Close Details
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { workoutTrackingApi, userManagementApi, exerciseCatalogApi } from '../services/api'
import type { WorkoutSession, ExerciseRecord, StartSessionRequest, RecordExerciseRequest } from '../types/api'

const users = ref<any[]>([])
const exercises = ref<any[]>([])
const selectedUserId = ref('')
const currentSession = ref<WorkoutSession | null>(null)
const sessionExercises = ref<ExerciseRecord[]>([])
const workoutHistory = ref<ExerciseRecord[]>([])
const userSessions = ref<WorkoutSession[]>([])
const selectedSessionDetails = ref<ExerciseRecord[]>([])
const selectedSessionId = ref<string | null>(null)
const loading = ref(false)

const historyExerciseFilter = ref('')
const historyLimit = ref(10)

const exerciseForm = ref<RecordExerciseRequest>({
  sessionId: '',
  exercise: '',
  weight: 0,
  sets: 0,
  reps: 0,
  notes: ''
})

const startNewSession = async () => {
  if (!selectedUserId.value) return

  loading.value = true
  try {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    // Generate session name from current date and time
    const sessionName = generateSessionName(now)
    
    const result = await workoutTrackingApi.startSession({
      user: selectedUserId.value,
      date: today,
      name: sessionName
    })
    
    currentSession.value = {
      sessionId: result.sessionId,
      user: selectedUserId.value,
      date: today,
      name: sessionName
    }
    
    exerciseForm.value.sessionId = result.sessionId
    await loadUserSessions()
  } catch (error) {
    console.error('Error starting session:', error)
    alert('Failed to start session. Please try again.')
  } finally {
    loading.value = false
  }
}

const addExerciseToSession = async () => {
  if (!currentSession.value) return

  loading.value = true
  try {
    await workoutTrackingApi.recordExercise(exerciseForm.value)
    
    // Reset form
    exerciseForm.value = {
      sessionId: currentSession.value.sessionId,
      exercise: '',
      weight: 0,
      sets: 0,
      reps: 0,
      notes: ''
    }
    
    // Reload session exercises
    await loadSessionExercises(currentSession.value.sessionId)
  } catch (error) {
    console.error('Error adding exercise:', error)
    alert('Failed to add exercise. Please try again.')
  } finally {
    loading.value = false
  }
}

const loadSessionExercises = async (sessionId: string) => {
  try {
    sessionExercises.value = await workoutTrackingApi.getSessionRecords(sessionId)
  } catch (error) {
    console.error('Error loading session exercises:', error)
  }
}

const loadWorkoutHistory = async () => {
  if (!selectedUserId.value || !historyExerciseFilter.value) return

  loading.value = true
  try {
    const result = await workoutTrackingApi.getWorkoutHistory(
      selectedUserId.value,
      historyExerciseFilter.value,
      historyLimit.value
    )
    workoutHistory.value = result.records
  } catch (error) {
    console.error('Error loading workout history:', error)
    alert('Failed to load workout history. Please try again.')
  } finally {
    loading.value = false
  }
}

const loadUserSessions = async () => {
  if (!selectedUserId.value) return

  try {
    const sessions = await workoutTrackingApi.getUserSessions(selectedUserId.value)
    
    // Generate names for sessions that don't have them
    userSessions.value = sessions.map(session => ({
      ...session,
      name: session.name || generateSessionNameFromDate(session.date)
    }))
  } catch (error) {
    console.error('Error loading user sessions:', error)
  }
}

const loadSessionDetails = async (sessionId: string) => {
  try {
    const exercises = await workoutTrackingApi.getSessionRecords(sessionId)
    selectedSessionDetails.value = exercises
    selectedSessionId.value = sessionId
  } catch (error) {
    console.error('Error loading session details:', error)
    alert('Failed to load session details. Please try again.')
  }
}

const deleteSession = async (sessionId: string) => {
  // Show confirmation dialog
  const confirmed = confirm(`Are you sure you want to delete session ${sessionId}? This action cannot be undone and will remove all exercise records for this session.`)
  if (!confirmed) return

  loading.value = true
  try {
    await workoutTrackingApi.deleteSession(sessionId)
    
    // If we're deleting the current session, clear it
    if (currentSession.value && currentSession.value.sessionId === sessionId) {
      currentSession.value = null
      sessionExercises.value = []
      exerciseForm.value = {
        sessionId: '',
        exercise: '',
        weight: 0,
        sets: 0,
        reps: 0,
        notes: ''
      }
    }
    
    // If we're viewing details for this session, clear them
    if (selectedSessionId.value === sessionId) {
      selectedSessionDetails.value = []
      selectedSessionId.value = null
    }
    
    // Reload the user sessions list
    await loadUserSessions()
    
    alert('Session deleted successfully.')
  } catch (error) {
    console.error('Error deleting session:', error)
    alert('Failed to delete session. Please try again.')
  } finally {
    loading.value = false
  }
}

const getExerciseName = (exerciseId: string) => {
  const exercise = exercises.value.find(e => e.exerciseId === exerciseId)
  return exercise ? exercise.name : exerciseId
}

const generateSessionName = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  
  return date.toLocaleDateString('en-US', options)
}

const generateSessionNameFromDate = (dateString: string) => {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  }
  
  return date.toLocaleDateString('en-US', options)
}

const getSessionName = (sessionId: string | null) => {
  if (!sessionId) return 'Session Details'
  const session = userSessions.value.find(s => s.sessionId === sessionId)
  if (session) {
    return session.name || generateSessionNameFromDate(session.date)
  }
  return `Session ${sessionId}`
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString()
}

const loadUsers = async () => {
  try {
    users.value = await userManagementApi.getAllUsers()
  } catch (error) {
    console.error('Error loading users:', error)
  }
}

const loadExercises = async () => {
  try {
    const result = await exerciseCatalogApi.getAllExercises()
    exercises.value = result.exercises
  } catch (error) {
    console.error('Error loading exercises:', error)
  }
}

// Watch for user selection changes
watch(selectedUserId, (newUserId) => {
  if (newUserId) {
    loadUserSessions()
  } else {
    currentSession.value = null
    sessionExercises.value = []
    workoutHistory.value = []
    userSessions.value = []
  }
})

onMounted(() => {
  loadUsers()
  loadExercises()
})
</script>

<style scoped>
.workout-tracking {
  padding: 1rem;
  color: #495057;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header h2 {
  color: #2c3e50;
  margin: 0;
}

.header-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.user-select {
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  min-width: 200px;
}

.current-session {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.current-session h3 {
  margin-top: 0;
  color: #2c3e50;
}

.session-info {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.info-item {
  margin-bottom: 0.5rem;
}

.info-item strong {
  color: #495057;
}

.add-exercise-form {
  margin-bottom: 2rem;
}

.add-exercise-form h4 {
  color: #495057;
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.form-actions {
  margin-top: 1rem;
}

.session-exercises {
  border-top: 1px solid #dee2e6;
  padding-top: 2rem;
}

.session-exercises h4 {
  color: #495057;
  margin-bottom: 1rem;
}

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.exercise-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.exercise-details strong {
  color: #2c3e50;
}

.exercise-stats {
  color: #6c757d;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.exercise-notes {
  color: #6c757d;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  font-style: italic;
}

.exercise-time {
  color: #6c757d;
  font-size: 0.875rem;
}

.workout-history {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.workout-history h3 {
  margin-top: 0;
  color: #2c3e50;
}

.history-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  min-width: 200px;
}

.limit-input {
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  width: 100px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.history-details {
  flex: 1;
}

.history-exercise strong {
  color: #2c3e50;
}

.history-stats {
  color: #6c757d;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.history-notes {
  color: #6c757d;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  font-style: italic;
}

.history-meta {
  text-align: right;
  color: #6c757d;
  font-size: 0.875rem;
}

.history-date {
  font-weight: 500;
}

.user-sessions {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.user-sessions h3 {
  margin-top: 0;
  color: #2c3e50;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.session-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.session-details strong {
  color: #2c3e50;
}

.session-meta {
  display: flex;
  gap: 1rem;
  margin-top: 0.25rem;
  font-size: 0.9rem;
  color: #6c757d;
}

.session-id {
  font-family: monospace;
}

.session-date {
  color: #6c757d;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-primary {
  background: #42b883;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #369870;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.no-history, .no-sessions {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}

.session-details-modal {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 2rem;
  margin-top: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.session-details-modal h3 {
  margin-top: 0;
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.details-exercises {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.detail-exercise-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.detail-exercise-info strong {
  color: #2c3e50;
}

.detail-exercise-stats {
  color: #6c757d;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.detail-exercise-notes {
  color: #6c757d;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  font-style: italic;
}

.detail-exercise-time {
  color: #6c757d;
  font-size: 0.875rem;
}

.details-actions {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .header-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .history-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .session-meta {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>
