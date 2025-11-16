# AI Disclosure Feature

## Overview

The AI Disclosure feature provides authors with an easy, ethical way to add optional statements about AI assistance to their exported work. It's designed to be obvious, unobtrusive, non-restrictive, and purely additive.

## Features

### 1. Export-Level Disclosure

When exporting scenes, chapters, or manuscripts, authors can optionally include an AI assistance statement.

**Location**: Available in all export dialogs

- Scene/Chapter Export Dialog (`ExportDialog.tsx`)
- PDF Manuscript Export (`ExportModal.tsx`)

**Options**:

- **Enable/Disable**: Simple checkbox to include statement
- **Style**: Three pre-written options
  - **Short**: Brief, straightforward acknowledgment
  - **Process**: Describes AI role in workflow
  - **Formal**: Academic/professional tone
- **Placement**: Choose where statement appears
  - Front matter/title page
  - Back matter/acknowledgements
- **Preview**: Live preview of selected statement

**Persistence**: User preferences are automatically saved to localStorage and restored on future exports.

### 2. Inline AI Citation

When using the AI suggestion feature, authors can easily copy a ready-made citation for inline use.

**Location**: AI Suggestion Dialog (`AISuggestionBox.tsx`)

**Usage**:

1. Generate AI content using the suggestion feature
2. Click "Copy AI note" button below the output
3. Paste anywhere in manuscript as needed

**Text**: "This passage was revised with the assistance of an AI writing tool in Inkwell."

## Implementation Details

### Architecture

- **Zero data model**: No database changes required
- **Local state only**: Uses localStorage for preference persistence
- **Format-agnostic**: Works with Markdown, HTML, PDF, Plain Text, Word/RTF
- **Non-intrusive**: Never auto-inserts, always optional, always editable after export

### File Structure

```
src/
├── types/
│   └── aiDisclosure.ts           # Types, helpers, persistence
├── components/
│   ├── export/
│   │   └── AIDisclosureSection.tsx   # Export dialog UI
│   └── AI/
│       └── AIDisclosureHint.tsx      # Inline citation button
└── utils/
    └── exportUtils.ts            # Export pipeline integration
```

### Type Definitions

```typescript
export type AIDisclosureStyle = 'short' | 'process' | 'formal';
export type AIDisclosurePlacement = 'front' | 'back';

export interface ExportAIDisclosure {
  enabled: boolean;
  style: AIDisclosureStyle;
  placement: AIDisclosurePlacement;
}
```

### Export Pipeline

The disclosure is inserted during export based on format:

- **Markdown**: Horizontal rule separator with statement
- **HTML**: Styled `<div>` with italics and subtle border
- **Plain Text**: Text separator (─) with statement
- **PDF**: HTML styling suitable for print

Placement is handled by string replacement:

- **Front**: Inserted after `<body>` tag or at document start
- **Back**: Inserted before `</body>` tag or at document end

### Accessibility

- Full keyboard navigation support
- ARIA labels on all interactive elements
- Radio button groups properly labeled
- Screen reader friendly announcements

## User Experience

### Design Principles

1. **Obvious**: Appears in Export dialogs where authors expect metadata
2. **Unobtrusive**: Hidden until Export is opened, never blocks workflow
3. **Not Restrictive**: Everything is editable after export, no enforcement
4. **Additive**: Only adds capabilities, doesn't change existing features

### User Flow

**Export Flow**:

1. Author opens Export dialog
2. Sees AI disclosure section at bottom
3. Optionally enables and customizes
4. Export includes statement if enabled
5. Can edit or delete in final document

**Inline Citation Flow**:

1. Author uses AI suggestion feature
2. Sees "Copy AI note" button after generation
3. Clicks to copy ready-made citation
4. Pastes into document manually

## Future Enhancements

Potential v2+ features (not implemented):

- Multiple inline note variants (dropdown selection)
- Per-project AI usage toggle ("Rarely/Sometimes/Often")
- Export preview showing statement in context
- Keyboard shortcut hints for power users
- Custom statement templates

## Philosophy

This feature reflects Inkwell's commitment to:

- **Author agency**: Always optional, never mandatory
- **Transparency**: Easy to disclose AI usage ethically
- **Flexibility**: Authors control style, placement, and final content
- **Simplicity**: No complex tracking or enforcement
- **Trust**: Assumes authors will use responsibly

The goal is to make ethical AI disclosure effortless, not enforce it.
