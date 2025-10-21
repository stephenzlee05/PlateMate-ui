<template>
  <div class="routine-planning">
    <div class="header">
      <h2>Routine Planning</h2>
      <div class="header-controls">
        <select v-model="selectedUserId" class="user-select">
          <option value="">Select User</option>
          <option v-for="user in users" :key="user.userId" :value="user.userId">
            {{ user.username }}
          </option>
        </select>
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
    <div v-if="selectedUserId" class="suggested-workout">
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
    <div v-if="selectedUserId" class="user-templates">
      <h3>Your Templates</h3>
      <div v-if="userTemplates.length > 0" class="templates-grid">
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
    <div v-if="selectedUserId" class="weekly-volume">
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
import { routinePlannerApi, userManagementApi, exerciseCatalogApi } from '../services/api'
import type { WorkoutTemplate, WeeklyVolume, CreateTemplateRequest } from '../types/api'

const users = ref<any[]>([])
const exercises = ref<any[]>([])
const selectedUserId = ref('')
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
  if (!selectedUserId.value) return

  loading.value = true
  try {
    await routinePlannerApi.createTemplate({
      user: selectedUserId.value,
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
    console.error('Error creating template:', error)
    alert('Failed to create template. Please try again.')
  } finally {
    loading.value = false
  }
}

const getSuggestedWorkout = async () => {
  if (!selectedUserId.value) return

  loading.value = true
  try {
    const result = await routinePlannerApi.getSuggestedWorkout(selectedUserId.value, suggestionDate.value)
    suggestedTemplate.value = result.template
  } catch (error) {
    console.error('Error getting suggested workout:', error)
    alert('Failed to get suggested workout. Please try again.')
  } finally {
    loading.value = false
  }
}

const setAsDefaultTemplate = async (templateId?: string) => {
  if (!selectedUserId.value) return

  const id = templateId || suggestedTemplate.value?.templateId
  if (!id) return

  loading.value = true
  try {
    await routinePlannerApi.setDefaultTemplate(selectedUserId.value, id)
    alert('Template set as default successfully!')
  } catch (error) {
    console.error('Error setting default template:', error)
    alert('Failed to set default template. Please try again.')
  } finally {
    loading.value = false
  }
}

const loadUserTemplates = async () => {
  if (!selectedUserId.value) return

  try {
    userTemplates.value = await routinePlannerApi.getUserTemplates(selectedUserId.value)
  } catch (error) {
    console.error('Error loading user templates:', error)
  }
}

const loadWeeklyVolume = async () => {
  if (!selectedUserId.value) return

  loading.value = true
  try {
    weeklyVolume.value = await routinePlannerApi.getWeeklyVolume(selectedUserId.value, volumeWeekStart.value)
  } catch (error) {
    console.error('Error loading weekly volume:', error)
    alert('Failed to load weekly volume. Please try again.')
  } finally {
    loading.value = false
  }
}

const checkBalance = async () => {
  if (!selectedUserId.value) return

  loading.value = true
  try {
    const result = await routinePlannerApi.checkBalance(selectedUserId.value, volumeWeekStart.value)
    muscleImbalances.value = result.imbalance
  } catch (error) {
    console.error('Error checking balance:', error)
    alert('Failed to check muscle balance. Please try again.')
  } finally {
    loading.value = false
  }
}

const getExerciseName = (exerciseId: string) => {
  const exercise = exercises.value.find(e => e.exerciseId === exerciseId)
  return exercise ? exercise.name : exerciseId
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
  loadUsers()
  loadExercises()
})
</script>

<style scoped>
.routine-planning {
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

.create-template-form {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.create-template-form h3 {
  margin-top: 0;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.exercises-selection {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 1rem;
  background: #f8f9fa;
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
  background: #e9ecef;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
}

.exercise-name {
  font-weight: 500;
  color: #2c3e50;
}

.exercise-muscles {
  color: #6c757d;
  font-size: 0.875rem;
}

.form-actions {
  margin-top: 2rem;
}

.suggested-workout {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.suggested-workout h3 {
  margin-top: 0;
  color: #2c3e50;
}

.suggestion-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
}

.date-input {
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.suggestion-result {
  border-top: 1px solid #dee2e6;
  padding-top: 2rem;
}

.template-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
}

.template-card h4 {
  margin-top: 0;
  color: #2c3e50;
  font-size: 1.25rem;
}

.template-details {
  margin: 1.5rem 0;
}

.template-exercises h5,
.template-muscles h5 {
  color: #495057;
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
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.template-actions {
  margin-top: 1rem;
}

.user-templates {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.user-templates h3 {
  margin-top: 0;
  color: #2c3e50;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.weekly-volume {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.weekly-volume h3 {
  margin-top: 0;
  color: #2c3e50;
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
  color: #495057;
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
  color: #495057;
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
  background: linear-gradient(90deg, #42b883, #369870);
  transition: width 0.3s ease;
}

.volume-value {
  min-width: 60px;
  text-align: right;
  font-weight: 500;
  color: #495057;
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

.no-suggestion, .no-templates {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
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
