<template>
  <div class="user-management">
    <div class="header">
      <h2>User Management</h2>
      <button @click="showCreateForm = !showCreateForm" class="btn btn-primary">
        {{ showCreateForm ? 'Cancel' : 'Create User' }}
      </button>
    </div>

    <!-- Create User Form -->
    <div v-if="showCreateForm" class="create-form">
      <h3>Create New User</h3>
      <form @submit.prevent="createUser">
        <div class="form-group">
          <label for="username">Username:</label>
          <input 
            id="username" 
            v-model="newUser.username" 
            type="text" 
            required 
            placeholder="Enter username"
          />
        </div>

        <div class="form-group">
          <label for="email">Email:</label>
          <input 
            id="email" 
            v-model="newUser.email" 
            type="email" 
            required 
            placeholder="Enter email address"
          />
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Creating...' : 'Create User' }}
          </button>
        </div>
      </form>
    </div>

    <!-- User Search -->
    <div class="search-section">
      <div class="search-controls">
        <input 
          v-model="userIdSearch" 
          type="text" 
          placeholder="Enter User ID to view details..." 
          class="search-input"
        />
        <button @click="loadUser" class="btn btn-secondary">Load User</button>
      </div>
    </div>

    <!-- User Details -->
    <div v-if="selectedUser" class="user-details">
      <h3>User Details</h3>
      <div class="user-info">
        <div class="info-item">
          <strong>User ID:</strong> {{ selectedUser.userId }}
        </div>
        <div class="info-item">
          <strong>Username:</strong> {{ selectedUser.username }}
        </div>
        <div class="info-item">
          <strong>Email:</strong> {{ selectedUser.email }}
        </div>
      </div>

      <!-- User Preferences -->
      <div class="preferences-section">
        <h4>Preferences</h4>
        <div v-if="userPreferences" class="preferences-form">
          <div class="form-group">
            <label for="defaultIncrement">Default Increment:</label>
            <input 
              id="defaultIncrement" 
              v-model.number="preferencesForm.defaultIncrement" 
              type="number" 
              step="0.5"
              min="0"
            />
          </div>

          <div class="form-group">
            <label for="units">Units:</label>
            <select id="units" v-model="preferencesForm.units">
              <option value="lbs">Pounds (lbs)</option>
              <option value="kg">Kilograms (kg)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input 
                v-model="preferencesForm.notifications" 
                type="checkbox"
              />
              Enable Notifications
            </label>
          </div>

          <div class="form-actions">
            <button @click="updatePreferences" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Updating...' : 'Update Preferences' }}
            </button>
          </div>
        </div>
        <div v-else class="no-preferences">
          <p>No preferences found for this user.</p>
          <button @click="createDefaultPreferences" class="btn btn-secondary" :disabled="loading">
            {{ loading ? 'Creating...' : 'Create Default Preferences' }}
          </button>
        </div>
      </div>
    </div>

    <!-- All Users List -->
    <div class="users-list">
      <h3>All Users</h3>
      <div v-if="loading" class="loading">Loading users...</div>
      <div v-else-if="allUsers.length === 0" class="no-results">
        No users found.
      </div>
      <div v-else class="users-grid">
        <div v-for="user in allUsers" :key="user.userId" class="user-card">
          <h4>{{ user.username }}</h4>
          <div class="user-info">
            <div class="info-item">
              <strong>ID:</strong> {{ user.userId }}
            </div>
            <div class="info-item">
              <strong>Email:</strong> {{ user.email }}
            </div>
          </div>
          <button @click="selectUser(user.userId)" class="btn btn-sm btn-secondary">
            View Details
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userManagementApi } from '../services/api'
import type { User, UserPreferences, CreateUserRequest } from '../types/api'

const allUsers = ref<any[]>([])
const selectedUser = ref<User | null>(null)
const userPreferences = ref<UserPreferences | null>(null)
const loading = ref(false)
const showCreateForm = ref(false)
const userIdSearch = ref('')

const newUser = ref<CreateUserRequest>({
  username: '',
  email: ''
})

const preferencesForm = ref<UserPreferences>({
  defaultIncrement: 5,
  units: 'lbs',
  notifications: true
})

const createUser = async () => {
  loading.value = true
  try {
    await userManagementApi.createUser(newUser.value)
    
    // Reset form
    newUser.value = { username: '', email: '' }
    showCreateForm.value = false
    
    // Refresh users list
    await loadAllUsers()
    alert('User created successfully!')
  } catch (error) {
    console.error('Error creating user:', error)
    alert('Failed to create user. Please try again.')
  } finally {
    loading.value = false
  }
}

const loadUser = async () => {
  if (!userIdSearch.value.trim()) {
    alert('Please enter a User ID')
    return
  }

  loading.value = true
  try {
    const result = await userManagementApi.getUser(userIdSearch.value)
    selectedUser.value = result.user
    
    // Load user preferences
    await loadUserPreferences(userIdSearch.value)
  } catch (error) {
    console.error('Error loading user:', error)
    alert('Failed to load user. Please check the User ID.')
  } finally {
    loading.value = false
  }
}

const selectUser = async (userId: string) => {
  userIdSearch.value = userId
  await loadUser()
}

const loadUserPreferences = async (userId: string) => {
  try {
    const preferencesIdResult = await userManagementApi.getPreferencesByUser(userId)
    const preferences = await userManagementApi.getPreferences(preferencesIdResult.preferencesId)
    userPreferences.value = preferences
    
    // Update form with current preferences
    preferencesForm.value = { ...preferences }
  } catch (error) {
    console.error('Error loading preferences:', error)
    userPreferences.value = null
  }
}

const updatePreferences = async () => {
  if (!selectedUser.value) return

  loading.value = true
  try {
    await userManagementApi.updatePreferences({
      userId: selectedUser.value.userId,
      preferences: preferencesForm.value
    })
    
    // Reload preferences to confirm update
    await loadUserPreferences(selectedUser.value.userId)
    alert('Preferences updated successfully!')
  } catch (error) {
    console.error('Error updating preferences:', error)
    alert('Failed to update preferences. Please try again.')
  } finally {
    loading.value = false
  }
}

const createDefaultPreferences = async () => {
  if (!selectedUser.value) return

  loading.value = true
  try {
    await userManagementApi.createDefaultPreferences(selectedUser.value.userId)
    await loadUserPreferences(selectedUser.value.userId)
    alert('Default preferences created successfully!')
  } catch (error) {
    console.error('Error creating preferences:', error)
    alert('Failed to create preferences. Please try again.')
  } finally {
    loading.value = false
  }
}

const loadAllUsers = async () => {
  loading.value = true
  try {
    allUsers.value = await userManagementApi.getAllUsers()
  } catch (error) {
    console.error('Error loading users:', error)
    alert('Failed to load users. Please check your connection.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAllUsers()
})
</script>

<style scoped>
.user-management {
  padding: 1rem;
  color: #495057;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h2 {
  color: #2c3e50;
  margin: 0;
}

.create-form {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 1px solid #dee2e6;
}

.create-form h3 {
  margin-top: 0;
  color: #495057;
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
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
}

.form-actions {
  margin-top: 1.5rem;
}

.search-section {
  margin-bottom: 2rem;
}

.search-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.user-details {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.user-details h3 {
  margin-top: 0;
  color: #2c3e50;
}

.user-info {
  margin-bottom: 2rem;
}

.info-item {
  margin-bottom: 0.75rem;
  color: #495057;
}

.info-item strong {
  color: #495057;
}

.preferences-section {
  border-top: 1px solid #dee2e6;
  padding-top: 2rem;
}

.preferences-section h4 {
  color: #495057;
  margin-bottom: 1rem;
}

.preferences-form {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 6px;
}

.no-preferences {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.users-list h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.user-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: box-shadow 0.2s ease;
}

.user-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.user-card h4 {
  margin-top: 0;
  color: #2c3e50;
  font-size: 1.25rem;
}

.user-card .user-info {
  margin: 1rem 0;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading, .no-results {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}
</style>
