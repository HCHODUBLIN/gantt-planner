// AES-GCM encryption with PBKDF2 key derivation from PIN
const SALT = new Uint8Array([103,97,110,116,116,45,112,108,97,110,110,101,114,45,115,97]); // "gantt-planner-sa"
const ITERATIONS = 100000;

async function deriveKey(pin) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: SALT, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(data, pin) {
  const key = await deriveKey(pin);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(JSON.stringify(data))
  );
  // Combine iv + ciphertext, encode as base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(encryptedBase64, pin) {
  const key = await deriveKey(pin);
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
}

const PIN_KEY = 'gantt-pin-hash';
const UNLOCKED_KEY = 'gantt-unlocked';

export function isUnlocked() {
  return sessionStorage.getItem(UNLOCKED_KEY) === 'true';
}

export function setUnlocked(val) {
  if (val) {
    sessionStorage.setItem(UNLOCKED_KEY, 'true');
  } else {
    sessionStorage.removeItem(UNLOCKED_KEY);
  }
}

export function getSessionPin() {
  return sessionStorage.getItem('gantt-pin') || null;
}

export function setSessionPin(pin) {
  sessionStorage.setItem('gantt-pin', pin);
}

export function clearSession() {
  sessionStorage.removeItem(UNLOCKED_KEY);
  sessionStorage.removeItem('gantt-pin');
}
