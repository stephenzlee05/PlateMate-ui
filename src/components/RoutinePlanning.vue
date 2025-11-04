<template>
  <div class="routine-planning">
    <div class="header">
      <h2>Routine Planning</h2>
      <div class="header-controls">
        <div class="user-info">
          <span class="user-name">{{ currentUser?.username }}</span>
        </div>
        <button @click="showCreateTemplateForm = !showCreateTemplateForm" class="btn btn-primary">
          {{ showCreateTemplateForm ? 'Cancel' : 'Create Template' }}
        </button>
      </div>
    </div>

    <!-- Create Template Form -->
    <div v-if="showCreateTemplateForm" class="create-template-form">
      <h3>Create Workout Template</h3>
      <form @submit.prevent="createTemplate">
        <div class="form-group">
          <label for="templateName">Template Name:</label>
          <input 
            id="templateName" 
            v-model="newTemplate.name" 
            type="text" 
            required 
            placeholder="e.g., Upper Body Strength"
          />
        </div>

        <div class="form-group">
          <label for="templateExercises">Exercises:</label>
          <div class="exercises-selection">
            <div v-for="exercise in exercises" :key="exercise.exerciseId" class="exercise-option">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  :value="exercise.exerciseId"
                  v-model="newTemplate.exercises"
                />
                <span class="exercise-name">{{ exercise.name }}</span>
                <span class="exercise-muscles">{{ exercise.muscleGroups.join(', ') }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="loading || newTemplate.exercises.length === 0">
            {{ loading ? 'Creating...' : 'Create Template' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Suggested Workout -->
    <div v-if="currentUser" class="suggested-workout">
      <h3>Suggested Workout</h3>
      <div class="suggestion-controls">
        <input 
          v-model="suggestionDate" 
          type="date" 
          class="date-input"
        />
        <button @click="getSuggestedWorkout" class="btn btn-secondary" :disabled="loading">
          {{ loading ? 'Getting Suggestion...' : 'Get Suggested Workout' }}
        </button>
      </div>

      <div v-if="suggestedTemplate" class="suggestion-result">
        <div class="template-card">
          <h4>{{ suggestedTemplate.name }}</h4>
          <div class="template-details">
            <div class="template-exercises">
              <h5>Exercises:</h5>
              <ul>
                <li v-for="exerciseId in suggestedTemplate.exercises" :key="exerciseId">
                  {{ getExerciseName(exerciseId) }}
                </li>
              </ul>
            </div>
            <div class="template-muscles">
              <h5>Muscle Groups:</h5>
              <div class="muscle-tags">
                <span v-for="muscle in suggestedTemplate.muscleGroups" :key="muscle" class="muscle-tag">
                  {{ muscle }}
                </span>
              </div>
            </div>
          </div>
          <div class="template-actions">
            <button @click="setAsDefaultTemplate" class="btn btn-success" :disabled="loading">
              {{ loading ? 'Setting...' : 'Set as Default' }}
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="!loading" class="no-suggestion">
        No workout suggestion available for this date.
      </div>
    </div>

    <!-- User Templates -->
    <div v-if="currentUser" class="user-templates">
      <h3>Your Templates</h3>
      <div v-if="loading && userTemplates.length === 0" class="loading-templates">
        Loading templates...
      </div>
      <div v-else-if="userTemplates.length > 0" class="templates-grid">
        <div v-for="template in userTemplates" :key="template.templateId" class="template-card">
          <h4>{{ template.name }}</h4>
          <div class="template-details">
            <div class="template-exercises">
              <h5>Exercises ({{ template.exercises.length }}):</h5>
              <ul>
                <li v-for="exerciseId in template.exercises.slice(0, 3)" :key="exerciseId">
                  {{ getExerciseName(exerciseId) }}
                </li>
                <li v-if="template.exercises.length > 3" class="more-exercises">
                  +{{ template.exercises.length - 3 }} more...
                </li>
              </ul>
            </div>
            <div class="template-muscles">
              <h5>Muscle Groups:</h5>
              <div class="muscle-tags">
                <span v-for="muscle in template.muscleGroups" :key="muscle" class="muscle-tag">
                  {{ muscle }}
                </span>
              </div>
            </div>
          </div>
          <div class="template-actions">
            <button @click="setAsDefaultTemplate(template.templateId)" class="btn btn-sm btn-success" :disabled="loading">
              Set as Default
            </button>
          </div>
        </div>
      </div>
      <div v-else class="no-templates">
        No templates found. Create your first template above.
      </div>
    </div>

    <!-- Weekly Volume Tracking -->
    <div v-if="currentUser" class="weekly-volume">
      <h3>Weekly Volume Tracking</h3>
      <div class="volume-controls">
        <input 
          v-model="volumeWeekStart" 
          type="date" 
          class="date-input"
        />
        <button @click="loadWeeklyVolume" class="btn btn-secondary" :disabled="loading">
          {{ loading ? 'Loading...' : 'Load Volume' }}
        </button>
        <button @click="checkBalance" class="btn btn-warning" :disabled="loading">
          {{ loading ? 'Checking...' : 'Check Balance' }}
        </button>
      </div>

      <div v-if="weeklyVolume.length > 0" class="volume-chart">
        <h4>Muscle Group Volume</h4>
        <div class="volume-list">
          <div v-for="volume in weeklyVolume" :key="volume.muscleGroup" class="volume-item">
            <div class="volume-muscle">{{ volume.muscleGroup }}</div>
            <div class="volume-bar">
              <div 
                class="volume-fill" 
                :style="{ width: `${Math.min((volume.volume / maxVolume) * 100, 100)}%` }"
              ></div>
            </div>
            <div class="volume-value">{{ volume.volume.toFixed(1) }}</div>
          </div>
        </div>
      </div>

      <div v-if="muscleImbalances.length > 0" class="imbalance-warning">
        <h4>⚠️ Muscle Group Imbalances Detected</h4>
        <ul>
          <li v-for="imbalance in muscleImbalances" :key="imbalance">
            {{ imbalance }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { currentUser, getUserId } from '../services/auth'
import { routinePlannerApi, exerciseCatalogApi } from '../services/api'
import { handleApiError } from '../utils/errorHandler'
import type { WorkoutTemplate, WeeklyVolume, CreateTemplateRequest } from '../types/api'

const exercises = ref<any[]>([])
const userTemplates = ref<WorkoutTemplate[]>([])
const suggestedTemplate = ref<WorkoutTemplate | null>(null)
const weeklyVolume = ref<WeeklyVolume[]>([])
const muscleImbalances = ref<string[]>([])
const loading = ref(false)
const showCreateTemplateForm = ref(false)

const suggestionDate = ref(new Date().toISOString().split('T')[0])
const volumeWeekStart = ref(new Date().toISOString().split('T')[0])

const newTemplate = ref<CreateTemplateRequest>({
  user: '',
  name: '',
  exercises: []
})

const maxVolume = computed(() => {
  if (weeklyVolume.value.length === 0) return 1
  return Math.max(...weeklyVolume.value.map(v => v.volume))
})

const createTemplate = async () => {
  const userId = getUserId()
  if (!userId) {
    alert('Please select a user to continue.')
    return
  }

  loading.value = true
  try {
    await routinePlannerApi.createTemplate({
      user: userId,
      name: newTemplate.value.name,
      exercises: newTemplate.value.exercises
    })
    
    // Reset form
    newTemplate.value = {
      user: '',
      name: '',
      exercises: []
    }
    showCreateTemplateForm.value = false
    
    // Reload templates
    await loadUserTemplates()
    alert('Template created successfully!')
  } catch (error) {
    handleApiError(error, 'Failed to create template')
  } finally {
    loading.value = false
  }
}

const getSuggestedWorkout = async () => {
  const userId = getUserId()
  if (!userId) return

  loading.value = true
  try {
    const result = await routinePlannerApi.getSuggestedWorkout(userId, suggestionDate.value)
    suggestedTemplate.value = result.template
  } catch (error) {
    handleApiError(error, 'Failed to get suggested workout')
  } finally {
    loading.value = false
  }
}

const setAsDefaultTemplate = async (templateId?: string) => {
  const userId = getUserId()
  if (!userId) return

  const id = templateId || suggestedTemplate.value?.templateId
  if (!id) return

  loading.value = true
  try {
    await routinePlannerApi.setDefaultTemplate(userId, id)
    alert('Template set as default successfully!')
  } catch (error) {
    handleApiError(error, 'Failed to set default template')
  } finally {
    loading.value = false
  }
}

const loadUserTemplates = async () => {
  const userId = getUserId()
  if (!userId) return

  loading.value = true
  try {
    const templates = await routinePlannerApi.getUserTemplates(userId)
    userTemplates.value = templates || []
    console.log('Loaded templates:', templates)
  } catch (error) {
    console.error('Error loading templates:', error)
    handleApiError(error, 'Failed to load user templates')
    userTemplates.value = []
  } finally {
    loading.value = false
  }
}

const loadWeeklyVolume = async () => {
  const userId = getUserId()
  if (!userId) return

  loading.value = true
  try {
    weeklyVolume.value = await routinePlannerApi.getWeeklyVolume(userId, volumeWeekStart.value)
  } catch (error) {
    handleApiError(error, 'Failed to load weekly volume')
  } finally {
    loading.value = false
  }
}

const checkBalance = async () => {
  const userId = getUserId()
  if (!userId) return

  loading.value = true
  try {
    const result = await routinePlannerApi.checkBalance(userId, volumeWeekStart.value)
    muscleImbalances.value = result.imbalance
  } catch (error) {
    handleApiError(error, 'Failed to check muscle balance')
  } finally {
    loading.value = false
  }
}

const getExerciseName = (exerciseId: string) => {
  const exercise = exercises.value.find(e => e.exerciseId === exerciseId)
  return exercise ? exercise.name : exerciseId
}

const loadExercises = async () => {
  try {
    const result = await exerciseCatalogApi.getAllExercises()
    exercises.value = result.exercises
  } catch (error) {
    handleApiError(error, 'Failed to load exercises')
  }
}

// Watch for user authentication changes
watch(() => currentUser.value?.userId, (newUserId) => {
  if (newUserId) {
    newTemplate.value.user = newUserId
    loadUserTemplates()
  } else {
    userTemplates.value = []
    suggestedTemplate.value = null
    weeklyVolume.value = []
    muscleImbalances.value = []
  }
})

onMounted(() => {
  loadExercises()
  if (getUserId()) {
    loadUserTemplates()
  }
})
</script>

<style scoped>
.routine-planning {
  padding: 1rem;
  color: #90caf9;
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
  color: #4a90a4;
  margin: 0;
}

.header-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-name {
  font-weight: 600;
  color: #4a90a4;
  padding: 0.5rem 1rem;
  background: #fafcfd;
  border-radius: 4px;
  border: 1px solid #d1e7f0;
}

.create-template-form {
  background: linear-gradient(to bottom, #ffffff, #fafcfd);
  border: 1px solid #d1e7f0;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(74, 144, 164, 0.08);
}

.create-template-form h3 {
  margin-top: 0;
  color: #4a90a4;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #5a9bb4;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1e7f0;
  border-radius: 4px;
  font-size: 1rem;
  background: #fafcfd;
}

.exercises-selection {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #d1e7f0;
  border-radius: 4px;
  padding: 1rem;
  background: #fafcfd;
}

.exercise-option {
  margin-bottom: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.checkbox-label:hover {
  background: #f0f7f9;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
}

.exercise-name {
  font-weight: 500;
  color: #4a90a4;
}

.exercise-muscles {
  color: #6c757d;
  font-size: 0.875rem;
}

.form-actions {
  margin-top: 2rem;
}

.suggested-workout {
  background: linear-gradient(to bottom, #ffffff, #f0f8ff);
  border: 1px solid #90caf9;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2);
}

.suggested-workout h3 {
  margin-top: 0;
  color: #4a90a4;
}

.suggestion-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
}

.date-input {
  padding: 0.75rem;
  border: 1px solid #d1e7f0;
  border-radius: 4px;
  font-size: 1rem;
  background: #fafcfd;
}

.suggestion-result {
  border-top: 1px solid #dee2e6;
  padding-top: 2rem;
}

.template-card {
  background: linear-gradient(to bottom, #fafcfd, #f0f7f9);
  border: 1px solid #d1e7f0;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 164, 0.12);
}

.template-card h4 {
  margin-top: 0;
  color: #4a90a4;
  font-size: 1.25rem;
}

.template-details {
  margin: 1.5rem 0;
}

.template-exercises h5,
.template-muscles h5 {
  color: #5a9bb4;
  margin-bottom: 0.5rem;
}

.template-exercises ul {
  margin: 0;
  padding-left: 1.5rem;
}

.template-exercises li {
  margin-bottom: 0.25rem;
}

.more-exercises {
  color: #6c757d;
  font-style: italic;
}

.muscle-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.muscle-tag {
  background: #f0f7f9;
  color: #3a7080;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid #d1e7f0;
}

.template-actions {
  margin-top: 1rem;
}

.user-templates {
  background: linear-gradient(to bottom, #ffffff, #fafcfd);
  border: 1px solid #d1e7f0;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(74, 144, 164, 0.08);
}

.user-templates h3 {
  margin-top: 0;
  color: #4a90a4;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.weekly-volume {
  background: linear-gradient(to bottom, #ffffff, #fafcfd);
  border: 1px solid #d1e7f0;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(74, 144, 164, 0.08);
}

.weekly-volume h3 {
  margin-top: 0;
  color: #4a90a4;
}

.volume-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.volume-chart {
  margin-bottom: 2rem;
}

.volume-chart h4 {
  color: #5a9bb4;
  margin-bottom: 1rem;
}

.volume-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.volume-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.volume-muscle {
  min-width: 120px;
  font-weight: 500;
  color: #5a9bb4;
}

.volume-bar {
  flex: 1;
  height: 20px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.volume-fill {
  height: 100%;
  background: linear-gradient(90deg, #5a9bb4, #4a90a4);
  transition: width 0.3s ease;
}

.volume-value {
  min-width: 60px;
  text-align: right;
  font-weight: 500;
  color: #5a9bb4;
}

.imbalance-warning {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 2rem;
}

.imbalance-warning h4 {
  color: #856404;
  margin-top: 0;
}

.imbalance-warning ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
}

.imbalance-warning li {
  color: #856404;
  margin-bottom: 0.25rem;
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
  background: #5a9bb4;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4a90a4;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover:not(:disabled) {
  background: #e0a800;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.no-suggestion, .no-templates, .loading-templates {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}

.loading-templates {
  font-style: normal;
}

@media (max-width: 768px) {
  .header-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .suggestion-controls,
  .volume-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .templates-grid {
    grid-template-columns: 1fr;
  }
  
  .volume-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .volume-muscle {
    min-width: auto;
  }
  
  .volume-value {
    text-align: left;
  }
}
</style>
