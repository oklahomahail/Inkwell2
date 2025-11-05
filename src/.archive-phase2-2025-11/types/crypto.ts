// src/types/crypto.ts
// Type definitions for E2EE crypto primitives

export type KdfParams = {
  type: 'argon2id' | 'pbkdf2';
  opslimit?: number; // libsodium pwhash opslimit (interactive or tuned)
  memlimit?: number; // libsodium pwhash memlimit bytes
  iterations?: number; // PBKDF2 iterations when falling back
  salt: string; // base64
  v: number; // version
};

export type RecoveryKit = {
  inkwell_recovery_kit: 1;
  project_id: string;
  wrapped_dek: string; // base64
  kdf: KdfParams;
  aead: 'xchacha20poly1305_ietf' | 'aes-256-gcm';
  created_at: string; // ISO8601
  version: string; // overall crypto schema version
};

export type WrappedKeyRecord = {
  wrapped_dek: string; // base64
  kdf_params: KdfParams; // stored in Supabase JSONB as well
  crypto_version: number; // bump if header format changes
};

export type EncryptResult = {
  ciphertext: string; // base64
  nonce: string; // base64
  ver: number; // crypto schema version
};

export type DecryptInput = {
  ciphertext: string; // base64
  nonce: string; // base64
  ver: number;
};

export type StorageMode = 'local' | 'hybrid' | 'cloud';

export type SyncState = 'idle' | 'pending' | 'synced' | 'offline' | 'error';

export type SyncContext = {
  mode: StorageMode;
  e2eeEnabled: boolean;
  status: SyncState;
  lastError?: string;
};
