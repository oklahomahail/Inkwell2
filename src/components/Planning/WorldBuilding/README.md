# World Building Module

A comprehensive world-building tool for Inkwell that helps writers create and manage the foundational elements of their story worlds.

## Features

### Three Element Types

1. **Locations** 🗺️
   - Geography and climate
   - Population details
   - Key events that occurred
   - Story significance

2. **Cultures** 👥
   - Core values and beliefs
   - Language and traditions
   - Social structure
   - Customs and practices

3. **Rules/Systems** 📖
   - Magic systems
   - Political systems
   - Societal rules
   - Scientific laws
   - Economic systems

## Usage

### Creating Elements

1. Navigate to the **World Building** tab in Story Planning
2. Click **"Add Element"** button
3. Select element type (Location, Culture, or Rule)
4. Fill in the details
5. Click **"Create"**

### Editing Elements

- Hover over any card to see edit/delete buttons
- Click the edit icon to modify
- Click the delete icon to remove

### Filtering

Use the filter tabs to view:

- **All** - Show all elements
- **Locations** - Show only locations
- **Cultures** - Show only cultures
- **Rules** - Show only rules/systems

## Component Structure

```
WorldBuilding/
├── WorldBuildingPanel.tsx    # Main container component
├── LocationCard.tsx           # Location display card
├── CultureCard.tsx           # Culture display card
├── RuleCard.tsx              # Rule/system display card
├── WorldFormModal.tsx        # Create/edit modal form
├── types.ts                  # TypeScript type definitions
├── worldBuildingReducer.ts   # State management reducer
└── index.ts                  # Module exports
```

## State Management

Uses React's `useReducer` hook for local state management:

- **ADD_ITEM** - Add new element
- **UPDATE_ITEM** - Update existing element
- **DELETE_ITEM** - Remove element
- **SELECT_ITEM** - Select element for editing
- **LOAD_ITEMS** - Load saved elements

## Future Enhancements

- [ ] Connect to Supabase for persistence
- [ ] Export/import world data
- [ ] Connect locations to characters
- [ ] Link rules to story events
- [ ] Visual relationship mapping
- [ ] AI-powered world generation
- [ ] Templates for common world types
- [ ] World consistency checking

## Integration Points

### Tour System

Triggers `triggerWorldBuildingVisited()` when tab is accessed.

### Toast Notifications

Shows success/error messages for CRUD operations.

### Dark Mode

Fully supports dark mode with appropriate color schemes.

### Accessibility

- Keyboard navigation
- ARIA labels
- Screen reader support
- Focus management
