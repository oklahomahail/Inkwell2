# End-to-End Encryption (E2EE) Technical Guide

## Architecture Overview

Inkwell's E2EE implementation follows industry best practices for client-side encryption with zero-knowledge architecture.

### Key Components

```
┌─────────────────────────────────────────────────────────────┐
│                         User Device                          │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────┐    ┌──────────────────┐                │
│  │   Passphrase   │───▶│ Argon2id KDF     │                │
│  └────────────────┘    └──────────────────┘                │
│                              │                               │
│                              ▼                               │
│                    ┌──────────────────┐                     │
│                    │ Master Key (MK)  │                     │
│                    └──────────────────┘                     │
│                              │                               │
│            ┌─────────────────┴─────────────────┐            │
│            ▼                                     ▼            │
│  ┌──────────────────┐                 ┌──────────────────┐  │
│  │ Wrap DEK with MK │                 │ Unwrap DEK       │  │
│  └──────────────────┘                 └──────────────────┘  │
│            │                                     │            │
│            ▼                                     ▼            │
│  ┌──────────────────┐                 ┌──────────────────┐  │
│  │ Store Wrapped    │                 │ Cache DEK in     │  │
│  │ DEK in IndexedDB │                 │ Memory           │  │
│  └──────────────────┘                 └──────────────────┘  │
│                                                 │            │
│                                                 ▼            │
│                                     ┌──────────────────┐    │
│                                     │ Encrypt/Decrypt  │    │
│                                     │ Chapter Data     │    │
│                                     └──────────────────┘    │
│                                                 │            │
└─────────────────────────────────────────────────┼────────────┘
                                                  │
                                                  ▼
                                     ┌──────────────────────┐
                                     │   Encrypted Data     │
                                     │  Sent to Supabase    │
                                     └──────────────────────┘
```

---

## Core Services

### 1. E2EE Key Manager (`e2eeKeyManager.ts`)

**Purpose:** Manages the lifecycle of encryption keys for each project.

**Key Methods:**

```typescript
// Initialize E2EE for a project
async initializeProject(config: E2EEConfig): Promise<RecoveryKit>

// Unlock project (re-derive MK, unwrap DEK, cache in memory)
async unlockProject(projectId: string, passphrase: string): Promise<void>

// Lock project (clear DEK from memory)
lockProject(projectId: string): void

// Get unwrapped DEK for encryption/decryption
getDEK(projectId: string): Uint8Array

// Change passphrase (re-wrap DEK with new MK)
async changePassphrase(projectId: string, oldPass: string, newPass: string): Promise<RecoveryKit>

// Import/Export Recovery Kit
async importRecoveryKit(kit: RecoveryKit, passphrase: string): Promise<void>
async exportRecoveryKit(projectId: string): Promise<RecoveryKit>
```

**Storage:**

- **IndexedDB Database:** `inkwell_e2ee_keys`
- **Object Store:** `wrapped_keys`
- **Key Path:** `projectId`

**Stored Data:**

```typescript
interface KeyMetadata {
  projectId: string;
  wrappedKey: WrappedKeyRecord;
  createdAt: string;
  lastUsed: string;
  version: number;
}
```

**In-Memory Cache:**

- `dekCache: Map<string, Uint8Array>` - Unwrapped DEKs for unlocked projects
- Cleared on `lockProject()` or `lockAll()`

---

### 2. Crypto Service (`cryptoService.ts`)

**Purpose:** Low-level cryptographic operations using libsodium.

**Key Functions:**

```typescript
// Generate random 256-bit DEK
async generateDEK(): Promise<Uint8Array>

// Derive MK from passphrase
async deriveMasterKey(opts: {
  passphrase: string;
  argon2Interactive?: boolean;
}): Promise<{ mk: Uint8Array; kdf: KdfParams }>

// Re-derive MK from stored KDF params
async rederiveMK(passphrase: string, kdf: KdfParams): Promise<Uint8Array>

// Wrap DEK with MK (encrypt DEK)
async wrapKey(dek: Uint8Array, mk: Uint8Array, kdf: KdfParams): Promise<WrappedKeyRecord>

// Unwrap DEK (decrypt DEK)
async unwrapKey(wrapped: WrappedKeyRecord, mk: Uint8Array): Promise<Uint8Array>

// Encrypt JSON data
async encryptJSON(obj: unknown, dek: Uint8Array): Promise<EncryptResult>

// Decrypt JSON data
async decryptJSON<T>(encrypted: DecryptInput, dek: Uint8Array): Promise<T>
```

**Crypto Primitives:**

| Operation      | Algorithm          | Key Size | Parameters                                                                     |
| -------------- | ------------------ | -------- | ------------------------------------------------------------------------------ |
| Key Derivation | Argon2id           | 256 bits | Interactive: opslimit=2, memlimit=64MB<br>Moderate: opslimit=3, memlimit=256MB |
| Encryption     | XChaCha20-Poly1305 | 256 bits | 192-bit nonce                                                                  |
| Key Wrapping   | XChaCha20-Poly1305 | 256 bits | AEAD authenticated encryption                                                  |

---

### 3. Supabase Sync Service (`supabaseSync.ts`)

**Purpose:** Transparent encryption/decryption during cloud sync.

**Modified Methods:**

```typescript
// Check if E2EE is enabled and unlocked
private async isE2EEReady(projectId: string): Promise<boolean>

// Encrypt chapter before upload
private async encryptChapterIfNeeded(
  chapter: Chapter,
  projectId: string,
): Promise<Chapter & { encrypted_content?: EncryptResult }>

// Decrypt chapter after download
private async decryptChapterIfNeeded(
  chapter: Chapter & { encrypted_content?: EncryptResult },
  projectId: string,
): Promise<Chapter>
```

**Push Flow:**

1. Check if project has E2EE enabled
2. If enabled and unlocked:
   - Get DEK from `e2eeKeyManager`
   - Encrypt `{ title, body }` using `encryptJSON()`
   - Set `title = '[Encrypted]'`, `body = ''`
   - Add `encrypted_content` field
3. Upload to Supabase

**Pull Flow:**

1. Fetch chapters from Supabase
2. For each chapter:
   - If `encrypted_content` exists:
     - Check if project is unlocked
     - If unlocked: decrypt using `decryptJSON()`
     - If locked: show `'[Locked - Please unlock project]'`
   - If no `encrypted_content`: return as-is (unencrypted)

---

## Database Schema

### Supabase `chapters` Table

```sql
CREATE TABLE chapters (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  encrypted_content JSONB,  -- New field for E2EE
  index_in_project INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

**Encrypted Content Structure:**

```json
{
  "ciphertext": "base64-encoded-encrypted-data",
  "nonce": "base64-encoded-192-bit-nonce",
  "ver": 1
}
```

### IndexedDB `inkwell_e2ee_keys` Store

```typescript
{
  projectId: "project-uuid",
  wrappedKey: {
    wrapped_dek: "base64-encrypted-dek",
    kdf_params: {
      type: "argon2id",
      opslimit: 2,
      memlimit: 67108864,
      salt: "base64-128-bit-salt",
      v: 1
    },
    crypto_version: 1
  },
  createdAt: "2025-01-15T10:30:00.000Z",
  lastUsed: "2025-01-15T10:30:00.000Z",
  version: 1
}
```

---

## Recovery Kit Format

```typescript
{
  inkwell_recovery_kit: 1,
  project_id: "project-uuid",
  wrapped_dek: "base64-encrypted-dek",
  kdf: {
    type: "argon2id",
    opslimit: 2,
    memlimit: 67108864,
    salt: "base64-128-bit-salt",
    v: 1
  },
  aead: "xchacha20poly1305_ietf",
  created_at: "2025-01-15T10:30:00.000Z",
  version: "1"
}
```

**File naming:** `inkwell-recovery-kit-{project-id}-{date}.json`

---

## Security Considerations

### Key Derivation (Argon2id)

**Why Argon2id?**

- Memory-hard: Resistant to GPU/ASIC attacks
- Side-channel resistant
- Winner of Password Hashing Competition (2015)

**Parameters:**

- **Interactive (development):** `opslimit=2, memlimit=64MB` (~200ms)
- **Moderate (production):** `opslimit=3, memlimit=256MB` (~1s)

**Trade-offs:**

- Higher parameters = More secure against brute force
- Lower parameters = Better UX (faster unlock)
- Current default: Interactive for quick unlock

### Encryption (XChaCha20-Poly1305)

**Why XChaCha20-Poly1305?**

- AEAD cipher: Authenticated encryption with associated data
- XChaCha20: Extended nonce (192-bit) reduces collision risk
- Poly1305: Fast authentication
- Constant-time implementation

**Properties:**

- **Nonce:** 192 bits (randomly generated per encryption)
- **Tag:** 128 bits (authentication tag)
- **Performance:** ~2-5 cycles/byte on modern CPUs

### Key Wrapping

DEK is wrapped using XChaCha20-Poly1305 with MK:

- MK derived from passphrase (never stored)
- Wrapped DEK stored in IndexedDB
- DEK cached in memory only when unlocked

### Threat Model

**Protected against:**

- ✅ Server compromise (encrypted data unreadable)
- ✅ Database breach (encrypted data unreadable)
- ✅ Man-in-the-middle attacks (encrypted before transmission)
- ✅ Passive network monitoring

**NOT protected against:**

- ❌ Device compromise (malware accessing memory)
- ❌ Keylogger capturing passphrase
- ❌ Browser extension with full access
- ❌ Physical access to unlocked device

---

## Implementation Checklist

### For New Features

When adding E2EE support to a new data type:

- [ ] Update `supabaseSync.ts` to encrypt/decrypt the data
- [ ] Add `encrypted_content` column to Supabase table
- [ ] Update sync methods to handle encrypted data
- [ ] Add decryption error handling
- [ ] Update UI to show locked state when needed
- [ ] Add tests for encryption/decryption
- [ ] Update documentation

### Testing E2EE

```typescript
// Example test pattern
describe('E2EE Feature', () => {
  beforeEach(async () => {
    await e2eeKeyManager._reset();
    // Initialize E2EE
    await e2eeKeyManager.initializeProject({
      projectId: 'test-project',
      passphrase: 'test-passphrase',
    });
  });

  it('should encrypt data', async () => {
    const dek = e2eeKeyManager.getDEK('test-project');
    const encrypted = await encryptJSON({ secret: 'data' }, dek);

    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.nonce).toBeDefined();

    const decrypted = await decryptJSON(encrypted, dek);
    expect(decrypted).toEqual({ secret: 'data' });
  });
});
```

---

## Performance Considerations

### Benchmarks (MacBook Pro M1)

| Operation                         | Time    | Notes               |
| --------------------------------- | ------- | ------------------- |
| `deriveMasterKey()` (interactive) | ~200ms  | Argon2id opslimit=2 |
| `deriveMasterKey()` (moderate)    | ~1000ms | Argon2id opslimit=3 |
| `generateDEK()`                   | <1ms    | Random bytes        |
| `encryptJSON()` (1KB)             | ~1ms    | XChaCha20-Poly1305  |
| `encryptJSON()` (100KB)           | ~10ms   | XChaCha20-Poly1305  |
| `encryptJSON()` (1MB)             | ~100ms  | XChaCha20-Poly1305  |

### Optimization Tips

1. **Cache DEK in memory** - Don't re-derive MK on every operation
2. **Use interactive KDF params** - Balance security vs UX
3. **Lazy initialization** - Only unlock when needed
4. **Batch encryption** - Encrypt multiple chapters in parallel
5. **Web Workers** - Offload crypto operations (future optimization)

---

## Migration Guide

### Enabling E2EE for Existing Projects

**User Flow:**

1. User enables E2EE in settings
2. New DEK generated and wrapped with MK
3. Next sync: encrypt all chapters before upload
4. Old unencrypted data remains in cloud (overwritten on next sync)

**Data Migration:**

```typescript
// Pseudo-code for migration
async function migrateProjectToE2EE(projectId: string) {
  // 1. Enable E2EE
  const kit = await e2eeKeyManager.initializeProject({ projectId, passphrase });

  // 2. Fetch all chapters
  const chapters = await chaptersService.list(projectId);

  // 3. Re-sync all chapters (will encrypt on next push)
  await supabaseSyncService.pushToCloud({ chapters });

  // 4. Return recovery kit for user to download
  return kit;
}
```

### Disabling E2EE

**Warning:** Encrypted data remains encrypted in the cloud.

**User Flow:**

1. User disables E2EE in settings
2. Wrapped key removed from IndexedDB
3. DEK cleared from memory
4. Encrypted chapters remain encrypted in cloud
5. To re-enable: Import recovery kit

---

## Debugging

### Enable Crypto Logging

```typescript
// In cryptoService.ts
const DEBUG = true;

if (DEBUG) {
  console.log('[crypto] Deriving master key...');
  console.log('[crypto] KDF params:', kdf);
}
```

### Common Issues

**"Incorrect passphrase"**

- Check: Passphrase typo
- Check: KDF params match
- Debug: Log salt and verify it's consistent

**"Project is locked"**

- Check: `e2eeKeyManager.isUnlocked(projectId)`
- Debug: `e2eeKeyManager.dekCache.has(projectId)`

**"Decryption failed"**

- Check: Nonce not reused
- Check: Ciphertext not corrupted
- Debug: Log encrypted data structure

---

## Security Auditing

### Checklist

- [ ] Passphrase never logged or transmitted
- [ ] DEK cleared from memory on lock
- [ ] Wrapped keys stored with proper access controls
- [ ] Nonces are unique (random generation)
- [ ] Crypto operations use constant-time implementations
- [ ] Error messages don't leak sensitive info
- [ ] Recovery Kit download uses secure naming
- [ ] IndexedDB access restricted to same-origin

### External Audit

For production deployment, consider:

- Professional cryptographic audit
- Penetration testing
- Bug bounty program
- Security disclosure policy

---

## Future Enhancements

### Planned Features

1. **Hardware Security Keys** - Support for YubiKey/U2F
2. **Biometric Unlock** - WebAuthn for passphrase-free unlock
3. **Key Rotation** - Automatic DEK rotation
4. **Multi-Device Sync** - Secure key exchange protocol
5. **File Encryption** - Encrypt uploaded images/attachments
6. **Metadata Encryption** - Encrypt project names, timestamps

### Performance Improvements

1. **Web Workers** - Offload crypto to separate thread
2. **WASM crypto** - Faster Argon2id implementation
3. **Streaming encryption** - Encrypt large chapters incrementally
4. **Lazy decryption** - Only decrypt visible chapters

---

## References

- **libsodium:** https://libsodium.gitbook.io/
- **Argon2id:** https://github.com/P-H-C/phc-winner-argon2
- **XChaCha20-Poly1305:** https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-xchacha
- **NIST Guidelines:** https://csrc.nist.gov/publications/detail/sp/800-175b/rev-1/final

---

**Last Updated:** 2025-11-08
**Crypto Version:** 1
**API Version:** 1.0.0
