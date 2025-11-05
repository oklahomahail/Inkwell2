# E2EE Architecture for Inkwell

**Branch:** `feat/e2ee-supabase-sync`  
**Status:** Foundation complete, UI and wiring pending

## Overview

Optional client-side, zero-knowledge encryption for Supabase-synced content. When enabled, all project data leaving the browser is encrypted with keys the server never sees.

## Architecture Decisions

### Baseline Security

- **Default:** Supabase's built-in encryption at rest + TLS in transit
- **Opt-in E2EE:** User explicitly enables encrypted cloud backups

### Crypto Primitives

**Primary (libsodium-wrappers-sumo):**

- **KDF:** Argon2id (memory-hard, ~300-500ms on target devices)
- **AEAD:** XChaCha20-Poly1305 (authenticated encryption)
- **Loading:** Lazy-loaded only when E2EE enabled (keeps base bundle small)

**Fallback (WebCrypto):**

- **KDF:** PBKDF2-SHA256 (210k iterations)
- **AEAD:** AES-256-GCM
- **Trigger:** If libsodium WASM fails to initialize (rare)

### Key Management

```
User Passphrase
    ↓ Argon2id (with salt, opslimit, memlimit)
Master Key (MK, 256-bit, never leaves device)
    ↓ wraps via XChaCha20-Poly1305
Data Encryption Key (DEK, 256-bit per project)
    ↓ encrypts all content
Ciphertext → Supabase
```

- **MK:** Derived from passphrase, never stored or transmitted
- **DEK:** Generated per project, wrapped with MK, stored in Supabase as `wrapped_dek`
- **KDF params:** Stored in Supabase as `kdf_params` (salt, opslimit, memlimit, version)

### Storage Model

**IndexedDB (local):** Source of truth, stores plaintext  
**Supabase (cloud):** Backup/sync, stores ciphertext when E2EE enabled

## Database Schema

### Projects Table

```sql
crypto_enabled    BOOLEAN NOT NULL DEFAULT FALSE
wrapped_dek       TEXT                           -- base64
kdf_params        JSONB                          -- { type, opslimit, memlimit, salt, v }
crypto_version    INT NOT NULL DEFAULT 1
```

### Chapters Table

```sql
content_ciphertext TEXT                          -- base64
content_nonce      TEXT                          -- base64 (24 bytes for XChaCha20)
crypto_version     INT NOT NULL DEFAULT 1
```

**Migration:** `supabase/migrations/20250204000000_e2ee_foundation.sql`

## Implementation Files

```
src/
  types/
    crypto.ts                    # KdfParams, RecoveryKit, WrappedKeyRecord, etc.
  services/
    cryptoService.ts             # Core crypto: derive, wrap, encrypt, decrypt
    syncService.ts               # Manual push/pull with E2EE gate
    localGateway.ts              # Interface for IndexedDB operations (stub)
```

## Usage Flow

### First-Time E2EE Enable

```typescript
import { SyncService } from '@/services/syncService';
import { localGateway } from '@/services/localGateway';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const sync = new SyncService(supabase, localGateway);

// Enable E2EE for a project
sync.setMode('hybrid'); // or 'cloud'
sync.setE2EE(true);
await sync.ensureKeys(projectId, passphrase);

// Get recovery kit (JSON download for user)
const kit = sync.getRecoveryKit();
// Offer kit as downloadable file

// Manual backup
await sync.pushNow(projectId);
```

### Restore on New Device

```typescript
// User logs in, provides passphrase
sync.setE2EE(true);
await sync.ensureKeys(projectId, passphrase); // unwraps DEK using stored kdf_params

// Pull encrypted data and decrypt
await sync.pullNow(projectId);
// IndexedDB now hydrated with plaintext
```

### Check Sync Status

```typescript
const ctx = sync.getContext();
console.log(ctx.status); // 'idle' | 'pending' | 'synced' | 'offline' | 'error'
console.log(ctx.lastError); // if status === 'error'
```

## Recovery Kit Format

**File:** `inkwell-recovery-${projectId}.json`

```json
{
  "inkwell_recovery_kit": 1,
  "project_id": "uuid",
  "wrapped_dek": "base64-encoded-wrapped-key",
  "kdf": {
    "type": "argon2id",
    "opslimit": 3,
    "memlimit": 67108864,
    "salt": "base64",
    "v": 1
  },
  "aead": "xchacha20poly1305_ietf",
  "created_at": "2025-02-04T13:55:00Z",
  "version": "1"
}
```

**User must:**

- Download and store securely (password manager, printed backup)
- Understand that losing passphrase = unrecoverable data

## Next Steps

### Immediate (Settings UI)

1. Storage Mode selector: Local | Hybrid | Cloud
2. "Enable encrypted cloud backups" toggle (only for Hybrid/Cloud)
3. Passphrase set/change flow with:
   - Strength meter
   - Confirmation field
   - "I understand the risk" checkbox
   - Recovery Kit download
4. Manual "Back up now" / "Restore" buttons

### Wire LocalGateway

Replace `localGateway.ts` stub with actual IndexedDB implementation:

- Map to your existing storage service
- `getProject()` → fetch project metadata
- `getChapters()` → fetch all chapters for project
- `replaceProjectFromCloud()` → hydrate IndexedDB with decrypted data

### Background Sync (later)

- Schedule `pushNow()` and `pullNow()` automatically
- Exponential backoff on errors
- Status indicator in footer: "Syncing…" / "Last synced 5m ago"

### Conflict Resolution (later)

- Current: last-writer-wins by `updated_at`
- Future: CRDT or three-way merge on decrypted local copies

### Team Sharing (later)

- Per-user wrapped DEK using asymmetric keys
- `project_wrapped_keys` table: `(project_id, user_id, wrapped_dek)`
- Wrap same DEK for each member with their public key

## Security Properties

✅ **Zero-knowledge:** Server never sees plaintext keys or content  
✅ **Authenticated encryption:** XChaCha20-Poly1305 provides integrity  
✅ **Memory-hard KDF:** Argon2id resists brute-force on passphrase  
✅ **Forward-compatible:** Schema versioning (`crypto_version`)  
✅ **RLS enforced:** Existing Supabase policies restrict row access

⚠️ **Tradeoffs:**

- No server-side search on encrypted fields
- Passphrase loss = unrecoverable data
- Client-side overhead for encrypt/decrypt (~ms per chapter)

## Testing Checklist

- [ ] Round-trip encryption/decryption (unit tests)
- [ ] Argon2id + XChaCha20-Poly1305 path
- [ ] PBKDF2 + AES-GCM fallback path
- [ ] Key wrapping/unwrapping
- [ ] Manual push to Supabase (encrypted rows written)
- [ ] Manual pull from Supabase (decrypt and hydrate)
- [ ] Cross-device enrollment (new device, same passphrase)
- [ ] Recovery kit export/import
- [ ] Offline → online sync retry
- [ ] Conflict merge (last-writer-wins)

## References

- [Supabase Encryption Docs](https://supabase.com/docs/guides/database/vault)
- [libsodium-wrappers](https://github.com/jedisct1/libsodium.js)
- [WebCrypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

---

**Last Updated:** 2025-02-04  
**Branch:** `feat/e2ee-supabase-sync`
