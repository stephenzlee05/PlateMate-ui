<template>
  <div class="user-auth">
    <div v-if="!isAuthenticated" class="auth-prompt">
      <h2>Select User</h2>
      <p>Please select a user to continue using PlateMate</p>
      
      <div v-if="loading" class="loading">Loading users...</div>
      
      <div v-else-if="users.length === 0" class="no-users">
        <p>No users found. Please create a user first.</p>
        <button @click="showCreateForm = true" class="btn btn-primary">
          Create User
        </button>
      </div>
      
      <div v-else class="user-selection">
        <select v-model="selectedUserId" class="user-select" @change="handleUserSelect">
          <option value="">-- Select User --</option>
          <option v-for="user in users" :key="user.userId" :value="user.userId">
            {{ user.username }} ({{ user.email }})
          </option>
        </select>
        
        <button @click="showCreateForm = true" class="btn btn-secondary">
          Create New User
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
            <button type="button" @click="showCreateForm = false" class="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <div v-else class="auth-status">
      <div class="user-info">
        <span class="user-name">{{ currentUser?.username }}</span>
        <span class="user-email">{{ currentUser?.email }}</span>
      </div>
      <button @click="handleLogout" class="btn btn-secondary btn-sm">
        Switch User
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { currentUser, isAuthenticated, setUser, clearAuth } from '../services/auth'
import { userManagementApi } from '../services/api'
import { handleApiError } from '../utils/errorHandler'
import type { User, CreateUserRequest } from '../types/api'

const users = ref<User[]>([])
const loading = ref(false)
const showCreateForm = ref(false)
const selectedUserId = ref('')

const newUser = ref<CreateUserRequest>({
  username: '',
  email: ''
})

const handleUserSelect = async () => {
  if (!selectedUserId.value) return
  
  loading.value = true
  try {
    const result = await userManagementApi.getUser(selectedUserId.value)
    setUser(result.user)
    selectedUserId.value = ''
  } catch (error) {
    handleApiError(error, 'Failed to load user')
    selectedUserId.value = ''
  } finally {
    loading.value = false
  }
}

const createUser = async () => {
  loading.value = true
  try {
    const result = await userManagementApi.createUser(newUser.value)
    
    // Automatically authenticate as the new user
    const userResult = await userManagementApi.getUser(result.userId)
    setUser(userResult.user)
    
    // Reset form
    newUser.value = { username: '', email: '' }
    showCreateForm.value = false
    
    // Refresh users list
    await loadUsers()
  } catch (error) {
    handleApiError(error, 'Failed to create user')
  } finally {
    loading.value = false
  }
}

const handleLogout = () => {
  clearAuth()
  loadUsers()
}

const loadUsers = async () => {
  loading.value = true
  try {
    users.value = await userManagementApi.getAllUsers()
  } catch (error) {
    handleApiError(error, 'Failed to load users')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-auth {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.auth-prompt {
  text-align: center;
}

.auth-prompt h2 {
  color: #4a90a4;
  margin-bottom: 0.5rem;
}

.auth-prompt > p {
  color: #6c757d;
  margin-bottom: 2rem;
}

.loading {
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}

.no-users {
  padding: 2rem;
}

.user-selection {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.user-select {
  padding: 0.75rem;
  border: 1px solid #d1e7f0;
  border-radius: 4px;
  font-size: 1rem;
  min-width: 250px;
  background: #fafcfd;
}

.create-form {
  background: #fafcfd;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #d1e7f0;
  margin-top: 2rem;
  text-align: left;
}

.create-form h3 {
  margin-top: 0;
  color: #5a9bb4;
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

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #90caf9;
  border-radius: 4px;
  font-size: 1rem;
  background: #f0f8ff;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.auth-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(to right, #f0f8ff, #e1f5fe);
  border-radius: 8px;
  border: 1px solid #90caf9;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-name {
  font-weight: 600;
  color: #4a90a4;
}

.user-email {
  font-size: 0.875rem;
  color: #6c757d;
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
  background: #42a5f5;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1e88e5;
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
</style>

