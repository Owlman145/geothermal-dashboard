// Simple client-side WebAuthn (passkey) helper for demo purposes.
// WARNING: This is a frontend-only demo that does NOT provide real server-side
// verification. For production, you must implement server-generated challenges
// and verify signatures on the server.

import defaultAllowed from '../config/allowedUsers.json'

function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer)
  let str = ''
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i])
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBuffer(b64u) {
  const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/') + '=='
  const str = atob(b64)
  const buf = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i)
  return buf.buffer
}

function randomChallenge() {
  const c = new Uint8Array(32)
  crypto.getRandomValues(c)
  return c.buffer
}

const STORAGE_KEY = 'demo_passkeys'
const ALLOWED_KEY = 'demo_allowed_emails'

function loadPasskeys() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch (e) {
    return {}
  }
}

function savePasskeys(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

function loadAllowed() {
  try {
    const ls = JSON.parse(localStorage.getItem(ALLOWED_KEY))
    if (Array.isArray(ls)) return ls
  } catch (e) {}
  return defaultAllowed || []
}

function saveAllowed(list) {
  localStorage.setItem(ALLOWED_KEY, JSON.stringify(list))
}

export default {
  isSupported() {
    return !!(window.PublicKeyCredential && navigator.credentials)
  },

  async register(email) {
    if (!this.isSupported()) throw new Error('WebAuthn not supported')
    const userId = new TextEncoder().encode(email)
    const publicKey = {
      challenge: randomChallenge(),
      rp: { name: 'Geothermal Dashboard' },
      user: { id: userId, name: email, displayName: email },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      timeout: 60000,
      attestation: 'none'
    }

    const cred = await navigator.credentials.create({ publicKey })
    const rawId = bufferToBase64Url(cred.rawId)
    const attestation = bufferToBase64Url(cred.response.attestationObject)
    const clientData = bufferToBase64Url(cred.response.clientDataJSON)

    const map = loadPasskeys()
    map[email] = { id: rawId, attestation, clientData, type: cred.type }
    savePasskeys(map)
    return { email, id: rawId }
  },

  async login(email) {
    if (!this.isSupported()) throw new Error('WebAuthn not supported')
    const map = loadPasskeys()
    const entry = map[email]
    if (!entry) throw new Error('No credential registered for this email')

    const allow = [{ type: 'public-key', id: base64UrlToBuffer(entry.id) }]
    const publicKey = { challenge: randomChallenge(), allowCredentials: allow, timeout: 60000 }
    const assertion = await navigator.credentials.get({ publicKey })
    // For demo, consider success if credential returned. Real apps must send
    // assertion.response to server for verification.
    return { email, id: bufferToBase64Url(assertion.rawId) }
  },

  listRegistered() {
    return Object.keys(loadPasskeys())
  },

  getCredentialId(email) {
    const map = loadPasskeys()
    return map[email] && map[email].id
  },

  getAllowed() {
    return loadAllowed()
  },

  isAllowed(email) {
    const list = loadAllowed()
    return list.includes(email)
  },

  addAllowed(email) {
    const list = loadAllowed()
    if (!list.includes(email)) {
      list.push(email)
      saveAllowed(list)
    }
    return list
  },

  removeAllowed(email) {
    let list = loadAllowed()
    list = list.filter(e => e !== email)
    saveAllowed(list)
    return list
  }
}
