import { Wrench, BarChart, HelpCircle } from 'lucide-react';
import React, { useState, useRef } from 'react';

import { analyticsService } from '../../services/analyticsService';
import { Badge } from '../ui/badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

import { HelpMenu } from './HelpMenu';

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

const powerTools: PowerTool[] = [
  {
    id: 'plot-analyzer',
    name: 'Plot Analysis',
    description: 'Analyze story structure and pacing',
    icon: BarChart,
    category: 'analysis',
    keywords: ['plot', 'story', 'analysis', 'structure'],
    isPro: true,
    onClick: () => analyticsService.track('power_tool_used', { tool: 'plot-analyzer' }),
  },
  // ... other tools ...
];

export function PowerToolsMenu({ projectId: _projectId, onToolSelect }: PowerToolsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const helpTriggerRef = useRef<HTMLButtonElement>(null);

  const showPowerMenu = true; // Always show power menu

  const handleHelpClick = () => {
    setHelpOpen(!helpOpen);
    // Close main tools menu when help menu opens
    if (!helpOpen) setIsOpen(false);
  };

  const onMainClose = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  const onHelpClose = () => {
    setHelpOpen(false);
  };

  // Help button (always visible)
  const HelpButton = (
    <Button
      variant="ghost"
      size="sm"
      className="justify-start w-full"
      onClick={handleHelpClick}
      ref={helpTriggerRef}
    >
      <HelpCircle className="w-4 h-4 mr-2" />
      Help & Support
    </Button>
  );

  // Help popover
  const helpPopover = (
    <Popover open={helpOpen} onOpenChange={setHelpOpen}>
      <PopoverTrigger asChild>{HelpButton}</PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <HelpMenu />
      </PopoverContent>
    </Popover>
  );

  // Filter tools by search query
  const filteredTools = powerTools.filter((tool) => {
    const searchTerms = searchQuery.toLowerCase().split(' ');
    const searchableText =
      `${tool.name} ${tool.description} ${tool.keywords.join(' ')}`.toLowerCase();
    return searchTerms.every((term) => searchableText.includes(term));
  });

  if (!showPowerMenu) return null;

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Wrench className="w-4 h-4" />
              Tools
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="space-y-4">
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              <div className="space-y-2">
                {filteredTools.map((tool) => (
                  <Button
                    key={tool.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      tool.onClick();
                      onToolSelect?.(tool.id);
                      onMainClose();
                    }}
                  >
                    <tool.icon className="w-4 h-4 mr-2" />
                    <span>{tool.name}</span>
                    {tool.isNew && (
                      <Badge variant="secondary" className="ml-2">
                        New
                      </Badge>
                    )}
                    {tool.isPro && (
                      <Badge variant="outline" className="ml-2">
                        Pro
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Help Menu */}
        {helpPopover}
      </div>
    </div>
  );
}
