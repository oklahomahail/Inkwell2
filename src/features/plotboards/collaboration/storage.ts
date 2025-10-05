// Collaboration Storage Layer for Plot Boards
// Abstraction that works with local storage but ready for network/server integration

import { trace } from '../../../utils/trace';

import {
  CollaborativeUser,
  CollaborativeEvent,
  CollaborativeConflict,
  Operation,
  CollaborativeSession,
  SyncState,
  ConnectionState,
  SharedBoard,
  CardComment,
  CollaborativeWorkspace,
  UserRole,
  Permission,
  ConflictStatus,
  ConnectionStatus,
  SyncOptions,
} from './types';

/* ========= Storage Interface ========= */

export interface CollaborationStorageAdapter {
  // User management
  getCurrentUser(): Promise<CollaborativeUser | null>;
  getUserById(userId: string): Promise<CollaborativeUser | null>;
  getWorkspaceUsers(workspaceId: string): Promise<CollaborativeUser[]>;
  updateUser(user: CollaborativeUser): Promise<void>;
  updateUserPresence(userId: string, presence: any): Promise<void>;

  // Event management
  publishEvent(event: CollaborativeEvent): Promise<void>;
  subscribeToEvents(boardId: string, callback: (event: CollaborativeEvent) => void): () => void;
  getEventHistory(boardId: string, fromVersion?: number): Promise<CollaborativeEvent[]>;

  // Conflict management
  saveConflict(conflict: CollaborativeConflict): Promise<void>;
  getConflicts(boardId: string): Promise<CollaborativeConflict[]>;
  resolveConflict(conflictId: string, resolution: any): Promise<void>;

  // Operation management
  saveOperation(operation: Operation): Promise<void>;
  getOperations(boardId: string, fromVersion?: number): Promise<Operation[]>;
  applyOperations(operations: Operation[]): Promise<void>;

  // Session management
  createSession(session: CollaborativeSession): Promise<void>;
  updateSession(sessionId: string, updates: Partial<CollaborativeSession>): Promise<void>;
  getActiveSession(boardId: string): Promise<CollaborativeSession | null>;

  // Synchronization
  getSyncState(boardId: string): Promise<SyncState | null>;
  updateSyncState(syncState: SyncState): Promise<void>;

  // Connection management
  getConnectionState(): Promise<ConnectionState>;
  updateConnectionState(state: ConnectionState): Promise<void>;

  // Board sharing
  createSharedBoard(sharedBoard: SharedBoard): Promise<void>;
  getSharedBoard(shareId: string): Promise<SharedBoard | null>;
  updateSharedBoard(shareId: string, updates: Partial<SharedBoard>): Promise<void>;

  // Comments
  saveComment(comment: CardComment): Promise<void>;
  getComments(cardId: string): Promise<CardComment[]>;
  updateComment(commentId: string, updates: Partial<CardComment>): Promise<void>;
  deleteComment(commentId: string): Promise<void>;
}

/* ========= Local Storage Adapter ========= */

export class LocalCollaborationStorage implements CollaborationStorageAdapter {
  private readonly PREFIX = 'inkwell-collaboration';
  private eventSubscriptions = new Map<string, ((event: CollaborativeEvent) => void)[]>();
  private currentUser: CollaborativeUser | null = null;

  constructor() {
    this.initializeCurrentUser();
  }

  private getStorageKey(key: string): string {
    return `${this.PREFIX}-${key}`;
  }

  private async getItem<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(this.getStorageKey(key));
      return item ? JSON.parse(item) : null;
    } catch (error) {
      trace('LocalCollaborationStorage', 'Failed to get item', { key, error });
      return null;
    }
  }

  private async setItem<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(this.getStorageKey(key), JSON.stringify(value));
    } catch (error) {
      trace('LocalCollaborationStorage', 'Failed to set item', { key, error });
      throw error;
    }
  }

  private async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.getStorageKey(key));
    } catch (error) {
      trace('LocalCollaborationStorage', 'Failed to remove item', { key, error });
    }
  }

  private async getList<T>(key: string): Promise<T[]> {
    const items = await this.getItem<T[]>(key);
    return items || [];
  }

  private async addToList<T extends { id: string }>(key: string, item: T): Promise<void> {
    const items = await this.getList<T>(key);
    const existingIndex = items.findIndex((existing) => existing.id === item.id);

    if (existingIndex !== -1) {
      items[existingIndex] = item;
    } else {
      items.push(item);
    }

    await this.setItem(key, items);
  }

  private async removeFromList<T extends { id: string }>(
    key: string,
    itemId: string,
  ): Promise<void> {
    const items = await this.getList<T>(key);
    const filtered = items.filter((item) => item.id !== itemId);
    await this.setItem(key, filtered);
  }

  private async initializeCurrentUser(): Promise<void> {
    let user = await this.getItem<CollaborativeUser>('current-user');

    if (!user) {
      // Create a default local user
      user = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        username: 'Local User',
        displayName: 'Local User',
        role: UserRole.OWNER,
        permissions: [],
        status: 'active' as any,
        presence: {
          isOnline: true,
          lastSeen: new Date().toISOString(),
        },
        metadata: {
          joinedAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          contributionCount: 0,
          preferences: {
            theme: 'auto',
            notifications: {
              realTimeUpdates: true,
              cardMentions: true,
              boardChanges: true,
              newCollaborators: true,
              deadlineReminders: true,
            },
            collaboration: {
              showPresence: true,
              showCursors: true,
              autoSaveInterval: 30000,
              conflictResolution: 'manual',
            },
          },
        },
      };

      await this.setItem('current-user', user);
    }

    this.currentUser = user;
  }

  // User management
  async getCurrentUser(): Promise<CollaborativeUser | null> {
    return this.currentUser;
  }

  async getUserById(userId: string): Promise<CollaborativeUser | null> {
    if (this.currentUser?.id === userId) {
      return this.currentUser;
    }

    const users = await this.getList<CollaborativeUser>('users');
    return users.find((user) => user.id === userId) || null;
  }

  async getWorkspaceUsers(workspaceId: string): Promise<CollaborativeUser[]> {
    const workspace = await this.getItem<CollaborativeWorkspace>(`workspace-${workspaceId}`);
    if (!workspace) return [];

    const users: CollaborativeUser[] = [];
    for (const member of workspace.members) {
      const user = await this.getUserById(member.userId);
      if (user) users.push(user);
    }

    return users;
  }

  async updateUser(user: CollaborativeUser): Promise<void> {
    if (user.id === this.currentUser?.id) {
      this.currentUser = user;
      await this.setItem('current-user', user);
    }

    await this.addToList('users', user);
  }

  async updateUserPresence(userId: string, presence: any): Promise<void> {
    const user = await this.getUserById(userId);
    if (user) {
      user.presence = presence;
      await this.updateUser(user);
    }
  }

  // Event management
  async publishEvent(event: CollaborativeEvent): Promise<void> {
    await this.addToList(`events-${event.boardId}`, event);

    // Notify local subscribers
    const subscribers = this.eventSubscriptions.get(event.boardId) || [];
    subscribers.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        trace('LocalCollaborationStorage', 'Event callback error', { error });
      }
    });

    trace('LocalCollaborationStorage', 'Event published', {
      eventType: event.type,
      boardId: event.boardId,
    });
  }

  subscribeToEvents(boardId: string, callback: (event: CollaborativeEvent) => void): () => void {
    if (!this.eventSubscriptions.has(boardId)) {
      this.eventSubscriptions.set(boardId, []);
    }

    this.eventSubscriptions.get(boardId)!.push(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.eventSubscriptions.get(boardId) || [];
      const index = subscribers.indexOf(callback);
      if (index !== -1) {
        subscribers.splice(index, 1);
      }
    };
  }

  async getEventHistory(boardId: string, fromVersion = 0): Promise<CollaborativeEvent[]> {
    const events = await this.getList<CollaborativeEvent>(`events-${boardId}`);
    return events
      .filter((event) => event.version >= fromVersion)
      .sort((a, b) => a.version - b.version);
  }

  // Conflict management
  async saveConflict(conflict: CollaborativeConflict): Promise<void> {
    await this.addToList(`conflicts-${conflict.boardId}`, conflict);
  }

  async getConflicts(boardId: string): Promise<CollaborativeConflict[]> {
    const conflicts = await this.getList<CollaborativeConflict>(`conflicts-${boardId}`);
    return conflicts.filter((conflict) => conflict.status === ConflictStatus.PENDING);
  }

  async resolveConflict(conflictId: string, resolution: any): Promise<void> {
    // This would need board ID - simplified for local storage
    const allConflicts = (await this.getItem<CollaborativeConflict[]>('all-conflicts')) || [];
    const conflict = allConflicts.find((c) => c.id === conflictId);

    if (conflict) {
      conflict.resolution = resolution;
      conflict.status = ConflictStatus.RESOLVED;
      conflict.resolvedAt = new Date().toISOString();
      conflict.resolvedBy = this.currentUser?.id;

      await this.setItem('all-conflicts', allConflicts);
    }
  }

  // Operation management
  async saveOperation(operation: Operation): Promise<void> {
    await this.addToList(`operations-${operation.boardId}`, operation);
  }

  async getOperations(boardId: string, fromVersion = 0): Promise<Operation[]> {
    const operations = await this.getList<Operation>(`operations-${boardId}`);
    return operations
      .filter((op) => op.version >= fromVersion)
      .sort((a, b) => a.version - b.version);
  }

  async applyOperations(operations: Operation[]): Promise<void> {
    // This would integrate with the plot board store to apply operations
    // For now, just log the operations
    trace('LocalCollaborationStorage', 'Applying operations', { count: operations.length });

    for (const operation of operations) {
      // In a real implementation, this would apply the operation to the board state
      trace('LocalCollaborationStorage', 'Operation applied', {
        type: operation.type,
        targetId: operation.targetId,
      });
    }
  }

  // Session management
  async createSession(session: CollaborativeSession): Promise<void> {
    await this.setItem(`session-${session.boardId}`, session);
  }

  async updateSession(sessionId: string, updates: Partial<CollaborativeSession>): Promise<void> {
    const session = await this.getItem<CollaborativeSession>(`session-${sessionId}`);
    if (session) {
      Object.assign(session, updates);
      await this.setItem(`session-${sessionId}`, session);
    }
  }

  async getActiveSession(boardId: string): Promise<CollaborativeSession | null> {
    return await this.getItem<CollaborativeSession>(`session-${boardId}`);
  }

  // Synchronization
  async getSyncState(boardId: string): Promise<SyncState | null> {
    return await this.getItem<SyncState>(`sync-${boardId}`);
  }

  async updateSyncState(syncState: SyncState): Promise<void> {
    await this.setItem(`sync-${syncState.boardId}`, syncState);
  }

  // Connection management
  async getConnectionState(): Promise<ConnectionState> {
    const state = await this.getItem<ConnectionState>('connection-state');
    return (
      state || {
        status: ConnectionStatus.DISCONNECTED,
        reconnectAttempts: 0,
        maxReconnectAttempts: 5,
        isAuthenticated: false,
      }
    );
  }

  async updateConnectionState(state: ConnectionState): Promise<void> {
    await this.setItem('connection-state', state);
  }

  // Board sharing
  async createSharedBoard(sharedBoard: SharedBoard): Promise<void> {
    await this.setItem(`shared-board-${sharedBoard.shareId}`, sharedBoard);
  }

  async getSharedBoard(shareId: string): Promise<SharedBoard | null> {
    return await this.getItem<SharedBoard>(`shared-board-${shareId}`);
  }

  async updateSharedBoard(shareId: string, updates: Partial<SharedBoard>): Promise<void> {
    const sharedBoard = await this.getSharedBoard(shareId);
    if (sharedBoard) {
      Object.assign(sharedBoard, updates);
      await this.setItem(`shared-board-${shareId}`, sharedBoard);
    }
  }

  // Comments
  async saveComment(comment: CardComment): Promise<void> {
    await this.addToList(`comments-${comment.cardId}`, comment);
  }

  async getComments(cardId: string): Promise<CardComment[]> {
    const comments = await this.getList<CardComment>(`comments-${cardId}`);
    return comments
      .filter((comment) => !comment.isDeleted)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async updateComment(commentId: string, updates: Partial<CardComment>): Promise<void> {
    // Simplified - would need to find which card the comment belongs to
    const allComments = (await this.getItem<CardComment[]>('all-comments')) || [];
    const comment = allComments.find((c) => c.id === commentId);

    if (comment) {
      Object.assign(comment, updates);
      comment.updatedAt = new Date().toISOString();
      comment.isEdited = true;
      await this.setItem('all-comments', allComments);
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.updateComment(commentId, { isDeleted: true });
  }
}

/* ========= Network Storage Adapter (Future Implementation) ========= */

export class NetworkCollaborationStorage implements CollaborationStorageAdapter {
  private baseUrl: string;
  private authToken?: string;
  private websocket?: WebSocket;

  constructor(baseUrl: string, authToken?: string) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  // These would be implemented to communicate with a collaboration server
  async getCurrentUser(): Promise<CollaborativeUser | null> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async getUserById(userId: string): Promise<CollaborativeUser | null> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async getWorkspaceUsers(workspaceId: string): Promise<CollaborativeUser[]> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async updateUser(user: CollaborativeUser): Promise<void> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async updateUserPresence(userId: string, presence: any): Promise<void> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async publishEvent(event: CollaborativeEvent): Promise<void> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  subscribeToEvents(boardId: string, callback: (event: CollaborativeEvent) => void): () => void {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async getEventHistory(boardId: string, fromVersion?: number): Promise<CollaborativeEvent[]> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async saveConflict(conflict: CollaborativeConflict): Promise<void> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async getConflicts(boardId: string): Promise<CollaborativeConflict[]> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async resolveConflict(conflictId: string, resolution: any): Promise<void> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async saveOperation(operation: Operation): Promise<void> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async getOperations(boardId: string, fromVersion?: number): Promise<Operation[]> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async applyOperations(operations: Operation[]): Promise<void> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async createSession(session: CollaborativeSession): Promise<void> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async updateSession(sessionId: string, updates: Partial<CollaborativeSession>): Promise<void> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async getActiveSession(boardId: string): Promise<CollaborativeSession | null> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async getSyncState(boardId: string): Promise<SyncState | null> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async updateSyncState(syncState: SyncState): Promise<void> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async getConnectionState(): Promise<ConnectionState> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async updateConnectionState(state: ConnectionState): Promise<void> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async createSharedBoard(sharedBoard: SharedBoard): Promise<void> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async getSharedBoard(shareId: string): Promise<SharedBoard | null> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async updateSharedBoard(shareId: string, updates: Partial<SharedBoard>): Promise<void> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async saveComment(comment: CardComment): Promise<void> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async getComments(cardId: string): Promise<CardComment[]> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async updateComment(commentId: string, updates: Partial<CardComment>): Promise<void> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }

  async deleteComment(commentId: string): Promise<void> {
    throw new Error('NetworkCollaborationStorage not implemented yet');
  }
}

/* ========= Collaboration Manager ========= */

export class CollaborationManager {
  private storage: CollaborationStorageAdapter;
  private syncOptions: SyncOptions;
  private syncInterval?: NodeJS.Timeout;
  private eventQueue: CollaborativeEvent[] = [];

  constructor(storage: CollaborationStorageAdapter, options: Partial<SyncOptions> = {}) {
    this.storage = storage;
    this.syncOptions = {
      autoSync: true,
      syncInterval: 5000,
      conflictResolution: 'manual',
      maxRetries: 3,
      offlineQueueLimit: 100,
      ...options,
    };

    if (this.syncOptions.autoSync) {
      this.startAutoSync();
    }
  }

  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      await this.processEventQueue();
    }, this.syncOptions.syncInterval);
  }

  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];

      for (const event of events) {
        await this.storage.publishEvent(event);
      }

      trace('CollaborationManager', 'Event queue processed', { count: events.length });
    } catch (error) {
      trace('CollaborationManager', 'Failed to process event queue', { error });
      // Re-queue events for retry (up to limit)
      if (this.eventQueue.length < this.syncOptions.offlineQueueLimit) {
        this.eventQueue.unshift(...this.eventQueue);
      }
    }
  }

  async publishEvent(event: CollaborativeEvent): Promise<void> {
    if (this.syncOptions.autoSync) {
      this.eventQueue.push(event);
    } else {
      await this.storage.publishEvent(event);
    }
  }

  async hasPermission(userId: string, permission: Permission, boardId?: string): Promise<boolean> {
    const user = await this.storage.getUserById(userId);
    return user?.permissions.includes(permission) || false;
  }

  dispose(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// Export default local storage instance
export const collaborationStorage = new LocalCollaborationStorage();
export const collaborationManager = new CollaborationManager(collaborationStorage);
