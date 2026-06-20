<template>
  <div id="app">
    <div class="user-bar" v-if="authChecked && userEmail">
      <span class="signed-in">Signed in as <strong>{{ userEmail }}</strong></span>
      <button v-if="isAdmin" class="btn btn-admin" @click="showAdmin = !showAdmin">
        {{ showAdmin ? 'Close Admin' : 'Admin' }}
      </button>
      <button class="btn btn-logout" @click="logout">Logout</button>
    </div>

    <div v-if="!authChecked" class="auth-loading">Checking sign-in status...</div>
    <PasskeyLogin v-else-if="!userEmail" @login-success="onLogin" />
    <ChartWrapper v-else/>

    <AdminPanel v-if="authChecked && isAdmin && showAdmin" @close="showAdmin = false" />
  </div>
</template>

<script>
import axios from 'axios'
import ChartWrapper from './components/ChartWrapper.vue'
import PasskeyLogin from './components/PasskeyLogin.vue'
import AdminPanel from './components/AdminPanel.vue'

export default {
  name: 'Geothermal-Dashboard',
  components: {
    ChartWrapper,
    PasskeyLogin
    , AdminPanel
  },
  data() {
    return { userEmail: null, showAdmin: false, isAdmin: false, authChecked: false }
  },
  methods: {
    async onLogin(email) {
      this.userEmail = email
      sessionStorage.setItem('geothermal_user', email)
      try {
        const { data } = await axios.get('/auth/me', { withCredentials: true })
        this.isAdmin = !!data.is_admin
      } catch (e) {
        this.isAdmin = false
      }
    },
    async logout() {
      try {
        await axios.post('/auth/logout', {}, { withCredentials: true })
      } catch (e) {
        // still clear client-side state even if server call fails
      }
      this.userEmail = null
      this.isAdmin = false
      this.showAdmin = false
      sessionStorage.removeItem('geothermal_user')
    }
  },
  async mounted() {
    try {
      const { data } = await axios.get('/auth/me', { withCredentials: true })
      if (data.email) {
        this.userEmail = data.email
        this.isAdmin = !!data.is_admin
        sessionStorage.setItem('geothermal_user', data.email)
      }
    } catch (e) {
      // not authenticated; leave defaults
    } finally {
      this.authChecked = true
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 0px;
}

.user-bar {
  position: fixed;
  top: 12px;
  right: 16px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  max-width: calc(100vw - 24px);
  z-index: 900;
}

.signed-in {
  font-size: 14px;
  color: #555;
  max-width: 100%;
}

.btn {
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn:hover { opacity: 0.85; }

.btn-admin {
  background: #3b82f6;
  color: #fff;
}

.btn-logout {
  background: #e5e7eb;
  color: #374151;
}

.auth-loading {
  padding: 24px;
  color: #6b7280;
  font-weight: 600;
}

@media (max-width: 1280px) {
  .user-bar {
    position: static;
    margin: 8px 12px;
    max-width: none;
    justify-content: center;
  }

  .signed-in {
    flex-basis: 100%;
    text-align: center;
    word-break: break-word;
  }

  .btn {
    padding: 8px 14px;
  }
}
</style>
