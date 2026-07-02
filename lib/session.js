// Manejo de sesión admin mediante HMAC-SHA256 (Web Crypto API).
// Funciona tanto en Edge Runtime (middleware) como en Node.js (API routes).
// NO usar en componentes de cliente — solo en servidor y middleware.

const EXPIRY_MS = 8 * 60 * 60 * 1000 // 8 horas

function enc(str) {
  return new TextEncoder().encode(str)
}

function toB64url(buf) {
  const bytes = new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer ?? buf)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromB64url(str) {
  const pad = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (str.length % 4)) % 4)
  const binary = atob(pad)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

async function getKey() {
  const secret = process.env.ADMIN_SESSION_SECRET || 'dev-secret-change-in-production'
  return globalThis.crypto.subtle.importKey(
    'raw',
    enc(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function createSession(user) {
  const payload = toB64url(enc(JSON.stringify({ user, exp: Date.now() + EXPIRY_MS })))
  const key = await getKey()
  const sigBuf = await globalThis.crypto.subtle.sign('HMAC', key, enc(payload))
  const sig = toB64url(sigBuf)
  return `${payload}.${sig}`
}

export async function verifySession(token) {
  try {
    const dotIdx = token.lastIndexOf('.')
    if (dotIdx < 1) return false
    const payload = token.slice(0, dotIdx)
    const sig = fromB64url(token.slice(dotIdx + 1))
    const key = await getKey()
    const ok = await globalThis.crypto.subtle.verify('HMAC', key, sig, enc(payload))
    if (!ok) return false
    const { exp } = JSON.parse(new TextDecoder().decode(fromB64url(payload)))
    return Date.now() <= exp
  } catch {
    return false
  }
}
