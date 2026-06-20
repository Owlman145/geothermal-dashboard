<template>
  <div class="admin-panel">
    <div class="header">
      <h3>Admin Panel</h3>
      <button @click="$emit('close')">Close</button>
    </div>

    <div class="content">
      <h4>Admins</h4>
      <div class="add">
        <input v-model="newAdmin" placeholder="admin@example.com" />
        <button @click="addAdmin">Add</button>
      </div>
      <ul>
        <li v-for="e in admins" :key="e">
          <span class="email">{{ e }}</span>
          <button class="remove" @click="removeAdmin(e)">Remove</button>
        </li>
      </ul>

      <h4>Allowed Users</h4>
      <div class="add">
        <input v-model="newEmail" placeholder="user@example.com" />
        <button @click="add">Add</button>
      </div>
      <ul>
        <li v-for="user in emails" :key="user.email">
          <span class="email-wrap">
            <span class="email">{{ user.email }}</span>
            <span
              v-if="user.has_account"
              class="account-indicator"
              title="Account created"
              aria-label="Account created"
            ></span>
          </span>
          <button class="remove" @click="remove(user.email)">Remove</button>
        </li>
      </ul>

      <div v-if="message" class="message">{{ message }}</div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'AdminPanel',
  data() {
    return { admins: [], emails: [], newAdmin: '', newEmail: '', message: '' }
  },
  async mounted() {
    await Promise.all([this.fetchAdmins(), this.fetch()])
  },
  methods: {
    normalizeAllowedUsers(data) {
      if (!Array.isArray(data)) return []
      return data
        .map((entry) => {
          if (typeof entry === 'string') {
            return { email: entry, has_account: false }
          }
          return {
            email: entry?.email || '',
            has_account: Boolean(entry?.has_account)
          }
        })
        .filter((entry) => Boolean(entry.email))
    },
    async fetchAdmins() {
      try {
        const { data } = await axios.get('/auth/admins', { withCredentials: true })
        this.admins = data || []
      } catch (e) {
        this.message = 'Failed to load admin list: ' + (e.response?.data || e.message)
      }
    },
    async addAdmin() {
      if (!this.newAdmin) return
      try {
        await axios.post('/auth/admins', { email: this.newAdmin }, { withCredentials: true })
        this.newAdmin = ''
        await this.fetchAdmins()
      } catch (e) {
        this.message = 'Failed to add admin: ' + (e.response?.data || e.message)
      }
    },
    async removeAdmin(email) {
      try {
        await axios.delete('/auth/admins', { data: { email }, withCredentials: true })
        await this.fetchAdmins()
      } catch (e) {
        this.message = 'Failed to remove admin: ' + (e.response?.data || e.message)
      }
    },
    async fetch() {
      try {
        const { data } = await axios.get('/auth/allowed', { withCredentials: true })
        this.emails = this.normalizeAllowedUsers(data)
        this.message = ''
      } catch (e) {
        this.message = 'Failed to load allowed list: ' + (e.response?.data || e.message)
      }
    },
    async add() {
      if (!this.newEmail) return
      try {
        await axios.post('/auth/allowed', { email: this.newEmail }, { withCredentials: true })
        this.newEmail = ''
        await this.fetch()
      } catch (e) {
        this.message = 'Failed to add email: ' + (e.response?.data || e.message)
      }
    },
    async remove(email) {
      try {
        await axios.delete('/auth/allowed', { data: { email }, withCredentials: true })
        await this.fetch()
      } catch (e) {
        this.message = 'Failed to remove email: ' + (e.response?.data || e.message)
      }
    }
  }
}
</script>

<style scoped>
.admin-panel { position: fixed; right: 0; top: 0; width: 340px; height: 100%; background: #fff; box-shadow: -2px 0 8px rgba(0,0,0,0.12); padding: 12px; z-index: 1000; overflow: auto }
.header { display:flex; justify-content:space-between; align-items:center }
h4 { margin: 16px 0 8px }
.add { display:flex; gap:8px; margin-bottom: 8px }
input { flex:1; padding:6px }
.email-wrap { display:flex; align-items:center; gap:8px }
.email { word-break: break-all }
.account-indicator { width:8px; height:8px; border-radius:50%; background:#2f9e44; display:inline-block }
ul { list-style:none; padding:0; margin:0 }
li { display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid #eee }
.remove { background:#f8d7da; border:1px solid #f5c6cb; padding:4px 8px }
.message { color:#b33; margin-top:8px }
</style>
