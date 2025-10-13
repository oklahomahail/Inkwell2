import { BookOpen, Video, MessageSquare, Sparkles } from 'lucide-react';
import React from 'react';

import { TourController } from '../Onboarding/tour-core/TourController';

// Re-export types if needed
type TourId = 'feature-tour' | string;
import { Button } from '../ui/Button';

interface HelpMenuProps {
  className?: string;
}

export function HelpMenu({ className }: HelpMenuProps) {
  const profileId = 'default'; // Use simple default profile ID

  const startSpotlightTour = () => {
    TourController.startTour('spotlight', profileId, { force: true });
  };

  return (
    <div className={className}>
      <div className="flex flex-col space-y-2">
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
