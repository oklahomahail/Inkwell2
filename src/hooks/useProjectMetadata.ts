// src/hooks/useProjectMetadata.ts
import { useState, useEffect, useCallback } from 'react';

export interface ProjectMetadata {
  projectId: string;
  isFavorite: boolean;
  tags: string[];
  lastOpened: number;
  openCount: number;
  totalTimeSpent: number; // in minutes
  customColor?: string;
  notes?: string;
}

interface ProjectMetadataState {
  [projectId: string]: ProjectMetadata;
}

const STORAGE_KEY = 'inkwell-project-metadata';

export const useProjectMetadata = () => {
  const [metadata, setMetadata] = useState<ProjectMetadataState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Failed to load project metadata:', error);
      return {};
    }
  });

  // Save to localStorage whenever metadata changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.warn('Failed to save project metadata:', error);
    }
  }, [metadata]);

  // Get metadata for a specific project
  const getProjectMetadata = useCallback(
    (projectId: string): ProjectMetadata => {
      return (
        metadata[projectId] || {
          projectId,
          isFavorite: false,
          tags: [],
          lastOpened: 0,
          openCount: 0,
          totalTimeSpent: 0,
        }
      );
    },
    [metadata],
  );

  // Toggle favorite status
  const toggleFavorite = useCallback(
    (projectId: string) => {
      setMetadata((prev) => ({
        ...prev,
        [projectId]: {
          ...getProjectMetadata(projectId),
          isFavorite: !prev[projectId]?.isFavorite,
        },
      }));
    },
    [getProjectMetadata],
  );

  // Add a tag to a project
  const addTag = useCallback(
    (projectId: string, tag: string) => {
      const normalizedTag = tag.trim().toLowerCase();
      if (!normalizedTag) return;

      setMetadata((prev) => {
        const current = getProjectMetadata(projectId);
        if (current.tags.includes(normalizedTag)) return prev;

        return {
          ...prev,
          [projectId]: {
            ...current,
            tags: [...current.tags, normalizedTag],
          },
        };
      });
    },
    [getProjectMetadata],
  );

  // Remove a tag from a project
  const removeTag = useCallback(
    (projectId: string, tag: string) => {
      setMetadata((prev) => {
        const current = getProjectMetadata(projectId);
        return {
          ...prev,
          [projectId]: {
            ...current,
            tags: current.tags.filter((t) => t !== tag),
          },
        };
      });
    },
    [getProjectMetadata],
  );

  // Set multiple tags at once
  const setTags = useCallback(
    (projectId: string, tags: string[]) => {
      const normalizedTags = tags
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0)
        .filter((tag, index, array) => array.indexOf(tag) === index); // Remove duplicates

      setMetadata((prev) => ({
        ...prev,
        [projectId]: {
          ...getProjectMetadata(projectId),
          tags: normalizedTags,
        },
      }));
    },
    [getProjectMetadata],
  );

  // Record project open
  const recordProjectOpen = useCallback(
    (projectId: string) => {
      setMetadata((prev) => {
        const current = getProjectMetadata(projectId);
        return {
          ...prev,
          [projectId]: {
            ...current,
            lastOpened: Date.now(),
            openCount: current.openCount + 1,
          },
        };
      });
    },
    [getProjectMetadata],
  );

  // Add time spent writing
  const addTimeSpent = useCallback(
    (projectId: string, minutes: number) => {
      if (minutes <= 0) return;

      setMetadata((prev) => {
        const current = getProjectMetadata(projectId);
        return {
          ...prev,
          [projectId]: {
            ...current,
            totalTimeSpent: current.totalTimeSpent + minutes,
          },
        };
      });
    },
    [getProjectMetadata],
  );

  // Set custom color for project
  const setProjectColor = useCallback(
    (projectId: string, color?: string) => {
      setMetadata((prev) => ({
        ...prev,
        [projectId]: {
          ...getProjectMetadata(projectId),
          customColor: color,
        },
      }));
    },
    [getProjectMetadata],
  );

  // Set project notes
  const setProjectNotes = useCallback(
    (projectId: string, notes?: string) => {
      setMetadata((prev) => ({
        ...prev,
        [projectId]: {
          ...getProjectMetadata(projectId),
          notes: notes?.trim() || undefined,
        },
      }));
    },
    [getProjectMetadata],
  );

  // Get all unique tags across all projects
  const getAllTags = useCallback((): string[] => {
    const allTags = new Set<string>();
    Object.values(metadata).forEach((meta) => {
      meta.tags.forEach((tag) => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  }, [metadata]);

  // Get favorite projects
  const getFavoriteProjectIds = useCallback((): string[] => {
    return Object.values(metadata)
      .filter((meta) => meta.isFavorite)
      .map((meta) => meta.projectId);
  }, [metadata]);

  // Get recently opened projects
  const getRecentlyOpenedProjectIds = useCallback((): string[] => {
    return Object.values(metadata)
      .filter((meta) => meta.lastOpened > 0)
      .sort((a, b) => b.lastOpened - a.lastOpened)
      .map((meta) => meta.projectId);
  }, [metadata]);

  // Get projects by tag
  const getProjectIdsByTag = useCallback(
    (tag: string): string[] => {
      return Object.values(metadata)
        .filter((meta) => meta.tags.includes(tag.toLowerCase()))
        .map((meta) => meta.projectId);
    },
    [metadata],
  );

  // Clean up metadata for projects that no longer exist
  const cleanupMetadata = useCallback((existingProjectIds: string[]) => {
    setMetadata((prev) => {
      const cleaned: ProjectMetadataState = {};
      existingProjectIds.forEach((projectId) => {
        if (prev[projectId]) {
          cleaned[projectId] = prev[projectId];
        }
      });
      return cleaned;
    });
  }, []);

  // Get usage statistics
  const getUsageStats = useCallback(() => {
    const stats = Object.values(metadata);
    const totalProjects = stats.length;
    const favoriteCount = stats.filter((meta) => meta.isFavorite).length;
    const totalTimeSpent = stats.reduce((sum, meta) => sum + meta.totalTimeSpent, 0);
    const totalOpens = stats.reduce((sum, meta) => sum + meta.openCount, 0);
    const uniqueTags = getAllTags().length;

    return {
      totalProjects,
      favoriteCount,
      totalTimeSpent,
      totalOpens,
      uniqueTags,
      averageTimePerProject: totalProjects > 0 ? totalTimeSpent / totalProjects : 0,
      averageOpensPerProject: totalProjects > 0 ? totalOpens / totalProjects : 0,
    };
  }, [metadata, getAllTags]);

  return {
    // Data access
    getProjectMetadata,
    getAllTags,
    getFavoriteProjectIds,
    getRecentlyOpenedProjectIds,
    getProjectIdsByTag,
    getUsageStats,

    // Mutations
    toggleFavorite,
    addTag,
    removeTag,
    setTags,
    recordProjectOpen,
    addTimeSpent,
    setProjectColor,
    setProjectNotes,
    cleanupMetadata,

    // Raw data (for debugging)
    metadata,
  };
};

// Utility functions for working with project metadata
export const formatTimeSpent = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
};

export const getProjectColorClass = (color?: string): string => {
  if (!color) return 'bg-slate-100 dark:bg-slate-700';

  const colorMap: Record<string, string> = {
    red: 'bg-red-100 dark:bg-red-900/30',
    orange: 'bg-orange-100 dark:bg-orange-900/30',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30',
    green: 'bg-green-100 dark:bg-green-900/30',
    blue: 'bg-blue-100 dark:bg-blue-900/30',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30',
    purple: 'bg-purple-100 dark:bg-purple-900/30',
    pink: 'bg-pink-100 dark:bg-pink-900/30',
  };

  return colorMap[color] || 'bg-slate-100 dark:bg-slate-700';
};

export const getRelativeTimeString = (timestamp: number): string => {
  if (timestamp === 0) return 'Never';

  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;

  return new Date(timestamp).toLocaleDateString();
};
