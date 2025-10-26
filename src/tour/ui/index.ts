/**
 * Spotlight Tour UI - Main Exports
 *
 * Phase 2 implementation of the guided product tour overlay.
 *
 * Core Components:
 * - SpotlightOverlay: Main orchestrator (mount once in app root)
 * - SpotlightMask: SVG mask with focus ring
 * - SpotlightTooltip: Tooltip card with step content
 *
 * Hooks:
 * - useSpotlightUI: Subscribe to tour state and manage UI
 *
 * Utilities:
 * - geometry: Viewport and rect calculations
 * - positioning: Tooltip placement logic
 * - portal: React portal for overlay rendering
 * - a11y: Focus trap and announcements
 *
 * Usage:
 * ```tsx
 * // 1. Mount SpotlightOverlay in your app root
 * import SpotlightOverlay from '@/tour/ui/SpotlightOverlay';
 *
 * function App() {
 *   return (
 *     <Router>
 *       <YourApp />
 *       <SpotlightOverlay />
 *     </Router>
 *   );
 * }
 *
 * // 2. Start the tour from anywhere
 * import { tourService } from '@/tour/TourService';
 * await tourService.start();
 * ```
 *
 * @see docs/features/tour.md - Feature guide
 * @see docs/architecture/spotlight-tour-architecture.md - Architecture details
 */

export { default as SpotlightOverlay } from './SpotlightOverlay';
export { default as SpotlightMask } from './SpotlightMask';
export { default as SpotlightTooltip } from './SpotlightTooltip';
export { SpotlightPortal } from './portal';
export { useSpotlightUI } from './useSpotlightUI';

// Utilities (optional exports for advanced use cases)
export { getAnchorRect, rafThrottle, type Viewport } from './geometry';

export { choosePlacement, computeTooltipCoords, type TooltipPlacement } from './positioning';

export { trapFocus, restoreFocus, announceLive } from './a11y';
