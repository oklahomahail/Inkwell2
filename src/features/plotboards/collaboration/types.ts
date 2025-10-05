// Collaboration Data Structures for Plot Boards
// Multi-user collaboration types, permissions, and real-time updates

/* ========= User Management ========= */

export interface CollaborativeUser {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatar?: string;
  role: UserRole;
  permissions: Permission[];
  status: UserStatus;
  presence?: UserPresence;
  metadata: UserMetadata;
}

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  GUEST = 'guest',
}

export enum Permission {
  // Board permissions
  CREATE_BOARD = 'create_board',
  DELETE_BOARD = 'delete_board',
  UPDATE_BOARD = 'update_board',
  VIEW_BOARD = 'view_board',

  // Column permissions
  CREATE_COLUMN = 'create_column',
  DELETE_COLUMN = 'delete_column',
  UPDATE_COLUMN = 'update_column',
  REORDER_COLUMNS = 'reorder_columns',

  // Card permissions
  CREATE_CARD = 'create_card',
  DELETE_CARD = 'delete_card',
  UPDATE_CARD = 'update_card',
  MOVE_CARD = 'move_card',

  // View permissions
  CREATE_VIEW = 'create_view',
  DELETE_VIEW = 'delete_view',
  UPDATE_VIEW = 'update_view',
  SHARE_VIEW = 'share_view',

  // Template permissions
  CREATE_TEMPLATE = 'create_template',
  DELETE_TEMPLATE = 'delete_template',
  UPDATE_TEMPLATE = 'update_template',
  SHARE_TEMPLATE = 'share_template',

  // Export/Import permissions
  EXPORT_DATA = 'export_data',
  IMPORT_DATA = 'import_data',

  // User management
  INVITE_USERS = 'invite_users',
  REMOVE_USERS = 'remove_users',
  MANAGE_PERMISSIONS = 'manage_permissions',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  INVITED = 'invited',
  SUSPENDED = 'suspended',
}

export interface UserPresence {
  isOnline: boolean;
  lastSeen: string;
  currentBoard?: string;
  currentActivity?: UserActivity;
}

export interface UserActivity {
  type: ActivityType;
  target: string; // ID of board/column/card being worked on
  details?: any;
  timestamp: string;
}

export enum ActivityType {
  VIEWING_BOARD = 'viewing_board',
  EDITING_CARD = 'editing_card',
  MOVING_CARD = 'moving_card',
  CREATING_CARD = 'creating_card',
  EDITING_COLUMN = 'editing_column',
  CREATING_VIEW = 'creating_view',
  IDLE = 'idle',
}

export interface UserMetadata {
  joinedAt: string;
  lastActive: string;
  contributionCount: number;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationSettings;
  collaboration: CollaborationPreferences;
}

export interface NotificationSettings {
  realTimeUpdates: boolean;
  cardMentions: boolean;
  boardChanges: boolean;
  newCollaborators: boolean;
  deadlineReminders: boolean;
}

export interface CollaborationPreferences {
  showPresence: boolean;
  showCursors: boolean;
  autoSaveInterval: number; // milliseconds
  conflictResolution: 'manual' | 'auto' | 'latest_wins';
}

/* ========= Real-time Updates ========= */

export interface CollaborativeEvent {
  id: string;
  type: EventType;
  source: EventSource;
  userId: string;
  boardId: string;
  payload: any;
  timestamp: string;
  version: number;
  acknowledged?: boolean;
}

export enum EventType {
  // Board events
  BOARD_CREATED = 'board_created',
  BOARD_UPDATED = 'board_updated',
  BOARD_DELETED = 'board_deleted',

  // Column events
  COLUMN_CREATED = 'column_created',
  COLUMN_UPDATED = 'column_updated',
  COLUMN_DELETED = 'column_deleted',
  COLUMN_MOVED = 'column_moved',

  // Card events
  CARD_CREATED = 'card_created',
  CARD_UPDATED = 'card_updated',
  CARD_DELETED = 'card_deleted',
  CARD_MOVED = 'card_moved',

  // User events
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  USER_PRESENCE_UPDATED = 'user_presence_updated',

  // System events
  CONFLICT_DETECTED = 'conflict_detected',
  SYNC_REQUIRED = 'sync_required',
  CONNECTION_STATUS = 'connection_status',
}

export interface EventSource {
  type: 'user' | 'system' | 'external';
  id: string;
  metadata?: any;
}

/* ========= Conflict Resolution ========= */

export interface CollaborativeConflict {
  id: string;
  type: ConflictType;
  boardId: string;
  targetId: string; // ID of conflicted item (card, column, etc.)
  conflictingUsers: string[];
  localVersion: any;
  remoteVersion: any;
  baseVersion?: any;
  status: ConflictStatus;
  resolution?: ConflictResolution;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export enum ConflictType {
  CONCURRENT_EDIT = 'concurrent_edit',
  DELETE_CONFLICT = 'delete_conflict',
  MOVE_CONFLICT = 'move_conflict',
  PERMISSION_CONFLICT = 'permission_conflict',
  VERSION_MISMATCH = 'version_mismatch',
}

export enum ConflictStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  IGNORED = 'ignored',
  AUTO_RESOLVED = 'auto_resolved',
}

export interface ConflictResolution {
  strategy: ResolutionStrategy;
  result: any;
  mergedVersion?: any;
  notes?: string;
}

export enum ResolutionStrategy {
  KEEP_LOCAL = 'keep_local',
  KEEP_REMOTE = 'keep_remote',
  MERGE_CHANGES = 'merge_changes',
  MANUAL_MERGE = 'manual_merge',
  CREATE_DUPLICATE = 'create_duplicate',
}

/* ========= Operational Transform ========= */

export interface Operation {
  id: string;
  type: OperationType;
  userId: string;
  boardId: string;
  targetId: string;
  path: string[]; // JSON path to the changed property
  operation: OperationData;
  timestamp: string;
  version: number;
}

export enum OperationType {
  INSERT = 'insert',
  DELETE = 'delete',
  UPDATE = 'update',
  MOVE = 'move',
  REPLACE = 'replace',
}

export interface OperationData {
  oldValue?: any;
  newValue?: any;
  position?: number;
  metadata?: any;
}

/* ========= Session Management ========= */

export interface CollaborativeSession {
  id: string;
  boardId: string;
  participants: SessionParticipant[];
  status: SessionStatus;
  startedAt: string;
  endedAt?: string;
  metadata: SessionMetadata;
}

export interface SessionParticipant {
  userId: string;
  joinedAt: string;
  leftAt?: string;
  role: UserRole;
  contributionCount: number;
}

export enum SessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
}

export interface SessionMetadata {
  totalOperations: number;
  conflictsResolved: number;
  peakParticipants: number;
  averageLatency?: number;
  dataTransferred: number; // bytes
}

/* ========= Synchronization ========= */

export interface SyncState {
  boardId: string;
  localVersion: number;
  remoteVersion: number;
  lastSyncAt: string;
  pendingOperations: Operation[];
  conflictQueue: CollaborativeConflict[];
  isSyncing: boolean;
  isOnline: boolean;
}

export interface SyncOptions {
  autoSync: boolean;
  syncInterval: number;
  conflictResolution: 'manual' | 'auto';
  maxRetries: number;
  offlineQueueLimit: number;
}

/* ========= Connection Management ========= */

export interface ConnectionState {
  status: ConnectionStatus;
  latency?: number;
  lastPing?: string;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  isAuthenticated: boolean;
}

export enum ConnectionStatus {
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

/* ========= Board Sharing ========= */

export interface SharedBoard {
  boardId: string;
  shareId: string;
  shareType: ShareType;
  permissions: Permission[];
  expiresAt?: string;
  maxUsers?: number;
  currentUsers: number;
  metadata: ShareMetadata;
}

export enum ShareType {
  PRIVATE = 'private', // Only specific users
  LINK = 'link', // Anyone with link
  PUBLIC = 'public', // Publicly discoverable
  WORKSPACE = 'workspace', // Within workspace only
}

export interface ShareMetadata {
  createdBy: string;
  createdAt: string;
  lastAccessed?: string;
  accessCount: number;
  allowedDomains?: string[];
}

/* ========= Comments and Annotations ========= */

export interface CardComment {
  id: string;
  cardId: string;
  authorId: string;
  content: string;
  type: CommentType;
  parentId?: string; // For threaded comments
  mentions: string[]; // User IDs mentioned
  attachments?: CommentAttachment[];
  reactions: CommentReaction[];
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isDeleted: boolean;
}

export enum CommentType {
  COMMENT = 'comment',
  SUGGESTION = 'suggestion',
  QUESTION = 'question',
  APPROVAL = 'approval',
  CONCERN = 'concern',
}

export interface CommentAttachment {
  id: string;
  type: 'image' | 'file' | 'link';
  url: string;
  filename?: string;
  size?: number;
}

export interface CommentReaction {
  emoji: string;
  userIds: string[];
  count: number;
}

/* ========= Workspace Management ========= */

export interface CollaborativeWorkspace {
  id: string;
  name: string;
  description?: string;
  members: WorkspaceMember[];
  boards: string[]; // Board IDs
  settings: WorkspaceSettings;
  metadata: WorkspaceMetadata;
}

export interface WorkspaceMember {
  userId: string;
  role: WorkspaceRole;
  permissions: Permission[];
  joinedAt: string;
  invitedBy?: string;
}

export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest',
}

export interface WorkspaceSettings {
  defaultBoardPermissions: Permission[];
  allowGuestAccess: boolean;
  requireApprovalForNewMembers: boolean;
  dataRetentionPolicy: number; // days
  maxBoardsPerUser?: number;
}

export interface WorkspaceMetadata {
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  boardCount: number;
  memberCount: number;
  storageUsed: number; // bytes
  storageLimit?: number; // bytes
}

/* ========= Default Permission Sets ========= */

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: [
    // All permissions
    Permission.CREATE_BOARD,
    Permission.DELETE_BOARD,
    Permission.UPDATE_BOARD,
    Permission.VIEW_BOARD,
    Permission.CREATE_COLUMN,
    Permission.DELETE_COLUMN,
    Permission.UPDATE_COLUMN,
    Permission.REORDER_COLUMNS,
    Permission.CREATE_CARD,
    Permission.DELETE_CARD,
    Permission.UPDATE_CARD,
    Permission.MOVE_CARD,
    Permission.CREATE_VIEW,
    Permission.DELETE_VIEW,
    Permission.UPDATE_VIEW,
    Permission.SHARE_VIEW,
    Permission.CREATE_TEMPLATE,
    Permission.DELETE_TEMPLATE,
    Permission.UPDATE_TEMPLATE,
    Permission.SHARE_TEMPLATE,
    Permission.EXPORT_DATA,
    Permission.IMPORT_DATA,
    Permission.INVITE_USERS,
    Permission.REMOVE_USERS,
    Permission.MANAGE_PERMISSIONS,
  ],

  [UserRole.ADMIN]: [
    Permission.CREATE_BOARD,
    Permission.UPDATE_BOARD,
    Permission.VIEW_BOARD,
    Permission.CREATE_COLUMN,
    Permission.DELETE_COLUMN,
    Permission.UPDATE_COLUMN,
    Permission.REORDER_COLUMNS,
    Permission.CREATE_CARD,
    Permission.DELETE_CARD,
    Permission.UPDATE_CARD,
    Permission.MOVE_CARD,
    Permission.CREATE_VIEW,
    Permission.DELETE_VIEW,
    Permission.UPDATE_VIEW,
    Permission.SHARE_VIEW,
    Permission.CREATE_TEMPLATE,
    Permission.UPDATE_TEMPLATE,
    Permission.SHARE_TEMPLATE,
    Permission.EXPORT_DATA,
    Permission.IMPORT_DATA,
    Permission.INVITE_USERS,
  ],

  [UserRole.EDITOR]: [
    Permission.VIEW_BOARD,
    Permission.CREATE_COLUMN,
    Permission.UPDATE_COLUMN,
    Permission.REORDER_COLUMNS,
    Permission.CREATE_CARD,
    Permission.UPDATE_CARD,
    Permission.MOVE_CARD,
    Permission.CREATE_VIEW,
    Permission.UPDATE_VIEW,
    Permission.EXPORT_DATA,
  ],

  [UserRole.VIEWER]: [Permission.VIEW_BOARD, Permission.CREATE_VIEW, Permission.EXPORT_DATA],

  [UserRole.GUEST]: [Permission.VIEW_BOARD],
};
