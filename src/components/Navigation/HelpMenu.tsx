import { BookOpen, Video, MessageSquare, Sparkles, RotateCw, Wand2, FileDown } from 'lucide-react';
import React from 'react';

import { getTourConfig } from '@/components/Onboarding/tourRegistry';
import { resetTour } from '@/tour/persistence';
import { startDefaultTour } from '@/tour/tourEntry';
import { tourService } from '@/tour/TourService';
import { getLastTourUsed, setLastTourUsed, type TourVariant } from '@/tour/tourStorage';

import { startTour } from '../Onboarding/tour-core/TourController';
import { Button } from '../ui/Button';

interface HelpMenuProps {
  className?: string;
}

/**
 * Start a tour by key from the tour registry
 */
function startTourByKey(key: 'core' | 'ai-tools' | 'export') {
  const cfg = getTourConfig(key);
  // Reset tour state to allow replay
  resetTour(cfg.id);
  // Track this as the last used tour
  setLastTourUsed(key);
  // Start the tour - cast to correct type since registry uses different TourConfig
  tourService.start(cfg as any, { forceRestart: true });
}

export function HelpMenu({ className }: HelpMenuProps) {
  const profileId = 'default'; // Use simple default profile ID
  const lastTourUsed = getLastTourUsed();

  const startSpotlightTour = () => {
    startTour('spotlight', profileId, { force: true });
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
    // Start the default onboarding tour (resets completion state)
    setLastTourUsed('core');
    startDefaultTour();
  };

  // Get button label for last tour
  const getLastTourLabel = (): string => {
    if (!lastTourUsed) return 'Restart Core Tour';

    const labels: Record<TourVariant, string> = {
      core: 'Restart Core Tour',
      'ai-tools': 'Restart AI Tools Tour',
      export: 'Restart Export Tour',
    };

    return labels[lastTourUsed];
  };

  return (
    <div className={className}>
      <div className="flex flex-col space-y-2">
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
          onClick={() => {
            setLastTourUsed('ai-tools');
            startTourByKey('ai-tools');
          }}
        >
          <Wand2 className="w-4 h-4 mr-2" />
          AI Tools Tour
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start"
          onClick={() => {
            setLastTourUsed('export');
            startTourByKey('export');
          }}
        >
          <FileDown className="w-4 h-4 mr-2" />
          Export Tour
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
