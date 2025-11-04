import {
  BookOpen,
  Video,
  MessageSquare,
  Sparkles,
  RotateCw,
  Wand2,
  FileDown,
  PlayCircle,
} from 'lucide-react';
import React from 'react';

import devLog from '@/utils/devLog';
import { Button } from '../ui/Button';

interface HelpMenuProps {
  className?: string;
}

// Temporary stub - will be replaced in Phase 2
function startTourByKey(_key: 'core' | 'ai-tools' | 'export') {
  console.warn('[HelpMenu] Tour system being rebuilt - feature temporarily unavailable');
}

export function HelpMenu({ className }: HelpMenuProps) {
  const lastTourUsed = null; // Temporary - will be restored in Phase 2

  const startSpotlightTour = () => {
    console.warn('[HelpMenu] Tour system being rebuilt');
  };

  const handleManualTourStart = () => {
    devLog.debug('[HelpMenu] Tour system being rebuilt');
  };

  const handleRestartLastTour = () => {
    if (lastTourUsed) {
      startTourByKey(lastTourUsed);
    } else {
      // Fallback to default tour
      handleRestartTour();
    }
  };

  const handleRestartTour = () => {
    console.warn('[HelpMenu] Tour system being rebuilt');
  };

  // Get button label for last tour
  const getLastTourLabel = (): string => {
    return 'Restart Tour';
  };

  return (
    <div className={className}>
      <div className="flex flex-col space-y-2">
        {/* Manual Recovery Button - Always visible for quick tour fixes */}
        <Button
          variant="ghost"
          size="sm"
          className="justify-start text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950"
          onClick={handleManualTourStart}
          title="Force start the tour if it's stuck or not appearing"
        >
          <PlayCircle className="w-4 h-4 mr-2" />
          Start Tour
        </Button>
        {lastTourUsed && (
          <Button
            variant="ghost"
            size="sm"
            className="justify-start font-semibold"
            onClick={handleRestartLastTour}
          >
            <RotateCw className="w-4 h-4 mr-2" />
            {getLastTourLabel()}
          </Button>
        )}
        <Button variant="ghost" size="sm" className="justify-start" onClick={handleRestartTour}>
          <RotateCw className="w-4 h-4 mr-2" />
          Restart Core Tour
        </Button>
        <Button variant="ghost" size="sm" className="justify-start" onClick={startSpotlightTour}>
          <Sparkles className="w-4 h-4 mr-2" />
          Feature Tour
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start"
          onClick={() => window.open('https://docs.inkwell.app', '_blank')}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Documentation
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start"
          onClick={() => window.open('https://tutorials.inkwell.app', '_blank')}
        >
          <Video className="w-4 h-4 mr-2" />
          Video Tutorials
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start"
          onClick={() => window.open('https://support.inkwell.app', '_blank')}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Support
        </Button>
      </div>
    </div>
  );
}
