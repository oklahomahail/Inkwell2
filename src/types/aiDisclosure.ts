/**
 * AI Disclosure Types (v1.0.0)
 *
 * Type definitions for AI assistance disclosure statements in exports and inline citations.
 *
 * This feature provides authors with an easy, ethical way to add optional statements about
 * AI assistance to their exported work. It's designed to be:
 * - Obvious: Appears in export dialogs where authors expect metadata
 * - Unobtrusive: Hidden until needed, never blocks workflow
 * - Not Restrictive: Everything is editable after export, no enforcement
 * - Additive: Only adds capabilities, doesn't change existing features
 *
 * @see docs/features/ai-disclosure.md for detailed documentation
 */

/**
 * Style options for AI disclosure statements.
 * - 'short': Brief, straightforward acknowledgment
 * - 'process': Describes AI role in workflow
 * - 'formal': Academic/professional tone
 */
export type AIDisclosureStyle = 'short' | 'process' | 'formal';

/**
 * Placement options for AI disclosure statements in exported documents.
 * - 'front': Front matter or title page
 * - 'back': Back matter or acknowledgements
 */
export type AIDisclosurePlacement = 'front' | 'back';

/**
 * Configuration for AI disclosure in exports.
 * Preferences are automatically persisted to localStorage.
 */
export interface ExportAIDisclosure {
  /** Whether to include the AI disclosure statement in the export */
  enabled: boolean;
  /** The style/tone of the disclosure statement */
  style: AIDisclosureStyle;
  /** Where to place the statement in the document */
  placement: AIDisclosurePlacement;
}

export const DEFAULT_AI_DISCLOSURE: ExportAIDisclosure = {
  enabled: false,
  style: 'short',
  placement: 'back',
};

/**
 * Returns the full disclosure text for a given style.
 */
export function getDisclosureText(style: AIDisclosureStyle): string {
  switch (style) {
    case 'short':
      return (
        'Portions of this work were developed with the assistance of an AI ' +
        'writing tool in Inkwell. The author reviewed, revised, and is ' +
        'responsible for the final content.'
      );
    case 'process':
      return (
        'This work was developed with the support of an AI writing assistant ' +
        'in Inkwell for brainstorming, drafting, and revision. All ideas and ' +
        'final wording were reviewed and approved by the author.'
      );
    case 'formal':
      return (
        'The author used an AI system (Inkwell) to support brainstorming, ' +
        'language refinement, and structural feedback. The author takes full ' +
        'responsibility for the accuracy and interpretation of the content.'
      );
    default:
      return '';
  }
}

/**
 * Inline citation text for use in AI suggestion dialog.
 */
export const INLINE_AI_NOTE =
  'This passage was revised with the assistance of an AI writing tool in Inkwell.';

/**
 * LocalStorage key for persisting user preferences.
 */
export const AI_DISCLOSURE_PREFS_KEY = 'inkwell_ai_disclosure_prefs';

/**
 * Save disclosure preferences to localStorage.
 */
export function saveDisclosurePreferences(prefs: ExportAIDisclosure): void {
  try {
    localStorage.setItem(AI_DISCLOSURE_PREFS_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Failed to save AI disclosure preferences:', error);
  }
}

/**
 * Load disclosure preferences from localStorage.
 */
export function loadDisclosurePreferences(): ExportAIDisclosure {
  try {
    const saved = localStorage.getItem(AI_DISCLOSURE_PREFS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        enabled: parsed.enabled ?? DEFAULT_AI_DISCLOSURE.enabled,
        style: parsed.style ?? DEFAULT_AI_DISCLOSURE.style,
        placement: parsed.placement ?? DEFAULT_AI_DISCLOSURE.placement,
      };
    }
  } catch (error) {
    console.error('Failed to load AI disclosure preferences:', error);
  }
  return DEFAULT_AI_DISCLOSURE;
}
