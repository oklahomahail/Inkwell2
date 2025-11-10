// src/services/__tests__/cryptoService.edgecases.test.ts
/**
 * Edge Case and Coverage Tests for cryptoService
 *
 * Focuses on:
 * - Node.js vs Browser environments (Buffer vs btoa/atob)
 * - Fallback paths (PBKDF2 when Argon2 unavailable)
 * - Sodium vs WebCrypto code paths
 * - Error handling and bad inputs
 * - Property-based scenarios for key derivation
 *
 * Target: 64% → 80% coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  b64encode,
  b64decode,
  isoNow,
  deriveMasterKey,
  generateDEK,
  wrapKey,
  unwrapKey,
  encryptBytes,
  decryptBytes,
  encryptJSON,
  decryptJSON,
  rederiveMK,
  buildRecoveryKit,
  type DeriveOptions,
} from '../cryptoService';

describe('cryptoService - Edge Cases', () => {
  describe('Base64 Encoding/Decoding', () => {
    it('should encode Uint8Array to base64 using btoa in browser', () => {
      const input = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const result = b64encode(input);
      expect(result).toBe('SGVsbG8=');
    });

    it('should decode base64 to Uint8Array using atob in browser', () => {
      const result = b64decode('SGVsbG8=');
      expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
    });

    it('should handle empty Uint8Array', () => {
      const input = new Uint8Array([]);
      const encoded = b64encode(input);
      const decoded = b64decode(encoded);
      expect(decoded).toEqual(input);
    });

    it('should handle large Uint8Arrays', () => {
      const input = new Uint8Array(1024).fill(42);
      const encoded = b64encode(input);
      const decoded = b64decode(encoded);
      expect(decoded).toEqual(input);
    });

    it('should handle all byte values (0-255)', () => {
      const input = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        input[i] = i;
      }
      const encoded = b64encode(input);
      const decoded = b64decode(encoded);
      expect(decoded).toEqual(input);
    });
  });

  describe('isoNow()', () => {
    it('should return ISO 8601 timestamp', () => {
      const timestamp = isoNow();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return different timestamps when called sequentially', async () => {
      const ts1 = isoNow();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const ts2 = isoNow();
      expect(ts1).not.toBe(ts2);
    });
  });

  describe('generateDEK()', () => {
    it('should generate cryptographically random keys', async () => {
      const dek1 = await generateDEK();
      const dek2 = await generateDEK();
      const dek3 = await generateDEK();

      // All should be 32 bytes
      expect(dek1.length).toBe(32);
      expect(dek2.length).toBe(32);
      expect(dek3.length).toBe(32);

      // Should be different from each other
      expect(Buffer.from(dek1).toString('hex')).not.toBe(Buffer.from(dek2).toString('hex'));
      expect(Buffer.from(dek2).toString('hex')).not.toBe(Buffer.from(dek3).toString('hex'));
    });

    it('should not generate all-zero keys', async () => {
      const dek = await generateDEK();
      const allZeros = dek.every((byte) => byte === 0);
      expect(allZeros).toBe(false);
    });
  });

  describe('deriveMasterKey() - Argon2id Path', () => {
    it('should use Argon2id by default', { timeout: 15000 }, async () => {
      const { mk, kdf } = await deriveMasterKey({ passphrase: 'test-argon2' });
      expect(kdf.type).toBe('argon2id');
      expect(kdf.opslimit).toBeDefined();
      expect(kdf.memlimit).toBeDefined();
      expect(kdf.salt).toBeTruthy();
      expect(mk.length).toBe(32);
    });

    it('should use interactive params when requested', async () => {
      const { kdf } = await deriveMasterKey({
        passphrase: 'test-interactive',
        argon2Interactive: true,
      });
      expect(kdf.type).toBe('argon2id');
      // Interactive params should be lower (faster)
      expect(kdf.opslimit).toBeDefined();
      expect(kdf.memlimit).toBeDefined();
    });

    it('should derive different keys for different passphrases', { timeout: 15000 }, async () => {
      const { mk: mk1 } = await deriveMasterKey({ passphrase: 'password1' });
      const { mk: mk2 } = await deriveMasterKey({ passphrase: 'password2' });
      expect(Buffer.from(mk1).toString('hex')).not.toBe(Buffer.from(mk2).toString('hex'));
    });

    it(
      'should derive different keys for same passphrase (random salt)',
      { timeout: 15000 },
      async () => {
        const { mk: mk1 } = await deriveMasterKey({ passphrase: 'same' });
        const { mk: mk2 } = await deriveMasterKey({ passphrase: 'same' });
        // Different salts mean different keys
        expect(Buffer.from(mk1).toString('hex')).not.toBe(Buffer.from(mk2).toString('hex'));
      },
    );
  });

  describe('deriveMasterKey() - PBKDF2 Fallback Path', () => {
    it('should use PBKDF2 when fallback forced', async () => {
      const { mk, kdf } = await deriveMasterKey({
        passphrase: 'test-pbkdf2',
        forcePbkdf2Fallback: true,
      });
      expect(kdf.type).toBe('pbkdf2');
      expect(kdf.iterations).toBe(210_000);
      expect(kdf.salt).toBeTruthy();
      expect(mk.length).toBe(32);
    });

    it('should handle empty passphrase with PBKDF2', async () => {
      const { mk, kdf } = await deriveMasterKey({
        passphrase: '',
        forcePbkdf2Fallback: true,
      });
      expect(kdf.type).toBe('pbkdf2');
      expect(mk.length).toBe(32);
    });

    it('should handle very long passphrase with PBKDF2', async () => {
      const longPass = 'a'.repeat(1000);
      const { mk, kdf } = await deriveMasterKey({
        passphrase: longPass,
        forcePbkdf2Fallback: true,
      });
      expect(kdf.type).toBe('pbkdf2');
      expect(mk.length).toBe(32);
    });

    it('should handle unicode passphrase with PBKDF2', async () => {
      const { mk, kdf } = await deriveMasterKey({
        passphrase: '密码🔐',
        forcePbkdf2Fallback: true,
      });
      expect(kdf.type).toBe('pbkdf2');
      expect(mk.length).toBe(32);
    });
  });

  describe('wrapKey() and unwrapKey() - Sodium Path', () => {
    it('should wrap and unwrap with Argon2id-derived key', async () => {
      const { mk, kdf } = await deriveMasterKey({ passphrase: 'test' });
      const dek = await generateDEK();

      const wrapped = await wrapKey(dek, mk, kdf);
      expect(wrapped.wrapped_dek).toBeTruthy();
      expect(wrapped.crypto_version).toBe(1);

      const unwrapped = await unwrapKey(wrapped, mk);
      expect(Buffer.from(unwrapped).toString('hex')).toBe(Buffer.from(dek).toString('hex'));
    });

    it('should fail to unwrap with wrong master key', { timeout: 15000 }, async () => {
      const { mk, kdf } = await deriveMasterKey({ passphrase: 'correct' });
      const { mk: wrongMK } = await deriveMasterKey({ passphrase: 'wrong' });
      const dek = await generateDEK();

      const wrapped = await wrapKey(dek, mk, kdf);

      await expect(unwrapKey(wrapped, wrongMK)).rejects.toThrow();
    });
  });

  describe('wrapKey() and unwrapKey() - AES-GCM Fallback Path', () => {
    // Note: Testing the AES-GCM fallback path requires sodium to not be ready
    // This is difficult to test without mocking, but PBKDF2 keys use the same path
    it('should wrap and unwrap with PBKDF2-derived key (uses AES-GCM fallback)', async () => {
      const { mk, kdf } = await deriveMasterKey({
        passphrase: 'test-aes',
        forcePbkdf2Fallback: true,
      });
      const dek = await generateDEK();

      const wrapped = await wrapKey(dek, mk, kdf);
      expect(wrapped.wrapped_dek).toBeTruthy();

      const unwrapped = await unwrapKey(wrapped, mk);
      expect(Buffer.from(unwrapped).toString('hex')).toBe(Buffer.from(dek).toString('hex'));
    });
  });

  describe('encryptBytes() and decryptBytes()', () => {
    it('should encrypt and decrypt bytes', async () => {
      const dek = await generateDEK();
      const encoded = new TextEncoder().encode('Secret message');
      // Convert to plain Uint8Array (libsodium doesn't like Buffer-backed arrays)
      const plaintext = new Uint8Array(encoded);

      const encrypted = await encryptBytes(plaintext, dek);
      expect(encrypted.ciphertext).toBeTruthy();
      expect(encrypted.nonce).toBeTruthy();
      expect(encrypted.ver).toBe(1);

      const decrypted = await decryptBytes(encrypted, dek);
      expect(new TextDecoder().decode(decrypted)).toBe('Secret message');
    });

    it('should handle empty plaintext', async () => {
      const dek = await generateDEK();
      const plaintext = new Uint8Array([]);

      const encrypted = await encryptBytes(plaintext, dek);
      const decrypted = await decryptBytes(encrypted, dek);

      expect(decrypted).toEqual(plaintext);
    });

    it('should handle large plaintext (1MB)', async () => {
      const dek = await generateDEK();
      const plaintext = new Uint8Array(1024 * 1024).fill(65); // 1MB of 'A'

      const encrypted = await encryptBytes(plaintext, dek);
      const decrypted = await decryptBytes(encrypted, dek);

      expect(decrypted).toEqual(plaintext);
    }, 30000); // Increase timeout for large data encryption

    it('should fail to decrypt with wrong DEK', async () => {
      const dek1 = await generateDEK();
      const dek2 = await generateDEK();
      const encoded = new TextEncoder().encode('Secret');
      const plaintext = new Uint8Array(encoded);

      const encrypted = await encryptBytes(plaintext, dek1);

      await expect(decryptBytes(encrypted, dek2)).rejects.toThrow();
    });

    it('should fail to decrypt with tampered ciphertext', async () => {
      const dek = await generateDEK();
      const encoded = new TextEncoder().encode('Secret');
      const plaintext = new Uint8Array(encoded);

      const encrypted = await encryptBytes(plaintext, dek);

      // Tamper with ciphertext
      const tamperedCiphertext = b64decode(encrypted.ciphertext);
      tamperedCiphertext[0] ^= 1; // Flip a bit
      const tampered = {
        ...encrypted,
        ciphertext: b64encode(tamperedCiphertext),
      };

      await expect(decryptBytes(tampered, dek)).rejects.toThrow();
    });

    it('should fail to decrypt with tampered nonce', async () => {
      const dek = await generateDEK();
      const encoded = new TextEncoder().encode('Secret');
      const plaintext = new Uint8Array(encoded);

      const encrypted = await encryptBytes(plaintext, dek);

      // Tamper with nonce
      const tamperedNonce = b64decode(encrypted.nonce);
      tamperedNonce[0] ^= 1;
      const tampered = {
        ...encrypted,
        nonce: b64encode(tamperedNonce),
      };

      await expect(decryptBytes(tampered, dek)).rejects.toThrow();
    });
  });

  describe('encryptJSON() and decryptJSON()', () => {
    it('should encrypt and decrypt JSON objects', async () => {
      const dek = await generateDEK();
      const payload = {
        title: 'Chapter 1',
        content: 'It was a dark and stormy night...',
        meta: { wordCount: 50, tags: ['draft', 'mystery'] },
      };

      const encrypted = await encryptJSON(payload, dek);
      expect(encrypted.ciphertext).toBeTruthy();

      const decrypted = await decryptJSON<typeof payload>(encrypted, dek);
      expect(decrypted).toEqual(payload);
    });

    it('should handle nested objects and arrays', async () => {
      const dek = await generateDEK();
      const complex = {
        users: [
          { id: 1, name: 'Alice', roles: ['admin', 'editor'] },
          { id: 2, name: 'Bob', roles: ['viewer'] },
        ],
        settings: { theme: 'dark', notifications: true },
        metadata: { version: 1, created: new Date().toISOString() },
      };

      const encrypted = await encryptJSON(complex, dek);
      const decrypted = await decryptJSON<typeof complex>(encrypted, dek);
      expect(decrypted).toEqual(complex);
    });

    it('should handle null and undefined values', async () => {
      const dek = await generateDEK();
      const payload = { a: null, b: undefined, c: 42 };

      const encrypted = await encryptJSON(payload, dek);
      const decrypted = await decryptJSON<typeof payload>(encrypted, dek);
      // Note: JSON.stringify removes undefined
      expect(decrypted).toEqual({ a: null, c: 42 });
    });

    it('should handle unicode in JSON', async () => {
      const dek = await generateDEK();
      const payload = { message: 'Hello 世界! 🌍' };

      const encrypted = await encryptJSON(payload, dek);
      const decrypted = await decryptJSON<typeof payload>(encrypted, dek);
      expect(decrypted).toEqual(payload);
    });
  });

  describe('rederiveMK() - Argon2id Path', () => {
    it('should re-derive same master key from Argon2id KDF params', async () => {
      const passphrase = 'correct horse battery staple';
      const { mk, kdf } = await deriveMasterKey({ passphrase });

      const mk2 = await rederiveMK(passphrase, kdf);
      expect(Buffer.from(mk2).toString('hex')).toBe(Buffer.from(mk).toString('hex'));
    });

    it('should re-derive different key for wrong passphrase', { timeout: 15000 }, async () => {
      const { mk, kdf } = await deriveMasterKey({ passphrase: 'correct' });

      const wrongMK = await rederiveMK('wrong', kdf);
      expect(Buffer.from(wrongMK).toString('hex')).not.toBe(Buffer.from(mk).toString('hex'));
    });

    it('should handle missing opslimit/memlimit (use defaults)', async () => {
      const { mk, kdf } = await deriveMasterKey({ passphrase: 'test' });

      // Remove optional params to test defaults
      const kdfWithoutOptionals = {
        type: kdf.type as 'argon2id',
        salt: kdf.salt,
        v: kdf.v,
      };

      const mk2 = await rederiveMK('test', kdfWithoutOptionals);
      // Should still work but may produce different key due to different params
      expect(mk2.length).toBe(32);
    });
  });

  describe('rederiveMK() - PBKDF2 Path', () => {
    it('should re-derive same master key from PBKDF2 KDF params', async () => {
      const passphrase = 'test-pbkdf2-rederive';
      const { mk, kdf } = await deriveMasterKey({
        passphrase,
        forcePbkdf2Fallback: true,
      });

      const mk2 = await rederiveMK(passphrase, kdf);
      expect(Buffer.from(mk2).toString('hex')).toBe(Buffer.from(mk).toString('hex'));
    });

    it('should handle missing iterations (use default)', async () => {
      const { kdf } = await deriveMasterKey({
        passphrase: 'test',
        forcePbkdf2Fallback: true,
      });

      const kdfWithoutIterations = {
        type: kdf.type as 'pbkdf2',
        salt: kdf.salt,
        v: kdf.v,
      };

      const mk = await rederiveMK('test', kdfWithoutIterations);
      expect(mk.length).toBe(32);
    });
  });

  describe('buildRecoveryKit()', () => {
    it('should build recovery kit with Argon2id', async () => {
      const { mk, kdf } = await deriveMasterKey({ passphrase: 'test' });
      const dek = await generateDEK();
      const wrapped = await wrapKey(dek, mk, kdf);

      const kit = buildRecoveryKit('project-abc', wrapped);

      expect(kit.inkwell_recovery_kit).toBe(1);
      expect(kit.project_id).toBe('project-abc');
      expect(kit.wrapped_dek).toBe(wrapped.wrapped_dek);
      expect(kit.kdf).toEqual(kdf);
      expect(kit.aead).toMatch(/xchacha20poly1305_ietf|aes-256-gcm/);
      expect(kit.created_at).toBeTruthy();
      expect(kit.version).toBe('1');
    });

    it('should build recovery kit with PBKDF2', async () => {
      const { mk, kdf } = await deriveMasterKey({
        passphrase: 'test',
        forcePbkdf2Fallback: true,
      });
      const dek = await generateDEK();
      const wrapped = await wrapKey(dek, mk, kdf);

      const kit = buildRecoveryKit('project-xyz', wrapped);

      expect(kit.inkwell_recovery_kit).toBe(1);
      expect(kit.kdf.type).toBe('pbkdf2');
    });
  });

  describe('Full E2EE Flow', () => {
    it('should complete full encryption workflow', async () => {
      const passphrase = 'correct horse battery staple';

      // Step 1: Derive master key
      const { mk, kdf } = await deriveMasterKey({ passphrase });

      // Step 2: Generate and wrap DEK
      const dek = await generateDEK();
      const wrapped = await wrapKey(dek, mk, kdf);

      // Step 3: Encrypt content
      const content = { text: 'Secret chapter content', author: 'Alice' };
      const encrypted = await encryptJSON(content, dek);

      // Step 4: Re-derive master key (new device scenario)
      const mk2 = await rederiveMK(passphrase, kdf);
      expect(Buffer.from(mk2).toString('hex')).toBe(Buffer.from(mk).toString('hex'));

      // Step 5: Unwrap DEK
      const dek2 = await unwrapKey(wrapped, mk2);
      expect(Buffer.from(dek2).toString('hex')).toBe(Buffer.from(dek).toString('hex'));

      // Step 6: Decrypt content
      const decrypted = await decryptJSON<typeof content>(encrypted, dek2);
      expect(decrypted).toEqual(content);
    }, 10000); // Increase timeout to 10 seconds for crypto operations

    it('should fail full workflow with wrong passphrase', async () => {
      const { mk, kdf } = await deriveMasterKey({ passphrase: 'correct' });
      const dek = await generateDEK();
      const wrapped = await wrapKey(dek, mk, kdf);

      const wrongMK = await rederiveMK('wrong', kdf);

      await expect(unwrapKey(wrapped, wrongMK)).rejects.toThrow();
    });

    it('should complete full workflow with PBKDF2 fallback', async () => {
      const passphrase = 'test-pbkdf2-flow';

      const { mk, kdf } = await deriveMasterKey({
        passphrase,
        forcePbkdf2Fallback: true,
      });
      const dek = await generateDEK();
      const wrapped = await wrapKey(dek, mk, kdf);

      const content = { message: 'Hello from PBKDF2!' };
      const encrypted = await encryptJSON(content, dek);

      const mk2 = await rederiveMK(passphrase, kdf);
      const dek2 = await unwrapKey(wrapped, mk2);
      const decrypted = await decryptJSON<typeof content>(encrypted, dek2);

      expect(decrypted).toEqual(content);
    });
  });

  describe('Property-Based Tests', () => {
    it('should maintain encryption integrity for various data sizes', async () => {
      const dek = await generateDEK();
      const sizes = [0, 1, 16, 100, 1000, 10000];

      for (const size of sizes) {
        const plaintext = new Uint8Array(size).fill(42);
        const encrypted = await encryptBytes(plaintext, dek);
        const decrypted = await decryptBytes(encrypted, dek);
        expect(decrypted).toEqual(plaintext);
      }
    });

    it('should produce different ciphertexts for same plaintext (nonce)', async () => {
      const dek = await generateDEK();
      const encoded = new TextEncoder().encode('Same message');
      const plaintext = new Uint8Array(encoded);

      const enc1 = await encryptBytes(plaintext, dek);
      const enc2 = await encryptBytes(plaintext, dek);

      // Nonces should be different
      expect(enc1.nonce).not.toBe(enc2.nonce);
      // Ciphertexts should be different
      expect(enc1.ciphertext).not.toBe(enc2.ciphertext);

      // But both should decrypt to same plaintext
      const dec1 = await decryptBytes(enc1, dek);
      const dec2 = await decryptBytes(enc2, dek);
      expect(new TextDecoder().decode(dec1)).toBe('Same message');
      expect(new TextDecoder().decode(dec2)).toBe('Same message');
    });
  });
});
