/**
 * RLS Bypass Detection Tests
 *
 * These tests verify that Row-Level Security policies are properly enforced
 * and cannot be bypassed through various attack vectors.
 *
 * Run these tests after every migration to ensure RLS integrity.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// Test users
interface TestUser {
  id: string;
  email: string;
  password: string;
  client: SupabaseClient;
}

let userA: TestUser;
let userB: TestUser;
let serviceClient: SupabaseClient;

// Test data
let projectA: { id: string; title: string };
let chapterA: { id: string; title: string };
let characterA: { id: string; name: string };
let noteA: { id: string; content: string };

/**
 * Setup: Create test users and authenticate
 */
beforeAll(async () => {
  // Create service client for setup
  serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Create test users
  const emailA = `test-user-a-${Date.now()}@example.com`;
  const emailB = `test-user-b-${Date.now()}@example.com`;
  const password = 'TestPassword123!';

  // Sign up User A
  const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authDataA, error: errorA } = await clientA.auth.signUp({
    email: emailA,
    password: password,
  });
  if (errorA) throw new Error(`Failed to create User A: ${errorA.message}`);
  if (!authDataA.user) throw new Error('User A not created');

  userA = {
    id: authDataA.user.id,
    email: emailA,
    password: password,
    client: clientA,
  };

  // Sign up User B
  const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authDataB, error: errorB } = await clientB.auth.signUp({
    email: emailB,
    password: password,
  });
  if (errorB) throw new Error(`Failed to create User B: ${errorB.message}`);
  if (!authDataB.user) throw new Error('User B not created');

  userB = {
    id: authDataB.user.id,
    email: emailB,
    password: password,
    client: clientB,
  };

  // Create test data as User A
  const { data: project, error: projectError } = await userA.client
    .from('projects')
    .insert({ title: 'User A Private Project', owner_id: userA.id })
    .select()
    .single();
  if (projectError) throw new Error(`Failed to create project: ${projectError.message}`);
  projectA = project;

  const { data: chapter, error: chapterError } = await userA.client
    .from('chapters')
    .insert({
      project_id: projectA.id,
      title: 'Chapter 1',
      body: 'Secret content',
      index_in_project: 0,
    })
    .select()
    .single();
  if (chapterError) throw new Error(`Failed to create chapter: ${chapterError.message}`);
  chapterA = chapter;

  const { data: character, error: characterError } = await userA.client
    .from('characters')
    .insert({
      project_id: projectA.id,
      name: 'Hero',
      bio: 'Secret character bio',
    })
    .select()
    .single();
  if (characterError) throw new Error(`Failed to create character: ${characterError.message}`);
  characterA = character;

  const { data: note, error: noteError } = await userA.client
    .from('notes')
    .insert({
      project_id: projectA.id,
      content: 'Secret note',
    })
    .select()
    .single();
  if (noteError) throw new Error(`Failed to create note: ${noteError.message}`);
  noteA = note;
});

/**
 * Cleanup: Delete test users and data
 */
afterAll(async () => {
  // Cleanup is handled by ON DELETE CASCADE
  // Just delete users via service role
  if (userA?.id) {
    await serviceClient.auth.admin.deleteUser(userA.id);
  }
  if (userB?.id) {
    await serviceClient.auth.admin.deleteUser(userB.id);
  }
});

describe('RLS Bypass Detection: Projects', () => {
  it('should prevent User B from reading User A project', async () => {
    const { data, error } = await userB.client
      .from('projects')
      .select('*')
      .eq('id', projectA.id)
      .single();

    expect(data).toBeNull();
    expect(error).not.toBeNull();
    expect(error?.message).toContain('Row-level security');
  });

  it('should prevent User B from updating User A project', async () => {
    const { data, error } = await userB.client
      .from('projects')
      .update({ title: 'Hacked!' })
      .eq('id', projectA.id)
      .select();

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it('should prevent User B from deleting User A project', async () => {
    const { data, error } = await userB.client
      .from('projects')
      .delete()
      .eq('id', projectA.id)
      .select();

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it('should allow User A to read their own project', async () => {
    const { data, error } = await userA.client
      .from('projects')
      .select('*')
      .eq('id', projectA.id)
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.id).toBe(projectA.id);
  });
});

describe('RLS Bypass Detection: Chapters', () => {
  it('should prevent User B from reading User A chapter', async () => {
    const { data, error } = await userB.client
      .from('chapters')
      .select('*')
      .eq('id', chapterA.id)
      .single();

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it('should prevent User B from creating chapter in User A project', async () => {
    const { data, error } = await userB.client
      .from('chapters')
      .insert({
        project_id: projectA.id,
        title: 'Hacked Chapter',
        body: 'Malicious content',
        index_in_project: 1,
      })
      .select();

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it('should prevent User B from updating User A chapter', async () => {
    const { data, error } = await userB.client
      .from('chapters')
      .update({ body: 'Hacked content' })
      .eq('id', chapterA.id)
      .select();

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it('should allow User A to read their own chapter', async () => {
    const { data, error } = await userA.client
      .from('chapters')
      .select('*')
      .eq('id', chapterA.id)
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.id).toBe(chapterA.id);
  });
});

describe('RLS Bypass Detection: Characters', () => {
  it('should prevent User B from reading User A character', async () => {
    const { data, error } = await userB.client
      .from('characters')
      .select('*')
      .eq('id', characterA.id)
      .single();

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it('should prevent User B from creating character in User A project', async () => {
    const { data, error } = await userB.client
      .from('characters')
      .insert({
        project_id: projectA.id,
        name: 'Hacked Character',
        bio: 'Malicious bio',
      })
      .select();

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });
});

describe('RLS Bypass Detection: Notes', () => {
  it('should prevent User B from reading User A note', async () => {
    const { data, error } = await userB.client
      .from('notes')
      .select('*')
      .eq('id', noteA.id)
      .single();

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it('should prevent User B from creating note in User A project', async () => {
    const { data, error } = await userB.client
      .from('notes')
      .insert({
        project_id: projectA.id,
        content: 'Hacked note',
      })
      .select();

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });
});

describe('RLS Bypass Detection: Views', () => {
  it('should prevent User B from reading User A project via projects_active view', async () => {
    const { data, error } = await userB.client
      .from('projects_active')
      .select('*')
      .eq('id', projectA.id)
      .single();

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it('should prevent User B from reading User A chapter via chapters_active view', async () => {
    const { data, error } = await userB.client
      .from('chapters_active')
      .select('*')
      .eq('id', chapterA.id)
      .single();

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it('should not show soft-deleted items in active views', async () => {
    // Soft delete the chapter
    const { error: deleteError } = await userA.client
      .from('chapters')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', chapterA.id);

    expect(deleteError).toBeNull();

    // Try to read from active view
    const { data, error } = await userA.client
      .from('chapters_active')
      .select('*')
      .eq('id', chapterA.id)
      .single();

    expect(data).toBeNull();
    expect(error).not.toBeNull();

    // Restore for other tests
    await userA.client.from('chapters').update({ deleted_at: null }).eq('id', chapterA.id);
  });
});

describe('RLS Bypass Detection: SECURITY DEFINER Functions', () => {
  it('should prevent User B from soft-deleting User A project', async () => {
    const { error } = await userB.client.rpc('soft_delete', {
      _table: 'projects',
      _id: projectA.id,
    });

    // This WILL FAIL until soft_delete() is fixed with authorization checks
    // TODO: Update this test once soft_delete is fixed
    expect(error).not.toBeNull();
  });

  it('should prevent User B from soft-deleting User A chapter', async () => {
    const { error } = await userB.client.rpc('soft_delete', {
      _table: 'chapters',
      _id: chapterA.id,
    });

    // This WILL FAIL until soft_delete() is fixed
    expect(error).not.toBeNull();
  });

  it('should prevent User B from bulk upserting to User A project', async () => {
    const { error } = await userB.client.rpc('bulk_upsert_chapters', {
      rows: [
        {
          id: crypto.randomUUID(),
          project_id: projectA.id,
          title: 'Hacked via bulk upsert',
          body: 'Malicious content',
          index_in_project: 99,
          client_rev: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    });

    // This WILL FAIL until bulk_upsert_chapters() is fixed
    expect(error).not.toBeNull();
  });
});

describe('RLS Bypass Detection: Role-Based Access', () => {
  let sharedProject: { id: string };

  beforeAll(async () => {
    // Create a shared project
    const { data: project, error } = await userA.client
      .from('projects')
      .insert({ title: 'Shared Project', owner_id: userA.id })
      .select()
      .single();
    if (error) throw new Error(`Failed to create shared project: ${error.message}`);
    sharedProject = project;
  });

  it('should allow viewer to read but not write', async () => {
    // Add User B as viewer
    const { error: memberError } = await userA.client.from('project_members').insert({
      project_id: sharedProject.id,
      user_id: userB.id,
      role: 'viewer',
    });

    expect(memberError).toBeNull();

    // User B should be able to read
    const { data: readData, error: readError } = await userB.client
      .from('projects')
      .select('*')
      .eq('id', sharedProject.id)
      .single();

    expect(readError).toBeNull();
    expect(readData).not.toBeNull();

    // User B should NOT be able to create chapter
    const { data: writeData, error: writeError } = await userB.client
      .from('chapters')
      .insert({
        project_id: sharedProject.id,
        title: 'Viewer attempt',
        body: 'Should fail',
        index_in_project: 0,
      })
      .select();

    expect(writeData).toBeNull();
    expect(writeError).not.toBeNull();
  });

  it('should allow editor to read and write', async () => {
    // Update User B to editor
    const { error: updateError } = await userA.client
      .from('project_members')
      .update({ role: 'editor' })
      .eq('project_id', sharedProject.id)
      .eq('user_id', userB.id);

    expect(updateError).toBeNull();

    // User B should be able to create chapter
    const { data, error } = await userB.client
      .from('chapters')
      .insert({
        project_id: sharedProject.id,
        title: 'Editor chapter',
        body: 'Should succeed',
        index_in_project: 0,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });

  it('should prevent editor from updating project metadata', async () => {
    // Editor should NOT be able to update project
    const { data, error } = await userB.client
      .from('projects')
      .update({ title: 'Hacked by editor' })
      .eq('id', sharedProject.id)
      .select();

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });
});

describe('RLS Bypass Detection: Profiles', () => {
  it('should prevent User B from reading User A profile', async () => {
    const { data, error } = await userB.client
      .from('profiles')
      .select('*')
      .eq('id', userA.id)
      .single();

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it('should prevent User B from updating User A profile', async () => {
    const { data, error } = await userB.client
      .from('profiles')
      .update({ display_name: 'Hacked' })
      .eq('id', userA.id)
      .select();

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it('should allow User A to read their own profile', async () => {
    const { data, error } = await userA.client
      .from('profiles')
      .select('*')
      .eq('id', userA.id)
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.id).toBe(userA.id);
  });
});

describe('RLS Bypass Detection: Project Members', () => {
  it('should prevent User B from adding themselves to User A project', async () => {
    const { data, error } = await userB.client
      .from('project_members')
      .insert({
        project_id: projectA.id,
        user_id: userB.id,
        role: 'owner',
      })
      .select();

    // INSERT policy now requires is_project_owner() check
    // Only project owners can add members, so User B cannot add themselves
    expect(data).toBeNull();
    expect(error).not.toBeNull();
    expect(error?.message).toContain('violates row-level security policy');
  });

  it('should prevent non-owners from removing members', async () => {
    // First, User A (the owner) adds User B as a member
    const { data: insertData, error: insertError } = await userA.client
      .from('project_members')
      .insert({
        project_id: projectA.id,
        user_id: userB.id,
        role: 'viewer',
      })
      .select();

    expect(insertData).not.toBeNull();
    expect(insertError).toBeNull();

    // Now User B tries to remove themselves
    const { data, error } = await userB.client
      .from('project_members')
      .delete()
      .eq('project_id', projectA.id)
      .eq('user_id', userB.id)
      .select();

    // DELETE policy requires is_project_owner(), so members cannot remove themselves
    expect(data).toBeNull();
    expect(error).not.toBeNull();
    expect(error?.message).toContain('violates row-level security policy');
  });
});
