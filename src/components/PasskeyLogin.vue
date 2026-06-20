<template>
  <div class="passkey-login">
    <h2>Sign in with Passkey</h2>
    <div class="row">
      <input v-if="showRegister" v-model="username" name="username" type="email" autocomplete="email" placeholder="Enter your email" autofocus/>
      <button v-if="showRegister" class="btn btn-primary" @click="register" :disabled="!username">Register New Passkey</button>
    </div>

    <div class="row" v-if="awaitingCode">
      <input
        v-model="code"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        autocomplete="one-time-code"
        placeholder="Enter verification code"
        @input="sanitizeCode"
        @keyup.enter="verifyCode"
      />
      <button class="btn btn-primary" @click="verifyCode" :disabled="!code">Verify</button>
      <button class="btn btn-secondary" @click="register">Resend</button>
    </div>

      <div class="notice" v-if="message">{{ message }}</div>
  </div>
</template>

<script>
import axios from 'axios'

function b64uToBuffer(b64u) {
  // convert base64url to base64 and pad to correct length for atob
  let b64 = b64u.replace(/-/g, '+').replace(/_/g, '/')
  const pad = (4 - (b64.length % 4)) % 4
  if (pad) b64 += '='.repeat(pad)
  const str = atob(b64)
  // Detect double-encoded challenge: browser may return base64 of an ASCII base64 string
  if (/^[A-Za-z0-9+\/=\-_]+$/.test(str)) {
    // normalize inner base64url -> base64 and pad
    let inner = str.replace(/-/g, '+').replace(/_/g, '/')
    const pad2 = (4 - (inner.length % 4)) % 4
    if (pad2) inner += '='.repeat(pad2)
    try {
      const innerDecoded = atob(inner)
      const buf2 = new Uint8Array(innerDecoded.length)
      for (let i = 0; i < innerDecoded.length; i++) buf2[i] = innerDecoded.charCodeAt(i)
      return buf2.buffer
    } catch (err) {
      // fall back to first-level decoding
    }
  }
  const buf = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i)
  return buf.buffer
}

function bufferToB64u(buffer) {
  const bytes = new Uint8Array(buffer)
  let str = ''
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i])
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export default {
  name: 'PasskeyLogin',
  data() {
    return { username: '', message: '', awaitingCode: false, code: '', showRegister: false }
  },
  mounted() {
    // attempt passive/passkey-only sign-in on page load without prompting the user
    // silent=true to avoid registration prompts if server reports no passkeys
    this.handleAction(false, true).catch(() => {
      // ignore background init errors
    })
  },
  methods: {
    async handleAction(requireEmail = false, silent = false) {
      this.message = ''
      this.showRegister = false
      if (requireEmail && !this.username) return
      try {
        // try login first
        const payload = requireEmail ? { email: this.username } : {}
        const { data } = await axios.post('/auth/passkey/login/options', payload, { withCredentials: true })
        await this._performGet(data.publicKey)
      } catch (e) {
        this.showRegister = true
        const status = e.response?.status
        const body = e.response?.data
        if (status === 404 && (typeof body === 'string' && body.toLowerCase().includes('no registered'))) {
          // prompt to register (unless we're running silently on page load)
          if (silent) return
          const ok = confirm('No passkey found for this email. Create one now?')
          if (ok) await this.register()
          else this.message = 'Registration cancelled'
        } else {
          this.message = 'Login failed: ' + (e.response?.data || e.message)
        }
      }
    },

    async _performGet(pub) {
      try {
        console.log('Passkey get options:', pub)
        pub.challenge = b64uToBuffer(pub.challenge)
        pub.allowCredentials = []
        pub.userVerification = 'preferred'

        // prefer conditional mediation when available to allow extensions to intercept
        let assertion

        // Use standard credential retrieval (with conditional mediation if supported)
        let opts = { publicKey: pub }
        if (window.PublicKeyCredential && PublicKeyCredential.getClientCapabilities) {
          const capabilities = await PublicKeyCredential.getClientCapabilities();
          if (capabilities.conditionalGet === true) {
            console.log('Using conditional mediation for credential retrieval');
            //opts.mediation = 'conditional';
          }
        }
        assertion = await navigator.credentials.get(opts)

        if (!assertion) {
          this.message = 'No credential selected or returned.'
          return
        }

        const rawId = bufferToB64u(assertion.rawId)
        const clientDataJSON = bufferToB64u(assertion.response.clientDataJSON)
        const authenticatorData = bufferToB64u(assertion.response.authenticatorData)
        const signature = bufferToB64u(assertion.response.signature)
        const userHandle = assertion.response.userHandle
          ? bufferToB64u(assertion.response.userHandle)
          : null

        await axios.post('/auth/passkey/login/verify', {
          email: this.username,
          rawId,
          clientDataJSON,
          authenticatorData,
          signature,
          userHandle
        }, { withCredentials: true })

        // Resolve canonical signed-in identity from the server session.
        const { data: me } = await axios.get('/auth/me', { withCredentials: true })
        const loggedInEmail = me?.email || this.username
        this.message = 'Login successful: ' + loggedInEmail
        this.$emit('login-success', loggedInEmail)
      } catch (e) {
        this.showRegister = true
        this.message = 'Login failed: ' + (e.response?.data || e.message)
      }
    },

    async register() {
      this.message = ''
      try {
        await axios.post('/auth/passkey/register/request_code', { email: this.username }, { withCredentials: true })
        this.message = 'A verification code has been sent to the provided email. Enter it above.'
        this.awaitingCode = true
      } catch (e) {
        this.message = 'Failed to request verification code: ' + (e.response?.data || e.message)
      }
    },

    async verifyCode() {
      this.message = ''
      try {
        await axios.post('/auth/passkey/register/verify_code', { email: this.username, code: this.code }, { withCredentials: true })
        // proceed to actual registration options/creation
        this.awaitingCode = false
        this.code = ''
        await this._performRegister()
      } catch (e) {
        this.message = 'Code verification failed: ' + (e.response?.data || e.message)
      }
    },

    sanitizeCode() {
      // Keep only digits while preserving the code as a string (leading zeros matter).
      this.code = String(this.code || '').replace(/\D/g, '')
    },

    async _performRegister() {
      try {
        const { data } = await axios.post('/auth/passkey/register/options', { email: this.username }, { withCredentials: true })
        const pub = data.publicKey
        // convert challenge and user.id to ArrayBuffer
        try {
          pub.challenge = b64uToBuffer(pub.challenge)
        } catch (err) {}
        try {
          if (pub.user && pub.user.id) pub.user.id = b64uToBuffer(pub.user.id)
        } catch (err) {}

        // try conditional mediation to allow credential extensions to intercept where supported
        console.log('Passkey create options:', pub)
        let cred
        let opts = { publicKey: pub }
        if (window.PublicKeyCredential && PublicKeyCredential.getClientCapabilities) {
          const capabilities = await PublicKeyCredential.getClientCapabilities();
          // Check if conditional mediation is available.
          if (capabilities.conditionalGet === true) {
            console.log('Using conditional mediation for credential creation');
//            opts.mediation = 'conditional';
          }
        }
        // Use standard credential creation (with conditional mediation)
        cred = await navigator.credentials.create(opts)

        if (!cred) {
          this.message = 'No credential created.'
          return
        }

        const attestationObject = bufferToB64u(cred.response.attestationObject)
        const clientDataJSON = bufferToB64u(cred.response.clientDataJSON)
        const rawId = bufferToB64u(cred.rawId)

        await axios.post('/auth/passkey/register/verify', {
          email: this.username,
          attestationObject,
          clientDataJSON,
          rawId
        }, { withCredentials: true })

        this.message = 'Registered passkey for ' + this.username
        // automatically attempt login after successful registration
        await this.handleAction(true)
      } catch (e) {
        this.message = 'Registration failed: ' + (e.response?.data || e.message)
      }
    },

    async login() {
      this.message = ''
      this.showRegister = false
      try {
        // check allowed server-side and get options
        const { data } = await axios.post('/auth/passkey/login/options', { email: this.username }, { withCredentials: true })
        const pub = data.publicKey
        pub.challenge = b64uToBuffer(pub.challenge)
        if (pub.allowCredentials) {
          pub.allowCredentials = pub.allowCredentials.map(c => ({ ...c, id: b64uToBuffer(c.id) }))
        }

        let opts = { publicKey: pub }
        if (window.PublicKeyCredential && PublicKeyCredential.getClientCapabilities) {
          const capabilities = await PublicKeyCredential.getClientCapabilities();
          // Check if conditional mediation is available.  
          if (capabilities.conditionalGet === true) {
            console.log('Using conditional mediation for credential retrieval');
            opts.mediation = 'conditional';
          }
        }
        const assertion = await navigator.credentials.get(opts)

        const rawId = bufferToB64u(assertion.rawId)
        const clientDataJSON = bufferToB64u(assertion.response.clientDataJSON)
        const authenticatorData = bufferToB64u(assertion.response.authenticatorData)
        const signature = bufferToB64u(assertion.response.signature)
        const userHandle = assertion.response.userHandle
          ? bufferToB64u(assertion.response.userHandle)
          : null

        await axios.post('/auth/passkey/login/verify', {
          email: this.username,
          rawId,
          clientDataJSON,
          authenticatorData,
          signature,
          userHandle
        }, { withCredentials: true })

        const { data: me } = await axios.get('/auth/me', { withCredentials: true })
        const loggedInEmail = me?.email || this.username
        this.message = 'Login successful: ' + loggedInEmail
        this.$emit('login-success', loggedInEmail)
      } catch (e) {
        this.showRegister = true
        this.message = 'Login failed: ' + (e.response?.data || e.message)
      }
    }
  }
}
</script>

<style scoped>
.passkey-login { max-width: 520px; margin: 0 auto; text-align: left }
.row { display:flex; gap:8px; margin-bottom:8px }
input { flex:1; padding:6px }
.btn {
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.btn:hover:not(:disabled) { opacity: 0.88; }
.btn-primary {
  background: #3b82f6;
  color: #fff;
}
.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}
.notice { margin:8px 0; color:#374151 }
ul { list-style:none; padding-left:0 }
li { display:flex; justify-content:space-between; gap:8px; padding:4px 0 }
</style>
