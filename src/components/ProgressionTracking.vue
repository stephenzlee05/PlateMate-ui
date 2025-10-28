<template>
  <div class="progression-tracking">
    <div class="header">
      <h2>Progression Tracking</h2>
      <div class="header-controls">
        <select v-model="selectedUserId" class="user-select">
          <option value="">Select User</option>
          <option v-for="user in users" :key="user.userId" :value="user.userId">
            {{ user.username }}
          </option>
        </select>
        <select v-model="selectedExerciseId" class="exercise-select">
          <option value="">Select Exercise</option>
          <option v-for="exercise in exercises" :key="exercise.exerciseId" :value="exercise.exerciseId">
            {{ exercise.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Weight Suggestion -->
    <div v-if="selectedUserId && selectedExerciseId" class="weight-suggestion">
      <h3>Weight Progression Suggestion</h3>
      <div class="suggestion-form">
        <form @submit.prevent="getWeightSuggestion">
          <div class="form-row">
            <div class="form-group">
              <label for="lastWeight">Last Weight:</label>
              <input 
                id="lastWeight" 
                v-model.number="suggestionForm.lastWeight" 
                type="number" 
                step="0.5"
                min="0"
                required
              />
            </div>

            <div class="form-group">
              <label for="lastSets">Last Sets:</label>
              <input 
                id="lastSets" 
                v-model.number="suggestionForm.lastSets" 
                type="number" 
                min="1"
                required
              />
            </div>

            <div class="form-group">
              <label for="lastReps">Last Reps:</label>
              <input 
                id="lastReps" 
                v-model.number="suggestionForm.lastReps" 
                type="number" 
                min="1"
                required
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Getting Suggestion...' : 'Get Weight Suggestion' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Suggestion Result -->
      <div v-if="weightSuggestion" class="suggestion-result">
        <div class="suggestion-card" :class="suggestionClass">
          <h4>Progression Suggestion</h4>
          <div class="suggestion-details">
            <div class="suggestion-weight">
              <strong>Suggested Weight:</strong> {{ weightSuggestion.newWeight }}lbs
            </div>
            <div class="suggestion-action">
              <strong>Action:</strong> 
              <span :class="actionClass">{{ weightSuggestion.action }}</span>
            </div>
            <div class="suggestion-reason">
              <strong>Reason:</strong> {{ weightSuggestion.reason }}
            </div>
          </div>
          <div class="suggestion-actions">
            <button @click="applySuggestion" class="btn btn-success" :disabled="loading">
              {{ loading ? 'Applying...' : 'Apply Suggestion' }}
            </button>
            <button @click="weightSuggestion = null" class="btn btn-secondary">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Progression Rules -->
    <div class="progression-rules">
      <h3>Progression Rules</h3>
      <div class="rules-controls">
        <select v-model="ruleExerciseFilter" class="filter-select">
          <option value="">All Exercises</option>
          <option v-for="exercise in exercises" :key="exercise.exerciseId" :value="exercise.exerciseId">
            {{ exercise.name }}
          </option>
        </select>
        <button @click="loadProgressionRules" class="btn btn-secondary">
          Load Rules
        </button>
        <button @click="showCreateRuleForm = !showCreateRuleForm" class="btn btn-primary">
          {{ showCreateRuleForm ? 'Cancel' : 'Create Rule' }}
        </button>
      </div>

      <!-- Create Rule Form -->
      <div v-if="showCreateRuleForm" class="create-rule-form">
        <h4>Create Progression Rule</h4>
        <form @submit.prevent="createProgressionRule">
          <div class="form-row">
            <div class="form-group">
              <label for="ruleExercise">Exercise:</label>
              <select id="ruleExercise" v-model="newRule.exercise" required>
                <option value="">Select Exercise</option>
                <option v-for="exercise in exercises" :key="exercise.exerciseId" :value="exercise.exerciseId">
                  {{ exercise.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="increment">Increment (lbs):</label>
              <input 
                id="increment" 
                v-model.number="newRule.increment" 
                type="number" 
                step="0.5"
                min="0.5"
                required
              />
            </div>

            <div class="form-group">
              <label for="deloadThreshold">Deload Threshold:</label>
              <input 
                id="deloadThreshold" 
                v-model.number="newRule.deloadThreshold" 
                type="number" 
                min="1"
                required
              />
            </div>

            <div class="form-group">
              <label for="targetSessions">Target Sessions:</label>
              <input 
                id="targetSessions" 
                v-model.number="newRule.targetSessions" 
                type="number" 
                min="1"
                required
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Creating...' : 'Create Rule' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Rules List -->
      <div v-if="progressionRules.length > 0" class="rules-list">
        <div v-for="rule in progressionRules" :key="rule.exercise" class="rule-card">
          <div class="rule-details">
            <h4>{{ getExerciseName(rule.exercise) }}</h4>
            <div class="rule-stats">
              <div class="stat-item">
                <strong>Increment:</strong> {{ rule.increment }}lbs
              </div>
              <div class="stat-item">
                <strong>Deload Threshold:</strong> {{ rule.deloadThreshold }} sessions
              </div>
              <div class="stat-item">
                <strong>Target Sessions:</strong> {{ rule.targetSessions }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Progressions -->
    <div v-if="selectedUserId" class="user-progressions">
      <h3>User Progressions</h3>
      <div class="progressions-controls">
        <select v-model="progressionExerciseFilter" class="filter-select">
          <option value="">All Exercises</option>
          <option v-for="exercise in exercises" :key="exercise.exerciseId" :value="exercise.exerciseId">
            {{ exercise.name }}
          </option>
        </select>
        <button @click="loadUserProgressions" class="btn btn-secondary">
          Load Progressions
        </button>
      </div>

      <div v-if="userProgressions.length > 0" class="progressions-list">
        <div v-for="progression in userProgressions" :key="`${progression.user}-${progression.exercise}`" class="progression-card">
          <div class="progression-details">
            <h4>{{ getExerciseName(progression.exercise) }}</h4>
            <div class="progression-stats">
              <div class="stat-item">
                <strong>Current Weight:</strong> {{ progression.currentWeight }}lbs
              </div>
              <div class="stat-item">
                <strong>Sessions at Weight:</strong> {{ progression.sessionsAtWeight }}
              </div>
              <div class="stat-item">
                <strong>Last Progression:</strong> {{ formatDate(progression.lastProgression) }}
              </div>
            </div>
          </div>
          <div class="progression-actions">
            <button @click="updateProgression(progression)" class="btn btn-sm btn-primary">
              Update Weight
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { progressionEngineApi, userManagementApi, exerciseCatalogApi } from '../services/api'
import type { 
  ProgressionSuggestion, 
  ProgressionRule, 
  UserProgression, 
  SuggestWeightRequest 
} from '../types/api'

const users = ref<any[]>([])
const exercises = ref<any[]>([])
const selectedUserId = ref('')
const selectedExerciseId = ref('')
const progressionRules = ref<ProgressionRule[]>([])
const userProgressions = ref<UserProgression[]>([])
const weightSuggestion = ref<ProgressionSuggestion | null>(null)
const loading = ref(false)
const showCreateRuleForm = ref(false)

const ruleExerciseFilter = ref('')
const progressionExerciseFilter = ref('')

const suggestionForm = ref<SuggestWeightRequest>({
  user: '',
  exercise: '',
  lastWeight: 0,
  lastSets: 0,
  lastReps: 0
})

const newRule = ref<ProgressionRule>({
  exercise: '',
  increment: 5,
  deloadThreshold: 3,
  targetSessions: 2
})

const suggestionClass = computed(() => {
  if (!weightSuggestion.value) return ''
  
  switch (weightSuggestion.value.action) {
    case 'increase':
      return 'suggestion-increase'
    case 'maintain':
      return 'suggestion-maintain'
    case 'deload':
      return 'suggestion-deload'
    default:
      return ''
  }
})

const actionClass = computed(() => {
  if (!weightSuggestion.value) return ''
  
  switch (weightSuggestion.value.action) {
    case 'increase':
      return 'action-increase'
    case 'maintain':
      return 'action-maintain'
    case 'deload':
      return 'action-deload'
    default:
      return ''
  }
})

const getWeightSuggestion = async () => {
  if (!selectedUserId.value || !selectedExerciseId.value) return

  loading.value = true
  try {
    const request: SuggestWeightRequest = {
      user: selectedUserId.value,
      exercise: selectedExerciseId.value,
      lastWeight: suggestionForm.value.lastWeight,
      lastSets: suggestionForm.value.lastSets,
      lastReps: suggestionForm.value.lastReps
    }

    const result = await progressionEngineApi.suggestWeight(request)
    weightSuggestion.value = result.suggestion
  } catch (error) {
    console.error('Error getting weight suggestion:', error)
    alert('Failed to get weight suggestion. Please try again.')
  } finally {
    loading.value = false
  }
}

const applySuggestion = async () => {
  if (!weightSuggestion.value || !selectedUserId.value || !selectedExerciseId.value) return

  loading.value = true
  try {
    await progressionEngineApi.updateProgression(
      selectedUserId.value,
      selectedExerciseId.value,
      weightSuggestion.value.newWeight
    )
    
    weightSuggestion.value = null
    await loadUserProgressions()
    alert('Progression updated successfully!')
  } catch (error) {
    console.error('Error applying suggestion:', error)
    alert('Failed to apply suggestion. Please try again.')
  } finally {
    loading.value = false
  }
}

const createProgressionRule = async () => {
  loading.value = true
  try {
    await progressionEngineApi.createProgressionRule(newRule.value)
    
    // Reset form
    newRule.value = {
      exercise: '',
      increment: 5,
      deloadThreshold: 3,
      targetSessions: 2
    }
    showCreateRuleForm.value = false
    
    // Reload rules
    await loadProgressionRules()
    alert('Progression rule created successfully!')
  } catch (error) {
    console.error('Error creating progression rule:', error)
    alert('Failed to create progression rule. Please try again.')
  } finally {
    loading.value = false
  }
}

const loadProgressionRules = async () => {
  loading.value = true
  try {
    progressionRules.value = await progressionEngineApi.getAllProgressionRules()
    
    if (ruleExerciseFilter.value) {
      progressionRules.value = progressionRules.value.filter(
        rule => rule.exercise === ruleExerciseFilter.value
      )
    }
  } catch (error) {
    console.error('Error loading progression rules:', error)
    alert('Failed to load progression rules. Please try again.')
  } finally {
    loading.value = false
  }
}

const loadUserProgressions = async () => {
  if (!selectedUserId.value) return

  loading.value = true
  try {
    userProgressions.value = await progressionEngineApi.getAllUserProgressions()
    
    // Filter by user and exercise if specified
    userProgressions.value = userProgressions.value.filter(
      progression => progression.user === selectedUserId.value
    )
    
    if (progressionExerciseFilter.value) {
      userProgressions.value = userProgressions.value.filter(
        progression => progression.exercise === progressionExerciseFilter.value
      )
    }
  } catch (error) {
    console.error('Error loading user progressions:', error)
    alert('Failed to load user progressions. Please try again.')
  } finally {
    loading.value = false
  }
}

const updateProgression = async (progression: UserProgression) => {
  const newWeight = prompt(`Enter new weight for ${getExerciseName(progression.exercise)}:`, progression.currentWeight.toString())
  
  if (newWeight === null || isNaN(Number(newWeight))) return

  loading.value = true
  try {
    await progressionEngineApi.updateProgression(
      progression.user,
      progression.exercise,
      Number(newWeight)
    )
    
    await loadUserProgressions()
    alert('Progression updated successfully!')
  } catch (error) {
    console.error('Error updating progression:', error)
    alert('Failed to update progression. Please try again.')
  } finally {
    loading.value = false
  }
}

const getExerciseName = (exerciseId: string) => {
  const exercise = exercises.value.find(e => e.exerciseId === exerciseId)
  return exercise ? exercise.name : exerciseId
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
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
    suggestionForm.value.user = newUserId
    loadUserProgressions()
  } else {
    userProgressions.value = []
    weightSuggestion.value = null
  }
})

watch(selectedExerciseId, (newExerciseId) => {
  if (newExerciseId) {
    suggestionForm.value.exercise = newExerciseId
  }
})

onMounted(() => {
  loadUsers()
  loadExercises()
  loadProgressionRules()
})
</script>

<style scoped>
.progression-tracking {
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

.user-select, .exercise-select {
  padding: 0.75rem;
  border: 1px solid #d1e7f0;
  border-radius: 4px;
  font-size: 1rem;
  min-width: 200px;
  background: #fafcfd;
}

.weight-suggestion {
  background: linear-gradient(to bottom, #ffffff, #fafcfd);
  border: 1px solid #d1e7f0;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(74, 144, 164, 0.08);
}

.weight-suggestion h3 {
  margin-top: 0;
  color: #4a90a4;
}

.suggestion-form {
  margin-bottom: 2rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
  color: #5a9bb4;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1e7f0;
  border-radius: 4px;
  font-size: 1rem;
  background: #fafcfd;
}

.form-actions {
  margin-top: 1rem;
}

.suggestion-result {
  border-top: 1px solid #dee2e6;
  padding-top: 2rem;
}

.suggestion-card {
  padding: 1.5rem;
  border-radius: 8px;
  border: 2px solid;
}

.suggestion-increase {
  border-color: #28a745;
  background: #d4edda;
}

.suggestion-maintain {
  border-color: #ffc107;
  background: #fff3cd;
}

.suggestion-deload {
  border-color: #dc3545;
  background: #f8d7da;
}

.suggestion-card h4 {
  margin-top: 0;
  color: #64b5f6;
}

.suggestion-details {
  margin-bottom: 1.5rem;
}

.suggestion-weight,
.suggestion-action,
.suggestion-reason {
  margin-bottom: 0.75rem;
}

.suggestion-weight strong,
.suggestion-action strong,
.suggestion-reason strong {
  color: #90caf9;
}

.action-increase {
  color: #28a745;
  font-weight: bold;
}

.action-maintain {
  color: #ffc107;
  font-weight: bold;
}

.action-deload {
  color: #dc3545;
  font-weight: bold;
}

.suggestion-actions {
  display: flex;
  gap: 1rem;
}

.progression-rules {
  background: linear-gradient(to bottom, #ffffff, #fafcfd);
  border: 1px solid #d1e7f0;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(74, 144, 164, 0.08);
}

.progression-rules h3 {
  margin-top: 0;
  color: #4a90a4;
}

.rules-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.75rem;
  border: 1px solid #d1e7f0;
  border-radius: 4px;
  font-size: 1rem;
  min-width: 200px;
  background: #fafcfd;
}

.create-rule-form {
  background: #fafcfd;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 1px solid #d1e7f0;
}

.create-rule-form h4 {
  margin-top: 0;
  color: #90caf9;
}

.rules-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.rule-card {
  background: linear-gradient(to bottom, #fafcfd, #f0f7f9);
  border: 1px solid #d1e7f0;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.rule-card:hover {
  box-shadow: 0 4px 12px rgba(74, 144, 164, 0.12);
  transform: translateY(-2px);
}

.rule-card h4 {
  margin-top: 0;
  color: #4a90a4;
  font-size: 1.25rem;
}

.rule-stats {
  margin-top: 1rem;
}

.stat-item {
  margin-bottom: 0.5rem;
}

.stat-item strong {
  color: #5a9bb4;
}

.user-progressions {
  background: linear-gradient(to bottom, #ffffff, #fafcfd);
  border: 1px solid #d1e7f0;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(74, 144, 164, 0.08);
}

.user-progressions h3 {
  margin-top: 0;
  color: #4a90a4;
}

.progressions-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.progressions-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.progression-card {
  background: linear-gradient(to bottom, #fafcfd, #f0f7f9);
  border: 1px solid #d1e7f0;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.progression-card:hover {
  box-shadow: 0 4px 12px rgba(74, 144, 164, 0.12);
  transform: translateY(-2px);
}

.progression-details {
  flex: 1;
}

.progression-card h4 {
  margin-top: 0;
  color: #4a90a4;
  font-size: 1.25rem;
}

.progression-stats {
  margin-top: 1rem;
}

.progression-actions {
  margin-top: 1rem;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .header-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .rules-controls,
  .progressions-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .suggestion-actions {
    flex-direction: column;
  }
}
</style>
