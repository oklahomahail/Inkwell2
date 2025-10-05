// User Avatar Component for Plot Boards Collaboration
// Displays user avatars with presence indicators and activity status

import React from 'react';

import { CollaborativeUser, UserActivity, ActivityType } from '../../collaboration/types';

interface UserAvatarProps {
  user: CollaborativeUser;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPresence?: boolean;
  showActivity?: boolean;
  showTooltip?: boolean;
  onClick?: (user: CollaborativeUser) => void;
  className?: string;
}

const AVATAR_SIZES = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
  xl: 'w-12 h-12 text-lg',
};

const PRESENCE_COLORS = {
  online: 'bg-green-400',
  offline: 'bg-gray-400',
  idle: 'bg-yellow-400',
  busy: 'bg-red-400',
};

const ACTIVITY_ICONS = {
  [ActivityType.VIEWING_BOARD]: '👁️',
  [ActivityType.EDITING_CARD]: '✏️',
  [ActivityType.MOVING_CARD]: '↔️',
  [ActivityType.CREATING_CARD]: '➕',
  [ActivityType.EDITING_COLUMN]: '📝',
  [ActivityType.CREATING_VIEW]: '🔍',
  [ActivityType.IDLE]: '💤',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  showPresence = true,
  showActivity = false,
  showTooltip = true,
  onClick,
  className = '',
}) => {
  const [showTooltipState, setShowTooltipState] = React.useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPresenceStatus = () => {
    if (!user.presence) return 'offline';
    if (user.presence.isOnline) {
      if (user.presence.currentActivity?.type === ActivityType.IDLE) {
        return 'idle';
      }
      return 'online';
    }
    return 'offline';
  };

  const getActivityDescription = (activity?: UserActivity) => {
    if (!activity) return 'No recent activity';

    const descriptions = {
      [ActivityType.VIEWING_BOARD]: 'Viewing board',
      [ActivityType.EDITING_CARD]: 'Editing a card',
      [ActivityType.MOVING_CARD]: 'Moving cards',
      [ActivityType.CREATING_CARD]: 'Creating a card',
      [ActivityType.EDITING_COLUMN]: 'Editing a column',
      [ActivityType.CREATING_VIEW]: 'Creating a view',
      [ActivityType.IDLE]: 'Idle',
    };

    return descriptions[activity.type] || 'Active';
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const presenceStatus = getPresenceStatus();
  const isClickable = onClick !== undefined;

  return (
    <div className="relative inline-block">
      <div
        className={`
          relative rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
          flex items-center justify-center text-white font-medium
          ${AVATAR_SIZES[size]}
          ${isClickable ? 'cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all' : ''}
          ${className}
        `}
        onClick={() => onClick?.(user)}
        onMouseEnter={() => setShowTooltipState(true)}
        onMouseLeave={() => setShowTooltipState(false)}
        title={showTooltip ? `${user.displayName} (${user.role})` : undefined}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.displayName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="select-none">{getInitials(user.displayName)}</span>
        )}

        {/* Presence Indicator */}
        {showPresence && (
          <div
            className={`
              absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white
              ${PRESENCE_COLORS[presenceStatus]}
              ${size === 'sm' ? 'w-2 h-2' : ''}
              ${size === 'xl' ? 'w-4 h-4' : ''}
            `}
          />
        )}

        {/* Activity Indicator */}
        {showActivity && user.presence?.currentActivity && presenceStatus === 'online' && (
          <div
            className={`
              absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white 
              flex items-center justify-center text-xs shadow-sm
              ${size === 'sm' ? 'w-4 h-4' : ''}
              ${size === 'xl' ? 'w-6 h-6' : ''}
            `}
          >
            {ACTIVITY_ICONS[user.presence.currentActivity.type] || '⚡'}
          </div>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && showTooltipState && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-sm rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
            <div className="font-medium">{user.displayName}</div>
            <div className="text-gray-300 text-xs">{user.role}</div>
            {user.presence && (
              <div className="text-gray-400 text-xs mt-1">
                {user.presence.isOnline ? (
                  <>
                    <div>{getActivityDescription(user.presence.currentActivity)}</div>
                    {user.presence.currentActivity && (
                      <div>Last active: {formatLastSeen(user.presence.lastSeen)}</div>
                    )}
                  </>
                ) : (
                  <div>Last seen: {formatLastSeen(user.presence.lastSeen)}</div>
                )}
              </div>
            )}
            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ========= User Avatar Group Component ========= */

interface UserAvatarGroupProps {
  users: CollaborativeUser[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPresence?: boolean;
  showActivity?: boolean;
  onUserClick?: (user: CollaborativeUser) => void;
  onViewAll?: () => void;
  className?: string;
}

export const UserAvatarGroup: React.FC<UserAvatarGroupProps> = ({
  users,
  maxVisible = 5,
  size = 'md',
  showPresence = true,
  showActivity = false,
  onUserClick,
  onViewAll,
  className = '',
}) => {
  const visibleUsers = users.slice(0, maxVisible);
  const hiddenCount = Math.max(0, users.length - maxVisible);

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex -space-x-2">
        {visibleUsers.map((user, index) => (
          <div key={user.id} className="relative" style={{ zIndex: visibleUsers.length - index }}>
            <UserAvatar
              user={user}
              size={size}
              showPresence={showPresence}
              showActivity={showActivity}
              onClick={onUserClick}
              className="border-2 border-white"
            />
          </div>
        ))}

        {hiddenCount > 0 && (
          <div
            className={`
              relative rounded-full bg-gray-200 border-2 border-white
              flex items-center justify-center text-gray-600 font-medium
              ${AVATAR_SIZES[size]}
              ${onViewAll ? 'cursor-pointer hover:bg-gray-300 transition-colors' : ''}
            `}
            onClick={onViewAll}
            title={`+${hiddenCount} more users`}
          >
            +{hiddenCount}
          </div>
        )}
      </div>

      {/* Online Users Count */}
      <div className="ml-3 text-sm text-gray-600">
        <span className="font-medium">{users.filter((u) => u.presence?.isOnline).length}</span>
        <span className="text-gray-500"> online</span>
      </div>
    </div>
  );
};

/* ========= User Status Badge Component ========= */

interface UserStatusBadgeProps {
  user: CollaborativeUser;
  variant?: 'compact' | 'detailed';
  className?: string;
}

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({
  user,
  variant = 'compact',
  className = '',
}) => {
  const presenceStatus = user.presence?.isOnline ? 'online' : 'offline';

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        <UserAvatar user={user} size="sm" showPresence showActivity />
        <span className="text-sm font-medium text-gray-900">{user.displayName}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 p-3 bg-white rounded-lg border ${className}`}>
      <UserAvatar user={user} size="md" showPresence showActivity />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 truncate">{user.displayName}</p>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${PRESENCE_COLORS[presenceStatus]}`} />
            <span className="text-xs text-gray-500 capitalize">{presenceStatus}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">{user.role}</p>
        {user.presence?.currentActivity && (
          <p className="text-xs text-gray-400 mt-1">
            {ACTIVITY_ICONS[user.presence.currentActivity.type]}{' '}
            {getActivityDescription(user.presence.currentActivity)}
          </p>
        )}
      </div>
    </div>
  );
};

// Helper function for activity descriptions (moved outside component for reuse)
function getActivityDescription(activity?: UserActivity) {
  if (!activity) return 'No recent activity';

  const descriptions = {
    [ActivityType.VIEWING_BOARD]: 'Viewing board',
    [ActivityType.EDITING_CARD]: 'Editing a card',
    [ActivityType.MOVING_CARD]: 'Moving cards',
    [ActivityType.CREATING_CARD]: 'Creating a card',
    [ActivityType.EDITING_COLUMN]: 'Editing a column',
    [ActivityType.CREATING_VIEW]: 'Creating a view',
    [ActivityType.IDLE]: 'Idle',
  };

  return descriptions[activity.type] || 'Active';
}
