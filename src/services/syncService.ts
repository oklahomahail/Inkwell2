// src/services/syncService.ts
// Minimal manual push and pull with E2EE gate. IndexedDB is the source of truth.
// This module wires cryptoService to Supabase and exposes a small status surface.

import type {
  KdfParams,
  WrappedKeyRecord,
  RecoveryKit,
  StorageMode,
  SyncContext,
} from '@/types/crypto';

import {
  buildRecoveryKit,
  decryptJSON,
  encryptJSON,
  generateDEK,
  rederiveMK,
  wrapKey,
  unwrapKey,
} from './cryptoService';

import type { LocalGateway } from './localGateway';
import type { SupabaseClient } from '@supabase/supabase-js';

// Supabase table types
export type SupabaseProject = {
  id: string;
  owner_id: string;
  title: string;
  crypto_enabled: boolean;
  wrapped_dek: string | null;
  kdf_params: KdfParams | null;
  crypto_version: number;
};

export type SupabaseChapter = {
  id: string;
  project_id: string;
  order_index: number;
  updated_at: string;
  content_ciphertext: string | null;
  content_nonce: string | null;
  crypto_version: number;
};

export class SyncService {
  private supabase: SupabaseClient;
  private local: LocalGateway;

  private ctx: SyncContext = { mode: 'local', e2eeEnabled: false, status: 'idle' };

  // Cached key material
  private mk: Uint8Array | null = null;
  private dek: Uint8Array | null = null;
  private wrapped: WrappedKeyRecord | null = null;
  private projectId: string | null = null;

  constructor(supabase: SupabaseClient, localGateway: LocalGateway) {
    this.supabase = supabase;
    this.local = localGateway;
  }

  getContext(): SyncContext {
    return { ...this.ctx };
  }

  setMode(mode: StorageMode) {
    this.ctx.mode = mode;
  }

  setE2EE(enabled: boolean) {
    this.ctx.e2eeEnabled = enabled;
  }

  /**
   * Initialize key material for a project.
   * If E2EE is enabled and project has no wrapped key yet, create one.
   */
  async ensureKeys(projectId: string, passphrase?: string): Promise<void> {
    this.projectId = projectId;

    if (!this.ctx.e2eeEnabled) {
      // No E2EE key work needed
      this.mk = null;
      this.dek = null;
      this.wrapped = null;
      return;
    }

    // Fetch project row
    const { data: proj, error } = await this.supabase
      .from('projects')
      .select('id, crypto_enabled, wrapped_dek, kdf_params, crypto_version')
      .eq('id', projectId)
      .single();

    if (error) throw new Error(`Failed to read project: ${error.message}`);

    if (!proj.crypto_enabled || !proj.wrapped_dek || !proj.kdf_params) {
      // First-time enable for this project
      if (!passphrase) throw new Error('Passphrase required to enable encryption');

      // Derive MK and generate DEK
      const { deriveMasterKey } = await import('./cryptoService');
      const { mk, kdf } = await deriveMasterKey({ passphrase });
      const dek = await generateDEK();
      const wrapped = await wrapKey(dek, mk, kdf);

      // Persist on project
      const { error: upErr } = await this.supabase
        .from('projects')
        .update({
          crypto_enabled: true,
          wrapped_dek: wrapped.wrapped_dek,
          kdf_params: wrapped.kdf_params,
          crypto_version: wrapped.crypto_version,
        })
        .eq('id', projectId);

      if (upErr) throw new Error(`Failed to enable encryption: ${upErr.message}`);

      this.mk = mk;
      this.dek = dek;
      this.wrapped = wrapped;
      return;
    }

    // Already enabled. Re-derive MK using stored KDF and provided passphrase
    if (!passphrase) throw new Error('Passphrase required to unlock encryption');
    const mk = await rederiveMK(passphrase, proj.kdf_params as KdfParams);
    const wrapped: WrappedKeyRecord = {
      wrapped_dek: proj.wrapped_dek as string,
      kdf_params: proj.kdf_params as KdfParams,
      crypto_version: proj.crypto_version ?? 1,
    };
    const dek = await unwrapKey(wrapped, mk);

    this.mk = mk;
    this.dek = dek;
    this.wrapped = wrapped;
  }

  /**
   * Manual push. Serialize from local, encrypt if enabled, then upsert to Supabase.
   */
  async pushNow(projectId: string): Promise<void> {
    if (this.ctx.mode === 'local') return;

    this.ctx.status = 'pending';

    try {
      const proj = await this.local.getProject(projectId);
      if (!proj) throw new Error('Local project not found');

      const chapters = await this.local.getChapters(projectId);

      // Upsert project row flags on first push if needed
      if (this.ctx.e2eeEnabled) {
        if (!this.dek || !this.wrapped)
          throw new Error('Encryption not initialized. Call ensureKeys with passphrase.');
      }

      // Encrypt each chapter content as JSON
      const rows = await Promise.all(
        chapters.map(async (ch) => {
          if (this.ctx.e2eeEnabled) {
            const enc = await encryptJSON(ch.content, this.dek!);
            return {
              id: ch.id,
              project_id: ch.project_id,
              order_index: ch.order_index,
              content_ciphertext: enc.ciphertext,
              content_nonce: enc.nonce,
              crypto_version: enc.ver,
              updated_at: ch.updated_at,
            };
          }
          // Non-encrypted path stores plaintext in a separate column if you choose to support it
          return {
            id: ch.id,
            project_id: ch.project_id,
            order_index: ch.order_index,
            content_ciphertext: null,
            content_nonce: null,
            crypto_version: 0,
            updated_at: ch.updated_at,
          };
        }),
      );

      // Upsert chapters
      const { error: upErr } = await this.supabase
        .from('chapters')
        .upsert(rows, { onConflict: 'id' });
      if (upErr) throw new Error(`Upsert chapters failed: ${upErr.message}`);

      // Mark project crypto flag if needed
      if (this.ctx.e2eeEnabled) {
        const { error: projErr } = await this.supabase
          .from('projects')
          .update({ crypto_enabled: true })
          .eq('id', projectId);
        if (projErr) throw new Error(`Project update failed: ${projErr.message}`);
      }

      this.ctx.status = 'synced';
    } catch (e: unknown) {
      this.ctx.status = navigator.onLine ? 'error' : 'offline';
      this.ctx.lastError = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  /**
   * Manual pull. Fetch from Supabase, decrypt if enabled, hydrate IndexedDB.
   */
  async pullNow(projectId: string): Promise<void> {
    if (this.ctx.mode === 'local') return;

    this.ctx.status = 'pending';

    try {
      // Read from server
      const { data: rows, error } = await this.supabase
        .from('chapters')
        .select(
          'id, project_id, order_index, content_ciphertext, content_nonce, crypto_version, updated_at',
        )
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) throw new Error(`Fetch chapters failed: ${error.message}`);

      const chapters = await Promise.all(
        (rows ?? []).map(async (r) => {
          if (this.ctx.e2eeEnabled) {
            if (!r.content_ciphertext || !r.content_nonce)
              throw new Error('Encrypted content missing fields');
            const content = await decryptJSON(
              {
                ciphertext: r.content_ciphertext,
                nonce: r.content_nonce,
                ver: r.crypto_version ?? 1,
              },
              this.dek!,
            );
            return {
              id: r.id,
              content,
              order_index: r.order_index,
              updated_at: r.updated_at,
            };
          }
          // Non-E2EE: if you store plaintext server-side, map it here
          return {
            id: r.id,
            content: {}, // TODO map your plaintext shape if supported
            order_index: r.order_index,
            updated_at: r.updated_at,
          };
        }),
      );

      await this.local.replaceProjectFromCloud(projectId, { chapters });
      this.ctx.status = 'synced';
    } catch (e: unknown) {
      this.ctx.status = navigator.onLine ? 'error' : 'offline';
      this.ctx.lastError = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  /**
   * Build and return a Recovery Kit JSON when E2EE is enabled for this project.
   */
  getRecoveryKit(): RecoveryKit | null {
    if (!this.projectId || !this.wrapped) return null;
    return buildRecoveryKit(this.projectId, this.wrapped);
  }
}
