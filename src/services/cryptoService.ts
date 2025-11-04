// src/services/cryptoService.ts
// Minimal, production-leaning crypto helpers with lazy-loaded libsodium.
// Default: Argon2id + XChaCha20-Poly1305 via libsodium-wrappers-sumo.
// Fallback: WebCrypto + PBKDF2 + AES-GCM if sodium cannot initialize.

import type {
  KdfParams,
  RecoveryKit,
  WrappedKeyRecord,
  EncryptResult,
  DecryptInput,
} from '@/types/crypto';

type Sodium = typeof import('libsodium-wrappers-sumo');

// Internal state
let sodiumPromise: Promise<Sodium> | null = null;
let sodiumReady = false;

// Lazy-load libsodium only on first use of E2EE
async function getSodium(): Promise<Sodium> {
  if (!sodiumPromise) {
    sodiumPromise = import('libsodium-wrappers-sumo').then(async (m) => {
      await m.ready;
      sodiumReady = true;
      return m;
    });
  }
  return sodiumPromise;
}

// Utils
export function b64encode(u8: Uint8Array): string {
  if (typeof window !== 'undefined' && 'btoa' in window) {
    let binary = '';
    for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i]!);
    return btoa(binary);
  }
  // Node polyfill path if needed
  return Buffer.from(u8).toString('base64');
}

export function b64decode(b64: string): Uint8Array {
  if (typeof window !== 'undefined' && 'atob' in window) {
    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i)!;
    return u8;
  }
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

export function isoNow(): string {
  return new Date().toISOString();
}

// Key material
export async function generateDEK(): Promise<Uint8Array> {
  if (!sodiumReady) await getSodium();
  const sodium = await getSodium();
  return sodium.randombytes_buf(32);
}

export type DeriveOptions = {
  passphrase: string;
  forcePbkdf2Fallback?: boolean; // for testing
  argon2Interactive?: boolean; // if true, use libsodium interactive params
};

export async function deriveMasterKey(
  opts: DeriveOptions,
): Promise<{ mk: Uint8Array; kdf: KdfParams }> {
  const { passphrase, forcePbkdf2Fallback, argon2Interactive } = opts;

  try {
    if (!forcePbkdf2Fallback) {
      const sodium = await getSodium();

      const salt = sodium.randombytes_buf(16);
      const saltB64 = b64encode(salt);

      // Choose params. Tune memlimit to your perf budget.
      const ops = argon2Interactive
        ? sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE
        : sodium.crypto_pwhash_OPSLIMIT_MODERATE;
      const mem = argon2Interactive
        ? sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE
        : Math.max(sodium.crypto_pwhash_MEMLIMIT_MODERATE, 64 * 1024 * 1024);

      const mk = sodium.crypto_pwhash(
        32,
        passphrase,
        salt,
        ops,
        mem,
        sodium.crypto_pwhash_ALG_ARGON2ID13,
      );

      const kdf: KdfParams = {
        type: 'argon2id',
        opslimit: ops,
        memlimit: mem,
        salt: saltB64,
        v: 1,
      };

      return { mk, kdf };
    }
  } catch {
    // continue to PBKDF2
  }

  // PBKDF2 fallback using WebCrypto
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const iterations = 210_000; // tune to ~300ms on target devices
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  const mk = new Uint8Array(derivedBits);
  const kdf: KdfParams = {
    type: 'pbkdf2',
    iterations,
    salt: b64encode(salt),
    v: 1,
  };
  return { mk, kdf };
}

// Wrap and unwrap DEK with MK
export async function wrapKey(
  dek: Uint8Array,
  mk: Uint8Array,
  kdf: KdfParams,
): Promise<WrappedKeyRecord> {
  // Prefer libsodium aead to wrap small key material
  if (sodiumReady) {
    const sodium = await getSodium();
    const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    const ct = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(dek, null, null, nonce, mk);
    const wrapped = b64encode(new Uint8Array([...nonce, ...ct]));
    return {
      wrapped_dek: wrapped,
      kdf_params: kdf,
      crypto_version: 1,
    };
  }

  // Fallback to AES-GCM with MK as raw key
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey('raw', mk as BufferSource, 'AES-GCM', false, [
    'encrypt',
  ]);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce as BufferSource },
      key,
      dek as BufferSource,
    ),
  );
  const wrapped = b64encode(new Uint8Array([...nonce, ...ct]));
  return {
    wrapped_dek: wrapped,
    kdf_params: kdf,
    crypto_version: 1,
  };
}

export async function unwrapKey(record: WrappedKeyRecord, mk: Uint8Array): Promise<Uint8Array> {
  const data = b64decode(record.wrapped_dek);

  // Sodium path
  if (sodiumReady) {
    const sodium = await getSodium();
    const npub = data.slice(0, sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    const ct = data.slice(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    const dek = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(null, ct, null, npub, mk);
    return dek;
  }

  // AES-GCM fallback
  const nonce = data.slice(0, 12);
  const ct = data.slice(12);
  const key = await crypto.subtle.importKey('raw', mk as BufferSource, 'AES-GCM', false, [
    'decrypt',
  ]);
  const dek = new Uint8Array(
    await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce as BufferSource },
      key,
      ct as BufferSource,
    ),
  );
  return dek;
}

// Data encryption and decryption
export async function encryptBytes(plaintext: Uint8Array, dek: Uint8Array): Promise<EncryptResult> {
  if (!sodiumReady) await getSodium();
  const sodium = await getSodium();

  const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  const ct = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(plaintext, null, null, nonce, dek);

  return {
    ciphertext: b64encode(new Uint8Array(ct)),
    nonce: b64encode(new Uint8Array(nonce)),
    ver: 1,
  };
}

export async function decryptBytes(input: DecryptInput, dek: Uint8Array): Promise<Uint8Array> {
  const sodium = await getSodium();
  const nonce = b64decode(input.nonce);
  const ct = b64decode(input.ciphertext);

  const pt = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(null, ct, null, nonce, dek);
  return new Uint8Array(pt);
}

// JSON helpers
export async function encryptJSON(obj: unknown, dek: Uint8Array): Promise<EncryptResult> {
  const data = new TextEncoder().encode(JSON.stringify(obj));
  return encryptBytes(data, dek);
}

export async function decryptJSON<T = unknown>(input: DecryptInput, dek: Uint8Array): Promise<T> {
  const u8 = await decryptBytes(input, dek);
  return JSON.parse(new TextDecoder().decode(u8)) as T;
}

// Recovery Kit
export function buildRecoveryKit(projectId: string, wrapped: WrappedKeyRecord): RecoveryKit {
  return {
    inkwell_recovery_kit: 1,
    project_id: projectId,
    wrapped_dek: wrapped.wrapped_dek,
    kdf: wrapped.kdf_params,
    aead: sodiumReady ? 'xchacha20poly1305_ietf' : 'aes-256-gcm',
    created_at: isoNow(),
    version: '1',
  };
}

// Deterministic re-derive MK from stored kdf params + passphrase
export async function rederiveMK(passphrase: string, kdf: KdfParams): Promise<Uint8Array> {
  if (kdf.type === 'argon2id') {
    const sodium = await getSodium();
    const salt = b64decode(kdf.salt);
    const mk = sodium.crypto_pwhash(
      32,
      passphrase,
      salt,
      kdf.opslimit ?? sodium.crypto_pwhash_OPSLIMIT_MODERATE,
      kdf.memlimit ?? Math.max(sodium.crypto_pwhash_MEMLIMIT_MODERATE, 64 * 1024 * 1024),
      sodium.crypto_pwhash_ALG_ARGON2ID13,
    );
    return mk;
  }

  // PBKDF2 path
  const salt = b64decode(kdf.salt);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: kdf.iterations ?? 210_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  );
  return new Uint8Array(bits);
}
