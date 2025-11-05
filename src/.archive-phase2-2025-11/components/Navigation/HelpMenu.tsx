import { BookOpen, Video, MessageSquare, PlayCircle } from 'lucide-react';
import React from 'react';

import { useTourContext } from '@/components/Tour/TourProvider';
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
  const { start } = useTourContext();

  const handleStartTour = () => {
    devLog.debug('[HelpMenu] Starting tour');
    start();
  };

  return (
    <div className={className}>
      <div className="flex flex-col space-y-2">
        {/* Manual Recovery Button - Always visible for quick tour fixes */}
        <Button
          variant="ghost"
          size="sm"
          className="justify-start text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950"
          onClick={handleStartTour}
          title="Start the guided tour of Inkwell"
        >
          <PlayCircle className="w-4 h-4 mr-2" />
          Start Tour
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
