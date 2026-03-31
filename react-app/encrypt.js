#!/usr/bin/env node
// Encrypt tasks.json with a PIN for GitHub Pages deployment
// Usage: node encrypt.js <pin>

import { readFileSync, writeFileSync } from 'fs';
import { webcrypto } from 'crypto';

const { subtle } = webcrypto;
const SALT = new Uint8Array([103,97,110,116,116,45,112,108,97,110,110,101,114,45,115,97]);
const ITERATIONS = 100000;

async function deriveKey(pin) {
  const enc = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    'raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']
  );
  return subtle.deriveKey(
    { name: 'PBKDF2', salt: SALT, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
}

async function encrypt(data, pin) {
  const key = await deriveKey(pin);
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(JSON.stringify(data))
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return Buffer.from(combined).toString('base64');
}

const pin = process.argv[2];
if (!pin || pin.length < 4) {
  console.error('Usage: node encrypt.js <pin>  (PIN must be 4+ characters)');
  process.exit(1);
}

const data = JSON.parse(readFileSync('public/tasks.json', 'utf-8'));
const encrypted = await encrypt(data, pin);
writeFileSync('public/tasks.encrypted.json', encrypted);
console.log('✅ Encrypted tasks.json → public/tasks.encrypted.json');
