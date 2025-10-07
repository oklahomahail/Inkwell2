// src/components/Navigation/PowerToolsMenu.tsx
// Updated to resolve TypeScript compilation errors
import {
  Wrench,
  Search,
  Clock,
  Users,
  GitBranch,
  FileText,
  Upload,
  Download,
  BarChart,
  Settings,
  Zap,
  Map,
} from 'lucide-react';
import React, { useState, useRef } from 'react';

import { analyticsService } from '../../services/analyticsService';
import { featureFlagService } from '../../services/featureFlagService';
import { Badge } from '../ui/badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface PowerTool {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'structure' | 'analysis' | 'collaboration' | 'data' | 'advanced';
  keywords: string[];
  isNew?: boolean;
  isPro?: boolean;
  onClick: () => void;
}

interface PowerToolsMenuProps {
  projectId?: string;
  onToolSelect?: (toolId: string) => void;
}

export function PowerToolsMenu({ projectId, onToolSelect }: PowerToolsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Check if power tools menu should be shown
  const showPowerMenu = featureFlagService.isEnabled('ui_showPowerMenu');

  if (!showPowerMenu) {
    return null;
  }

  const tools: PowerTool[] = [
    // Structure tools
    {
      id: 'plot-boards',
      name: 'Plot Boards',
      description: 'Kanban-style story organization with drag-and-drop scenes',
      icon: GitBranch,
      category: 'structure',
      keywords: ['plot', 'structure', 'kanban', 'scenes', 'organize'],
      onClick: () => handleToolClick('plot-boards', '/plot-boards'),
    },
    {
      id: 'timeline',
      name: 'Timeline',
      description: 'Visual timeline with POV lanes and conflict detection',
      icon: Clock,
      category: 'structure',
      keywords: ['timeline', 'chronology', 'events', 'pov', 'sequence'],
      onClick: () => handleToolClick('timeline', '/timeline'),
    },
    {
      id: 'story-architect',
      name: 'Story Architect',
      description: 'AI-powered story outline generation and templates',
      icon: Map,
      category: 'structure',
      keywords: ['outline', 'architect', 'structure', 'ai', 'generate'],
      isNew: true,
      onClick: () => handleToolClick('story-architect', '/story-architect'),
    },

    // Analysis tools
    {
      id: 'characters-advanced',
      name: 'Character Bible',
      description: 'Advanced character development with relationships and arcs',
      icon: Users,
      category: 'analysis',
      keywords: ['characters', 'bible', 'development', 'relationships', 'arcs'],
      onClick: () => handleToolClick('characters-advanced', '/characters'),
    },
    {
      id: 'consistency-guardian',
      name: 'Consistency Guardian',
      description: 'AI-powered consistency checking across your story',
      icon: Zap,
      category: 'analysis',
      keywords: ['consistency', 'ai', 'check', 'validation', 'errors'],
      isNew: true,
      onClick: () => handleToolClick('consistency-guardian', '/consistency'),
    },
    {
      id: 'analytics-advanced',
      name: 'Writing Analytics',
      description: 'Deep insights into your writing patterns and progress',
      icon: BarChart,
      category: 'analysis',
      keywords: ['analytics', 'insights', 'patterns', 'progress', 'stats'],
      onClick: () => handleToolClick('analytics-advanced', '/analytics'),
    },

    // Data tools
    {
      id: 'templates-editor',
      name: 'Template Editor',
      description: 'Create and customize project templates',
      icon: FileText,
      category: 'data',
      keywords: ['templates', 'create', 'customize', 'editor'],
      isPro: true,
      onClick: () => handleToolClick('templates-editor', '/templates'),
    },
    {
      id: 'bulk-import',
      name: 'Bulk Import',
      description: 'Import multiple documents or existing projects',
      icon: Upload,
      category: 'data',
      keywords: ['import', 'bulk', 'documents', 'migrate'],
      isPro: true,
      onClick: () => handleToolClick('bulk-import', '/import'),
    },
    {
      id: 'advanced-export',
      name: 'Advanced Export',
      description: 'Custom export formats and batch operations',
      icon: Download,
      category: 'data',
      keywords: ['export', 'advanced', 'formats', 'batch', 'custom'],
      onClick: () => handleToolClick('advanced-export', '/export-advanced'),
    },

    // Advanced tools
    {
      id: 'custom-structures',
      name: 'Custom Structures',
      description: 'Create your own story organization systems',
      icon: Settings,
      category: 'advanced',
      keywords: ['custom', 'structures', 'organization', 'systems'],
      isPro: true,
      onClick: () => handleToolClick('custom-structures', '/structures'),
    },
  ];

  const handleToolClick = (toolId: string, route?: string) => {
    // Track power tool usage
    analyticsService.track('power_tool_used', {
      tool: toolId,
      success: true,
      projectId,
    });

    // Track friction indicator if user is in first draft path
    if (projectId) {
      analyticsService.track('POWER_TOOLS_BEFORE_DRAFT', {
        projectId,
        templateId: toolId,
        from: 'menu',
      });
    }

    setIsOpen(false);
    setSearchQuery('');
    onToolSelect?.(toolId);

    // Navigate to route if provided
    if (route) {
      // This would use your routing system
      console.log(`Navigate to: ${route}`);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Focus search input when menu opens
      setTimeout(() => searchInputRef.current?.focus(), 100);

      // Track power menu opened
      analyticsService.track('power_menu_opened', {
        source: 'click',
        projectId,
      });
    } else {
      setSearchQuery('');
    }
  };

  const filteredTools = tools.filter((tool) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.keywords.some((keyword) => keyword.includes(query))
    );
  });

  const groupedTools = filteredTools.reduce(
    (acc, tool) => {
      if (!acc[tool.category]) acc[tool.category] = [];
      acc[tool.category]!.push(tool);
      return acc;
    },
    {} as Record<string, PowerTool[]>,
  );

  const categoryLabels = {
    structure: 'Story Structure',
    analysis: 'Analysis & Insights',
    collaboration: 'Collaboration',
    data: 'Data & Templates',
    advanced: 'Advanced Features',
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 px-3" aria-label="Power Tools">
          <Wrench className="w-4 h-4 mr-2" />
          Power Tools
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end" side="bottom">
        {/* Header */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Power Tools</h3>
            <Badge variant="secondary" className="text-xs">
              {filteredTools.length} tools
            </Badge>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              ref={searchInputRef}
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-8"
            />
          </div>
        </div>

        {/* Tools list */}
        <div className="max-h-80 overflow-y-auto">
          {Object.entries(groupedTools).length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No tools found for "{searchQuery}"</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            Object.entries(groupedTools).map(([category, categoryTools]) => (
              <div key={category} className="py-2">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </div>

                <div className="space-y-1">
                  {categoryTools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={tool.onClick}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <tool.icon className="w-4 h-4 text-gray-600" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 text-sm">{tool.name}</span>

                            {tool.isNew && (
                              <Badge variant="default" className="text-xs px-1 py-0">
                                New
                              </Badge>
                            )}

                            {tool.isPro && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                Pro
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-gray-600 mt-1">{tool.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Press / to focus search</span>
            <button
              onClick={() => handleToolClick('settings-advanced')}
              className="text-blue-600 hover:text-blue-700"
            >
              Advanced Settings →
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Compact version for smaller spaces
export function PowerToolsButton({
  projectId,
  onToolSelect,
  size: _size = 'sm',
}: PowerToolsMenuProps & { size?: 'sm' | 'xs' }) {
  const showPowerMenu = featureFlagService.isEnabled('ui_showPowerMenu');

  if (!showPowerMenu) {
    return null;
  }

  const handleClick = () => {
    analyticsService.track('power_tools_quick_access', {
      source: 'click',
      projectId,
    });

    // Open a simplified tools menu or navigate to tools page
    onToolSelect?.('quick-access');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="h-8 w-8 p-0"
      title="Power Tools"
    >
      <Wrench className="w-4 h-4" />
    </Button>
  );
}

// Hook for keyboard shortcut support
export function usePowerToolsShortcuts() {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + P to open Power Tools
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'P') {
        event.preventDefault();

        analyticsService.track('power_menu_opened', {
          source: 'keyboard',
        });

        // Trigger power tools menu open
        const powerToolsButton = document.querySelector(
          '[aria-label="Power Tools"]',
        ) as HTMLButtonElement;
        powerToolsButton?.click();
      }

      // Forward slash to focus search when menu is open
      if (event.key === '/' && document.querySelector('[placeholder="Search tools..."]')) {
        event.preventDefault();
        const searchInput = document.querySelector(
          '[placeholder="Search tools..."]',
        ) as HTMLInputElement;
        searchInput?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
