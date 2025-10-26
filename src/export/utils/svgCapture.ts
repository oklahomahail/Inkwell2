/**
 * SVG Chart Capture Utilities
 * Captures Recharts SVG elements and converts them to data URLs for PDF export
 */

/**
 * Captures an SVG element from a container and returns a data URL
 * @param containerRef React ref to the container holding the SVG
 * @returns Base64-encoded data URL or null if capture fails
 */
export function captureSVGFromRef(containerRef: React.RefObject<HTMLElement>): string | null {
  try {
    if (!containerRef.current) return null;

    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) return null;

    return svgElementToDataURL(svgElement);
  } catch (error) {
    console.error('Failed to capture SVG from ref:', error);
    return null;
  }
}

/**
 * Captures an SVG element by selector and returns a data URL
 * @param selector CSS selector for the SVG element
 * @returns Base64-encoded data URL or null if not found
 */
export function captureSVGBySelector(selector: string): string | null {
  try {
    const svgElement = document.querySelector<SVGElement>(selector);
    if (!svgElement) return null;

    return svgElementToDataURL(svgElement);
  } catch (error) {
    console.error('Failed to capture SVG by selector:', error);
    return null;
  }
}

/**
 * Converts an SVG element to a base64-encoded data URL
 * @param svgElement The SVG element to convert
 * @returns Base64-encoded data URL
 */
export function svgElementToDataURL(svgElement: SVGElement): string {
  // Clone the SVG to avoid modifying the original
  const clonedSVG = svgElement.cloneNode(true) as SVGElement;

  // Ensure SVG has proper xmlns attribute
  clonedSVG.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Serialize to string
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clonedSVG);

  // Encode to base64
  const base64 = btoa(unescape(encodeURIComponent(svgString)));

  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Batch capture multiple SVG charts by selector
 * @param selectors Array of CSS selectors
 * @returns Object mapping selector to data URL (or null if not found)
 */
export function batchCaptureSVGs(selectors: string[]): Record<string, string | null> {
  const results: Record<string, string | null> = {};

  for (const selector of selectors) {
    results[selector] = captureSVGBySelector(selector);
  }

  return results;
}

/**
 * Store captured SVGs in localStorage for later export
 * @param projectId Project identifier
 * @param charts Object mapping chart names to data URLs
 */
export function storeCapturedCharts(
  projectId: string,
  charts: Record<string, string | null>,
): void {
  try {
    const key = `svg-capture:${projectId}`;
    localStorage.setItem(key, JSON.stringify(charts));
  } catch (error) {
    console.warn('Failed to store captured charts:', error);
  }
}

/**
 * Retrieve stored SVG charts from localStorage
 * @param projectId Project identifier
 * @returns Object mapping chart names to data URLs
 */
export function retrieveCapturedCharts(projectId: string): Record<string, string | null> {
  try {
    const key = `svg-capture:${projectId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return {};

    return JSON.parse(raw) as Record<string, string | null>;
  } catch (error) {
    console.warn('Failed to retrieve captured charts:', error);
    return {};
  }
}

/**
 * Clear stored SVG charts for a project
 * @param projectId Project identifier
 */
export function clearCapturedCharts(projectId: string): void {
  try {
    const key = `svg-capture:${projectId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear captured charts:', error);
  }
}
