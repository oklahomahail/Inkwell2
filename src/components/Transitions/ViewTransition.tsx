/**
 * ViewTransition - Sophisticated page transition component
 *
 * Implements "page turning" effect with literary elegance.
 * Part of "Sophisticated Simplicity" design language.
 */

import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

export interface ViewTransitionProps {
  children: React.ReactNode;
  /** Unique key for the current view - triggers transition when changed */
  viewKey: string;
  /** Transition variant - default is 'pageTurn' */
  variant?: 'pageTurn' | 'fade' | 'slideUp' | 'slideLeft';
  /** Duration in seconds - default 0.4s for refined, confident motion */
  duration?: number;
}

/**
 * Animation variants for different transition styles
 */
const variants = {
  // Page turning effect - like turning a page in a book
  pageTurn: {
    initial: {
      opacity: 0,
      rotateY: -15,
      x: -20,
      transformOrigin: 'left center',
      transformPerspective: 1200,
    },
    animate: {
      opacity: 1,
      rotateY: 0,
      x: 0,
      transformOrigin: 'left center',
      transformPerspective: 1200,
    },
    exit: {
      opacity: 0,
      rotateY: 15,
      x: 20,
      transformOrigin: 'left center',
      transformPerspective: 1200,
    },
  },

  // Simple fade - for subtle transitions
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  // Slide up - for modal/overlay content
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },

  // Slide left - for sequential navigation
  slideLeft: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  },
};

export const ViewTransition: React.FC<ViewTransitionProps> = ({
  children,
  viewKey,
  variant = 'pageTurn',
  duration = 0.4,
}) => {
  const selectedVariant = variants[variant];

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={viewKey}
        initial={selectedVariant.initial}
        animate={selectedVariant.animate}
        exit={selectedVariant.exit}
        transition={{
          duration,
          ease: [0.4, 0.0, 0.2, 1] as [number, number, number, number], // ease-elegant from Tailwind config
        }}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Staggered children animation - for cards, lists, etc.
 * Creates a cascading entrance effect
 */
export interface StaggerChildrenProps {
  children: React.ReactNode;
  className?: string;
  /** Delay between each child animation in seconds */
  staggerDelay?: number;
  /** Whether children are currently visible */
  isVisible?: boolean;
}

export const StaggerChildren: React.FC<StaggerChildrenProps> = ({
  children,
  className = '',
  staggerDelay = 0.05,
  isVisible = true,
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0.0, 0.2, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

/**
 * Fade in wrapper - simple opacity transition
 */
export interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 0.3,
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.4, 0.0, 0.2, 1] as [number, number, number, number],
      }}
    >
      {children}
    </motion.div>
  );
};

export default ViewTransition;
