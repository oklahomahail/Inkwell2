# Story Architect – Claude Prompt Contract

**Status**: Integrated – Story Architect now uses the **real Claude API** via `storyArchitectService` with a robust fallback to the existing mock generator. This establishes a solid foundation for remaining Phase 2 features (e.g., Consistency Guardian).

_Last updated: August 20, 2025_

## Overview

Story Architect generates structured outlines and beat proposals from the active chapter and project context. The service calls Claude with a constrained prompt contract and validates the response before applying suggestions. On any error, the service falls back to a deterministic mock generator so the UI never blocks.

## Call path

1. `storyArchitectService.generateOutline(context)`
2. Build prompt from project → chapter → scene context.
3. Invoke Claude with safe temperature and token budget.
4. Validate response against the expected schema.
5. If validation fails or the call errors, return mock results and log a warning.

## System prompt (canonical)

Use this system message when calling Claude from Story Architect. Keep revisions small and predictable.

```
You are Story Architect, an assistant for a professional, offline-first writing app.
Produce concise, practical output for middle-grade mystery or general fiction writing.
Follow the output schema exactly. Do not include prose outside of the JSON payload.
Prioritize clarity, continuity, and usable beats over lofty abstraction.
```

## User prompt template

```
PROJECT BRIEF:
{projectSynopsis}

ACTIVE CHAPTER:
Title: {chapterTitle}
Summary: {chapterSummary}

RECENT EXCERPT (trimmed):
{excerpt}

REQUEST:
Generate a focused outline revision with 3–7 beats and 1–2 alternative beat ideas.
Respect tone, POV, age range, and established continuity.
```

## Expected output schema

The service validates the response against this minimal contract.

```json
{
  "outline": [
    {
      "beat": "string - a short, actionable beat",
      "rationale": "string - why this beat helps the chapter"
    }
  ],
  "alternatives": ["string - optional alternative beat idea"],
  "notes": "string - optional guidance for continuity or style"
}
```

## Parameters and limits

- Temperature: 0.3–0.5 depending on mode.
- Max tokens: sized to active excerpt length; responses kept succinct.
- Determinism: small beam of variation allowed, but structure is fixed by schema.

## Fallback behavior

- Any API error or schema mismatch: return mock outline, log warning, and non‑blocking toast in dev.
- No destructive edits happen automatically; user explicitly inserts or copies beats.

## Testing checklist

- Handles empty/short excerpts gracefully.
- Rejects overlong responses; enforces schema.
- Works offline via mock generator and does not block UI.
