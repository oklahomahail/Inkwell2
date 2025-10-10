# AI Plot Analysis Feature

> **Comprehensive AI-powered plot structure analysis with visual insights and actionable suggestions for story improvement**

## Overview

The AI Plot Analysis feature provides writers with intelligent insights about their story structure, pacing, and narrative flow. Built into Inkwell's Plot Boards as an Insights tab, this feature analyzes plot cards to generate actionable feedback with beautiful visualizations.

## Features

### 🧠 **Intelligent Analysis**

- **Plot Structure Analysis**: Identifies plot holes, pacing issues, and continuity gaps
- **Character Consistency**: Detects character development inconsistencies across scenes
- **Timeline Validation**: Finds timeline conflicts and narrative flow issues
- **Tone & Style Monitoring**: Identifies tone shifts and stylistic inconsistencies

### 📊 **Visual Insights**

- **Pacing Graph**: Interactive line chart showing tension and pace across scenes
- **Conflict Heatmap**: Visual grid displaying conflict density by story beats
- **Quality Score**: Overall story quality metric (0-100) with detailed breakdown
- **Issue Categorization**: Problems organized by severity (low, medium, high)

### 🎯 **Actionable Suggestions**

- **Specific Recommendations**: Targeted advice for each identified issue
- **Severity Indicators**: Visual priority system for issue resolution
- **Scene-Level Insights**: Issues linked to specific scenes for easy navigation
- **Resolution Tracking**: Mark issues as resolved and track improvement

## User Interface

### Accessing Plot Analysis

1. Navigate to **Plot Boards** in your project
2. Click the **Insights** tab (appears when feature is enabled)
3. Click **"Analyze Project"** to generate analysis

### Analysis Dashboard

The Insights panel includes:

- **Analysis Summary**: Overview of plot health and key insights
- **Quality Score**: Circular progress indicator showing story quality (0-100)
- **Pacing Graph**: Interactive chart with tension and pace lines
- **Conflict Heatmap**: Grid visualization with intensity-based coloring
- **Issues List**: Expandable cards with suggestions and resolution tracking

### Visual Elements

- **Inkwell Branding**: Deep Navy (#0C5C3D) and Warm Gold (#D4A537) color scheme
- **Accessible Design**: WCAG AA compliant with proper contrast ratios
- **Responsive Layout**: Works seamlessly across desktop, tablet, and mobile
- **Loading States**: Smooth transitions and skeleton loading for async operations

## Technical Implementation

### Architecture

```
AI Plot Analysis System
├── 📊 aiPlotAnalysisService.ts     # Main analysis service
├── 🎭 mockAIService.ts             # Development/demo mode
├── 🎯 usePlotAnalysis.ts           # React hook for state management
├── 📈 analyticsService.ts          # Usage tracking and metrics
└── 🎨 Insights Components          # UI visualization components
    ├── PlotAnalysisPanel.tsx       # Main dashboard
    ├── PacingGraph.tsx            # Interactive pacing chart
    ├── ConflictHeatmap.tsx        # Conflict density visualization
    └── IssuesList.tsx             # Issues and suggestions display
```

### Data Flow

1. **Scene Extraction**: `usePlotAnalysis` hook extracts scenes from plot board cards
2. **Analysis Request**: User clicks "Analyze Project" triggering `analyzeBoard()`
3. **AI Processing**: Service calls Claude API or falls back to mock analysis
4. **State Management**: Results stored in Zustand store for persistence
5. **UI Updates**: Components reactively update with analysis results
6. **Analytics**: Usage metrics tracked for product insights

### Feature Flag Control

The feature is controlled by the `aiPlotAnalysis` flag:

```typescript
// Enable/disable in flags.ts
AI_PLOT_ANALYSIS: {
  key: 'aiPlotAnalysis',
  name: 'AI Plot Analysis',
  description: 'AI-powered plot structure analysis with insights',
  defaultValue: true,
  category: 'core',
}
```

### Mock Mode Support

Full functionality available without Claude API:

- **Realistic Analysis**: Mock service generates believable plot insights
- **Demo Safe**: Perfect for presentations and development
- **Same Interface**: Identical user experience regardless of mode
- **Configurable**: Adjustable response times and failure rates for testing

## Integration Points

### Plot Boards Integration

- **Seamless Tab Interface**: Insights tab appears alongside main Plot Board view
- **Card-Based Analysis**: Extracts content from plot board cards as scenes
- **Real-Time Updates**: Analysis reflects current board state
- **Contextual Actions**: Analyze button integrated into board toolbar

### Analytics Integration

- **Usage Tracking**: Anonymous metrics on analysis runs and user engagement
- **Performance Monitoring**: Response times and error rates
- **Feature Adoption**: Track how users discover and use the feature
- **Issue Resolution**: Monitor which suggestions users find most valuable

### AI Services Integration

- **Claude API**: Primary analysis powered by Anthropic Claude
- **Fallback Strategy**: Graceful degradation to mock mode when AI unavailable
- **Error Handling**: Robust retry logic and user-friendly error messages
- **Configuration**: Respects existing AI service configuration

## Development

### Testing

Run the comprehensive test suite:

```bash
# Run plot analysis tests
pnpm test src/features/plotboards/tests/aiPlotAnalysisService.test.ts

# Type checking
pnpm exec tsc --noEmit

# Full test suite
pnpm test
```

### Adding New Analysis Types

1. **Extend Types**: Add new issue types to `plotAnalysis.ts`
2. **Update Prompts**: Modify AI prompts in `plotAnalysisPrompts.ts`
3. **Handle in Mock**: Add realistic responses to `mockAIService.ts`
4. **UI Support**: Add icons and styling to `IssuesList.tsx`
5. **Analytics**: Track new issue types in `analyticsService.ts`

### Customizing Visualizations

- **Pacing Graph**: Modify `PacingGraph.tsx` for different chart types
- **Conflict Heatmap**: Adjust `ConflictHeatmap.tsx` for alternative visualizations
- **Color Schemes**: Update brand colors in component styling
- **Chart Libraries**: Recharts used with dynamic imports for performance

## Usage Examples

### Basic Analysis

```typescript
// Trigger analysis via hook
const { analysis, run, hasScenes } = usePlotAnalysis(profileId, projectId);

if (hasScenes) {
  await run(); // Generates analysis
}
```

### Direct Service Usage

```typescript
import { analyzeBoard } from './services/aiPlotAnalysisService';

const analysis = await analyzeBoard({
  profileId: 'user-123',
  projectId: 'project-456',
  scenes: [
    { id: 's1', title: 'Opening', text: 'Scene content...', order: 0 },
    { id: 's2', title: 'Conflict', text: 'More content...', order: 1 },
  ],
  structure: 'three_act',
});

console.log(`Quality Score: ${analysis.qualityScore}`);
console.log(`Issues Found: ${analysis.issues.length}`);
```

### Mock Mode Configuration

```typescript
// Enable mock mode for development
vi.mock('../services/aiConfigService', () => ({
  aiConfigService: {
    getConfiguration: () => ({ isValid: false, provider: 'mock' }),
  },
}));
```

## Best Practices

### For Users

- **Regular Analysis**: Run analysis after major story changes
- **Prioritize High-Severity Issues**: Focus on red-flagged problems first
- **Use as Guide**: Balance AI suggestions with creative judgment
- **Track Progress**: Re-run analysis to see quality score improvements

### For Developers

- **Feature Flagging**: Use flags to control rollout and testing
- **Error Boundaries**: Wrap components in error boundaries
- **Performance**: Dynamic imports for heavy chart dependencies
- **Accessibility**: Ensure all visualizations have text alternatives
- **Testing**: Mock AI responses for reliable test suites

## Troubleshooting

### Common Issues

**Analysis Not Running**

- Check if feature flag `aiPlotAnalysis` is enabled
- Verify plot board has cards with content
- Check browser console for API errors

**Charts Not Displaying**

- Ensure Recharts is installed: `pnpm install recharts`
- Check for JavaScript errors in browser console
- Verify dynamic import is working correctly

**Mock Mode Not Working**

- Confirm AI configuration is invalid/missing
- Check `mockAIService.ts` for proper export
- Verify mock responses match expected interface

### Performance Considerations

- **Large Projects**: Analysis time scales with number of scenes
- **Chart Rendering**: Heavy visualizations are dynamically imported
- **Memory Usage**: Large analysis results are cached in store
- **Network**: Claude API calls may take 2-5 seconds

## Future Enhancements

### Planned Features

1. **Individual Scene Analysis**: Per-scene insights and suggestions
2. **Historical Tracking**: Compare analysis results over time
3. **Export Reports**: PDF/Word export of analysis findings
4. **Custom Rules**: User-defined analysis criteria
5. **Multi-Provider**: OpenAI and custom AI endpoint support

### Enhancement Ideas

- **Interactive Visualizations**: Click-to-edit directly from charts
- **Collaboration**: Share analysis results with beta readers
- **Templates**: Analysis presets for different genres
- **Integration**: Connect with writing apps and services
- **Mobile**: Optimized mobile interface for on-the-go insights

---

_For technical support or feature requests, please check the main [README.md](../README.md) or open an issue on the repository._
