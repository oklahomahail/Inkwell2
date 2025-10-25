/**
 * Converts an SVG element to a data URL for embedding in PDF exports
 * @param svgElement The SVG element to convert
 * @returns A base64-encoded data URL
 */
export function svgToDataURL(svgElement: SVGElement | null): string | undefined {
  if (!svgElement) return undefined;

  try {
    const svg = new XMLSerializer().serializeToString(svgElement);
    const base64 = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${base64}`;
  } catch (error) {
    console.error('Failed to convert SVG to data URL:', error);
    return undefined;
  }
}

/**
 * Finds and converts a Recharts SVG to a data URL
 * @param containerElement The container element that holds the chart
 * @returns A base64-encoded data URL or undefined
 */
export function exportRechartsToDataURL(containerElement: HTMLElement | null): string | undefined {
  if (!containerElement) return undefined;

  // Recharts renders an SVG inside the container
  const svgElement = containerElement.querySelector('svg');
  return svgToDataURL(svgElement);
}
