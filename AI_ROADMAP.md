# Inkwell AI Integration Roadmap

**Version**: 1.0
**Last Updated**: 2025-11-21
**Status**: Planning Phase

---

## Executive Summary

This roadmap outlines the strategic integration of advanced AI capabilities into Inkwell, sequenced by technical dependencies and implementation complexity. The plan leverages Inkwell's existing AI infrastructure (Anthropic, OpenAI, Google providers) and rich manuscript data models to deliver intelligent writing assistance while maintaining author autonomy and privacy.

**Total Timeline**: 2026 Q1 → 2028+
**Total Features**: 28 features across 8 waves (approximate - scope may be refined based on validation)
**Guiding Principles**: Privacy-first, author control, voice preservation, progressive enhancement

**Note on Stretch Goals**: Waves 7–8 represent ambitious long-term capabilities and can be deferred or reduced depending on market fit, resources, and technology maturity. Waves 1–6 deliver the core value proposition.

---

## Current Architecture Foundation

### ✅ Already Built

- **Multi-provider AI**: Anthropic Claude, OpenAI GPT-4, Google Gemini
- **Two-tier system**: Simple mode (proxy) + Power mode (user API keys)
- **Rich data models**: Characters, Chapters, Plot Notes, Worldbuilding, Timeline
- **Storage**: IndexedDB + localStorage + Supabase sync
- **Plot Analysis Service**: LLM-enhanced manuscript analysis with caching
- **Type-safe architecture**: TypeScript throughout, Zod validation

### 🔧 Key Integration Points

- `/src/ai/` - Provider abstraction layer
- `/src/services/plotAnalysis/` - Pattern for AI analysis features
- `/src/model/` - Data gateways (chapters, characters)
- `/src/services/dbSchema.ts` - Extensible IndexedDB schema
- `/api/ai/` - Vercel Edge Functions for proxying

---

## Implementation Waves

### Waves at a Glance

| Wave       | Timeline            | Focus                  | Features                                                                               |
| ---------- | ------------------- | ---------------------- | -------------------------------------------------------------------------------------- |
| **Wave 1** | 2026 Q1 (2-3 mo)    | Quick Wins             | Synopsis Generator, Scene Classification, Publishing Tools, Outline Comparison         |
| **Wave 2** | 2026 Q2 (3-4 mo)    | Core Intelligence      | Revision Coach, Semantic Analysis, Scene Purpose, Emotion/Tension Tracking             |
| **Wave 3** | 2026 Q3 (3-4 mo)    | Character & World      | Voice Modeling, Voice-Preserving Rewrites, Worldbuilding Extraction, Relationship Maps |
| **Wave 4** | 2026 Q4 (4-5 mo)    | Advanced Reasoning     | Timeline Check, Beat Sheet 2.0, Project Advisor, Plot Navigator, Narrative Sandbox     |
| **Wave 5** | 2027 Q1 (3-4 mo)    | Series & World Systems | Series Bible, Multi-Book Consistency, Encyclopedia Mode                                |
| **Wave 6** | 2027 Q2-Q3 (4-5 mo) | Real-Time + Market     | Consistency Guardian 2.0, Draft Analyst, Cover Concepts, Market Positioning            |
| **Wave 7** | 2027 Q4 (3-4 mo)    | Creative Reasoning     | What-If Scenario Engine                                                                |
| **Wave 8** | 2028+ (12+ mo)      | Private On-Device AI   | Local Mini-LM, Encrypted Indexing, Offline Revision                                    |

---

## Wave 1: Quick Wins (2026 Q1) - 2-3 months

**Goal**: Build momentum, validate AI integration patterns, deliver immediate value

**Status**: ✅ **ALL PHASES COMPLETE** | Ready for Merge

**Branch**: `feature/ai-wave-1-foundation`

**Priority Breakdown**:

- **Must-Have (MVP)**: Chapter Synopsis Generator (#1), Scene Classification (#2)
- **Nice-to-Have**: Publishing Tools (#3), Outline Comparison (#4)

**Note**: Outline Comparison (#4) is marked Medium complexity and is the most technically involved feature in Wave 1. It may be deferred to Wave 2 if timeline constraints emerge.

### Implementation Progress

#### Phase 1: Backend Services & Infrastructure ✅ COMPLETE

**Completed**: 2025-11-21
**Commit**: `fde213f` - "feat: add AI foundation infrastructure for Wave 1"

**Infrastructure**:

- Created `/src/services/ai/` service layer
- Extended IndexedDB schema with `ai_suggestions` and `scene_metadata` stores
- Implemented caching with TTL (24hr for synopses/classification, 7-day for publishing)
- Added Zod validation for all AI responses
- Type-safe interfaces in `/src/types/ai.ts`
- 32 comprehensive unit tests (all passing)

**Services Implemented** (~2,700 lines):

1. `chapterSynopsisService.ts` - Chapter analysis with key beats, emotional arc, conflicts
2. `sceneClassificationService.ts` - 7-type scene classification with confidence scoring
3. `publishingToolsService.ts` - Blurb, query letter, 1-page & 3-page synopsis generation

---

#### Phase 2: UI Integration ✅ COMPLETE

**Completed**: 2025-11-21
**Commits**:

- `48e544f` - "feat(ai): integrate Wave 1 AI features into UI"
- `cf544c4` - "feat(ai): add Scene Classification UI components (Wave 1, Part 2)"

**Components Created** (~710 lines):

1. `ChapterSynopsisModal.tsx` (319 lines) - Modal for generating and viewing chapter synopses
2. `PublishingToolsPanel.tsx` (403 lines) - Full publishing materials generator with 5 modes
3. `SceneTypeBadge.tsx` (96 lines) - Reusable badge for 7 scene types with color-coding
4. `SceneStatsPanel.tsx` (138 lines) - Analytics panel showing scene distribution

**Integration Points**:

- Added "Synopsis" button to chapter editor ([EnhancedWritingPanel.tsx](src/components/Writing/EnhancedWritingPanel.tsx:877-891))
- Scene type badges in chapter sidebar ([EnhancedWritingPanel.tsx](src/components/Writing/EnhancedWritingPanel.tsx:148-154))
- Publishing Tools in main navigation ([Sidebar.tsx](src/components/Sidebar.tsx:78), [ViewSwitcher.tsx](src/components/ViewSwitcher.tsx:234-247))
- Publishing view added to AppContext enum

**All Tests Passing**: 609 tests ✅

---

#### Phase 3: Plotboards Integration ✅ COMPLETE

**Completed**: 2025-11-21
**Commits**:

- `b0e4b16` - "feat(ai): add scene type badges to PlotCards (Phase 1)"
- `c5dafe8` - "feat(ai): add scene type filter to PlotBoards (Phase 2)"
- `2fe44e7` - "feat(ai): add SceneStatsPanel sidebar to PlotBoards (Phase 3)"

**Implementation** (~150 lines of modifications):

**Phase 1 - Scene Badges on Plot Cards**:

- Auto-loads scene metadata when PlotCard has linked chapterId
- Displays SceneTypeBadge next to card title
- Graceful handling when metadata missing

**Phase 2 - Scene Type Filter**:

- Added dropdown filter in PlotBoards header
- Filters cards by scene type across all columns
- "All Scene Types" option to show everything

**Phase 3 - SceneStatsPanel Sidebar**:

- Restructured PlotBoard layout to flex-row with sidebar
- 320px sidebar showing scene distribution analytics
- Imbalance warnings when one type >40%
- Real-time stats calculation from all cards

**Integration Points**:

- [PlotCard.tsx](src/features/plotboards/components/PlotCard.tsx:204-210) - Badge display
- [PlotBoards.tsx](src/features/plotboards/components/PlotBoards.tsx:85-108) - Filter dropdown
- [PlotBoard.tsx](src/features/plotboards/components/PlotBoard.tsx:104-180) - Stats sidebar

**All Tests Passing**: 609 tests ✅

---

#### Phase 4: Auto-sync Scene Metadata ✅ COMPLETE

**Completed**: 2025-11-21
**Commit**: `cf0fb8b` - "feat(ai): implement Phase 4 auto-sync scene metadata"

**What**: Makes scene metadata feel "alive and self-updating"

**Implementation** (~140 lines):

**Stale Metadata Tracking**:

- Added `updatedAt` and `isStale` fields to SceneMetadata type ([src/types/ai.ts:109-110](src/types/ai.ts#L109-L110))
- Tracks when content has changed since last classification

**Helper Functions** ([src/services/ai/sceneClassificationService.ts:337-413](src/services/ai/sceneClassificationService.ts#L337-L413)):

- `markSceneMetadataStale()`: Marks metadata when chapter content changes
- `refreshSceneMetadataIfStale()`: Refreshes stale metadata with 2-minute cooldown

**Chapter Save Integration** ([src/model/chapters.ts:260-277](src/model/chapters.ts#L260-L277)):

- Automatically marks metadata as stale on every chapter save
- Fire-and-forget pattern (doesn't slow down saves)
- Works for both new and legacy chapter models

**Background Refresh UX** ([src/features/plotboards/components/PlotCard.tsx:52-93](src/features/plotboards/components/PlotCard.tsx#L52-L93)):

- Auto-refreshes stale metadata when PlotCards load
- Shows "Classifying..." for missing metadata
- Fades badge opacity during refresh
- Completely non-blocking

**Key Features**:

- 2-minute cooldown between refreshes per chapter
- Respects cache unless forced refresh
- Graceful failure handling (non-critical operations)
- No blocking operations or UI freezing

**Flow**:

```
User edits chapter → Save → Mark stale → View PlotBoard
→ Detect stale → Refresh in background → Update badge & stats
```

**All Tests Passing**: 609 tests ✅

---

### Features

#### 1. AI Chapter Synopsis Generator ✅ COMPLETE

**What**: Generates chapter summaries, beat lists, emotional arcs, and conflict analyses

**Implementation**:

- ✅ Service: `/src/services/ai/chapterSynopsisService.ts` (346 lines)
- ✅ Storage: IndexedDB `ai_suggestions` store with 24hr TTL
- ✅ UI: Modal dialog with generate/regenerate, displays summary, key beats, emotional arc, conflicts
- ✅ Caching: Content-based hashing prevents unnecessary API calls
- ✅ Tests: 8 unit tests covering generation, caching, validation

**Technical Highlights**:

- Structured output with Zod validation
- Cache invalidation on chapter content changes
- Loading states and error handling
- Accept/reject workflow

**Status**: ✅ Shipped (Backend + UI)
**Duration**: 1.5 weeks actual

---

#### 2. AI Scene Classification ✅ COMPLETE

**What**: Automatically classifies scenes into narrative types

**Types**: Conflict, Reveal, Transition, Action, Emotional, Setup, Resolution

**Implementation**:

- ✅ Service: `/src/services/ai/sceneClassificationService.ts` (398 lines)
- ✅ Storage: IndexedDB `scene_metadata` store
- ✅ UI: Color-coded badges in chapter sidebar, analytics panel with distribution
- ✅ Confidence scoring: 0-1 confidence displayed when <70%
- ✅ Tests: 9 unit tests for classification, caching, metadata storage

**Technical Highlights**:

- 7 scene types with distinct color themes and emojis
- Real-time badge display in chapter sidebar
- SceneStatsPanel shows distribution with imbalance warnings (>40% one type)
- Auto-loads metadata for all chapters on mount

**Status**: ✅ Shipped (Backend + UI)
**Duration**: 1 week actual

---

#### 3. AI Blurb, Query Letter, and Synopsis Generator ✅ COMPLETE

**What**: Transforms manuscript into submission-ready marketing materials

**Outputs**:

- Book blurb (back cover copy, 100-300 words)
- Query letter (200-500 words)
- 1-page synopsis (300-800 words)
- 3-page synopsis (800-2400 words)
- Full package mode (generates all 4 at once)

**Implementation**:

- ✅ Service: `/src/services/ai/publishingToolsService.ts` (497 lines)
- ✅ Storage: IndexedDB `ai_suggestions` with 7-day TTL (longer for publishing materials)
- ✅ UI: Full panel with 5 modes, editable textarea, copy to clipboard
- ✅ Batch generation: Full package mode with progress tracking
- ✅ Tests: 12 unit tests covering all material types and error handling

**Technical Highlights**:

- Genre-specific prompts for better targeting
- Package generation shows summary of what succeeded/failed
- Quick view cards for switching between generated materials
- Type-safe field mapping to avoid runtime errors
- Editable output before copying

**Status**: ✅ Shipped (Backend + UI)
**Duration**: 2 weeks actual

---

#### 4. Outline Comparison 🔧 Medium Complexity

**What**: Compares outlines to drafts, surfaces mismatches and forgotten beats

**Technical Approach**:

- Extend existing snapshot service
- Diff algorithm: Compare plot notes vs. actual chapter content
- Service: `/src/services/ai/outlineComparison.ts`
- UI: Side-by-side view with highlighted differences
- AI enhancement: Explain why divergence occurred

**Dependencies**: None (uses existing models)
**Status**: ⬜ Deferred to Wave 2
**Duration**: 1-2 weeks (estimated)

---

### Wave 1 Outcome

**Status**: ✅ **ALL PHASES COMPLETE** (100%)

**Shipped** (2025-11-21):

- ✅ **Phase 1**: Backend Services & Infrastructure
- ✅ **Phase 2**: UI Integration (4 components)
- ✅ **Phase 3**: Plotboards Integration (3 sub-phases)
- ✅ **Phase 4**: Auto-sync Scene Metadata

**Features**:

- ✅ Chapter Synopsis Generator (Backend + UI)
- ✅ Scene Classification (Backend + UI + Auto-sync)
- ✅ Publishing Tools (Backend + UI)
- ⬜ Outline Comparison (Deferred to Wave 2)

**Code Stats**:

- **Backend**: ~3,381 lines (services + tests + auto-sync)
- **UI**: ~1,000 lines (components + plotboards integration)
- **Total**: ~4,381 lines
- **Tests**: 29 AI-specific tests + all integration tests passing (609 total)

**Key Achievements**:

1. ✅ AI service layer established with reusable patterns
2. ✅ IndexedDB schema extended with ai_suggestions and scene_metadata stores
3. ✅ Caching strategy validated (TTL-based with content hashing)
4. ✅ Type-safe Zod validation for all AI responses
5. ✅ UI patterns established (modals, panels, badges, analytics)
6. ✅ Plotboards deeply integrated with scene classification
7. ✅ Auto-sync metadata system with stale tracking and rate limiting
8. ✅ All features fully tested and deployed to feature branch

**Branch**: `feature/ai-wave-1-foundation` (ready for merge)

**Commits**: 8 total

- `fde213f` - Phase 1: Backend infrastructure
- `ef9d845`, `40fa06e`, `27e5370` - Individual feature implementations
- `48e544f`, `cf544c4` - Phase 2: UI integration
- `b0e4b16`, `c5dafe8`, `2fe44e7` - Phase 3: Plotboards integration
- `cf0fb8b` - Phase 4: Auto-sync metadata

**Next Steps**:

1. User testing and feedback collection
2. Merge `feature/ai-wave-1-foundation` to `main` after validation
3. Monitor usage metrics and AI costs
4. Document user-facing features in help/guide
5. Begin Wave 2 planning (Revision Coach, Semantic Analysis)

---

## Wave 2: Core Intelligence (2026 Q2) - 3-4 months

**Goal**: Build foundation for advanced features, deep manuscript understanding

### Features

#### 5. AI Revision Coach 🔧 Medium Complexity

**What**: On-demand sentence and paragraph improvements, clarity suggestions, tone adjustment, pacing recommendations

**Capabilities**:

- Selection-based suggestions
- Clarity and concision improvements
- Tone adjustment (formal, casual, dramatic)
- Pacing recommendations
- Style-preserving rewrites

**Technical Approach**:

- Service: `/src/services/ai/revisionCoach.ts`
- Input: Selected text + surrounding context
- UI: Right-click menu → "Get AI Suggestions", suggestions panel
- Storage: Cache suggestions in `ai_suggestions` store
- Accept/Reject workflow with undo

**Dependencies**: None
**Duration**: 3-4 weeks

---

#### 6. Manuscript-Level Semantic Analysis 🔧 Medium Complexity

**What**: Insights into theme prevalence, narrative motifs, repeated ideas, tonal consistency

**Outputs**:

- Theme extraction and prevalence scoring
- Motif identification
- Tonal consistency analysis
- Concept clustering

**Technical Approach**:

- Service: `/src/services/ai/semanticAnalysis.ts`
- Method: Embeddings API (OpenAI ada-002 or local sentence-transformers)
- Clustering: K-means or hierarchical clustering
- Storage: New IndexedDB store `semantic_clusters`
- UI: "Themes & Motifs" visualization panel

**Dependencies**: None
**Duration**: 3-4 weeks

---

#### 7. AI Scene Purpose Analyzer 🔧 Medium Complexity

**What**: Identifies narrative purpose of each scene, flags scenes lacking conflict/stakes/change

**Analysis**:

- Narrative function (setup, development, payoff)
- Conflict presence and intensity
- Stakes clarity
- Character change
- Plot advancement

**Technical Approach**:

- Service: `/src/services/ai/scenePurpose.ts`
- Extends Scene Classification
- Storage: `chapter.metadata.narrativePurpose`, `missingElements[]`
- UI: Scene purpose badge, warning indicators for missing elements
- Integration: Plot analysis panel

**Dependencies**: Scene Classification (#2)
**Duration**: 2 weeks

---

#### 8. AI Emotional and Tension Tracking 🔧 High Complexity

**What**: Plots emotional arcs, conflict intensity, and pacing curves with visualizations

**Metrics**:

- Emotional valence (-1 to +1)
- Tension intensity (0-10)
- Pacing score
- Emotional beats per chapter

**Technical Approach**:

- Service: `/src/services/ai/tensionTracking.ts`
- Sentiment analysis per chapter
- Storage: `tension_scores` IndexedDB store
- UI: New visualization component `TensionCurve.tsx` (similar to `PacingChart.tsx`)
- Real-time updates as chapters change

**Dependencies**: Scene Purpose Analyzer (#7)
**Duration**: 3-4 weeks

---

**Wave 2 Outcome**: Rich manuscript intelligence, diagnostic tooling, visualization foundation

---

## Wave 3: Character & World Intelligence (2026 Q3) - 3-4 months

**Goal**: Deep understanding of characters and worldbuilding

### Features

#### 9. Character Voice Modeling 🔧 High Complexity

**What**: Learns each character's linguistic patterns, provides voice-consistent rewrites and dialogue suggestions

**Analysis**:

- Vocabulary preferences
- Sentence structure patterns
- Speech rhythm (short/medium/long)
- Formality level
- Unique phrases and verbal tics

**Technical Approach**:

- Service: `/src/services/ai/characterVoice.ts`
- Extract all dialogue per character
- Build stylistic fingerprint
- Storage: New data model `CharacterVoiceProfile`, stored in `character_voice_profiles`
- UI: "Voice Analysis" tab in character detail view
- Few-shot learning: Use examples in prompts

**Dependencies**: Scene Classification (#2)
**Duration**: 4-6 weeks

---

#### 10. AI Voice-Preserving Rewrite Tools 🔧 High Complexity

**What**: Rewrite or expand text while preserving author's voice, diction, and rhythm

**Capabilities**:

- Expand/condense while preserving style
- Dialogue rewrite (character-specific)
- Prose rewrite (author voice)
- Before/after comparison

**Technical Approach**:

- Service: `/src/services/ai/voicePreservingRewrite.ts`
- Uses Character Voice Profiles in system prompt
- Author voice fingerprint (similar to character voice)
- UI: "Rewrite preserving voice" option in Revision Coach
- Accept/Reject workflow with explanation

**Dependencies**: Character Voice Modeling (#9)
**Duration**: 3 weeks

---

#### 11. Worldbuilding Auto-Extraction 🔧 Medium Complexity

**What**: Extracts currencies, factions, locations, technologies, species, and turns them into structured worldbuilding components

**Extraction**:

- Named Entity Recognition (NER)
- Entity categorization
- Entity linking to existing worldbuilding notes
- Auto-create new notes with approval workflow

**Technical Approach**:

- Service: `/src/services/ai/worldbuildingExtraction.ts`
- NER via LLM or spaCy.js
- Entity deduplication and merging
- Storage: Creates new worldbuilding notes with `auto-extracted` tag
- UI: "Review Extracted Entities" workflow, batch approve/reject

**Dependencies**: Semantic Analysis (#6)
**Duration**: 4 weeks

---

#### 12. AI Relationship Map Autogeneration 🔧 Medium Complexity

**What**: Builds and updates character interaction graphs, identifies relationship types and strength

**Relationship Types**:

- Family, romantic, friendship, rivalry, professional, antagonistic

**Metrics**:

- Interaction frequency
- Sentiment of interactions
- Relationship strength (0-10)
- Relationship arc over time

**Technical Approach**:

- Service: `/src/services/ai/relationshipMapping.ts`
- Parse character co-occurrences in scenes
- Sentiment analysis of interactions
- Storage: `relationship_graph` IndexedDB store
- UI: New component `RelationshipGraph.tsx` (using react-flow or d3)
- Interactive: Click edge to see supporting scenes

**Dependencies**: Character Voice Modeling (#9)
**Duration**: 3-4 weeks

---

**Wave 3 Outcome**: Character-aware AI, worldbuilding automation, relationship insights

---

## Wave 4: Advanced Reasoning (2026 Q4) - 4-5 months

**Goal**: Predictive and structural intelligence

### Features

#### 13. AI Timeline Consistency Check 🔧 Medium Complexity

**What**: Analyzes temporal references, flags contradictions, verifies continuity

**Checks**:

- Date/time consistency
- Event ordering
- Character age progression
- Seasonal/temporal logic
- Duration calculations

**Technical Approach**:

- Service: `/src/services/ai/timelineAnalysis.ts`
- Temporal expression extraction (regex + NLP)
- Build timeline graph
- Contradiction detection algorithm
- Integration with existing timeline view
- Storage: `timeline_events` IndexedDB store

**Dependencies**: None (but benefits from earlier features)
**Duration**: 4-6 weeks

---

#### 14. AI Beat Sheet Generator 2.0 🔧 Medium Complexity

**What**: Creates multiple structural interpretations using different frameworks

**Frameworks**:

- Save the Cat (15 beats)
- Hero's Journey (12 stages)
- Three-Act Structure
- Seven-Point Story Structure
- Kishōtenketsu (4 acts)

**Technical Approach**:

- Service: `/src/services/ai/beatSheetGenerator.ts`
- Template system for each framework
- Map chapters to beat positions
- Identify missing beats
- UI: "Structure Analysis" panel with framework selector
- Visual beat sheet with chapter mapping

**Dependencies**: Scene Purpose Analyzer (#7)
**Duration**: 3 weeks

---

#### 15. AI Project Advisor 🔧 Medium Complexity

**What**: Predicts completion timelines, monitors velocity, identifies energy patterns, recommends sprint targets

**Metrics**:

- Daily/weekly word count velocity
- Writing session patterns (time of day, duration)
- Productivity trends
- Completion predictions

**Recommendations**:

- Optimal writing times
- Sprint targets
- Rest recommendations
- Milestone predictions

**Technical Approach**:

- Service: `/src/services/ai/projectAdvisor.ts`
- Time-series analysis of existing `WritingSession[]` data
- Predictive modeling (linear regression, moving averages)
- UI: "Project Insights" dashboard
- Weekly/monthly reports

**Dependencies**: Writing sessions (already tracked)
**Duration**: 3-4 weeks

---

#### 16. Plot Navigator 🔧 High Complexity

**What**: Predicts upcoming beats, identifies unresolved arcs, warns when pacing drifts. Story GPS.

**Capabilities**:

- Predict next narrative beats
- Identify unresolved plot threads
- Detect pacing plateaus
- Suggest plot development paths
- Arc completion tracking

**Technical Approach**:

- Service: `/src/services/ai/plotNavigation.ts`
- Analyzes all previous features' data
- Predictive modeling for story progression
- UI: "Plot Navigator" panel (GPS-style interface)
- Visual arc tracking with completion percentages

**Dependencies**: Scene Purpose (#7) + Tension Tracking (#8)
**Duration**: 4-6 weeks

---

#### 17. Narrative Sandbox 🔧 Medium Complexity

**What**: Experiment with alternate outlines, endings, structures without affecting main manuscript

**Note**: This is primarily a product feature (versioning/branching) rather than a pure AI feature. It leverages the same data models as AI features and provides a safe experimentation space for AI-powered what-if scenarios, but its core implementation is project forking and comparison.

**Features**:

- Project forking (create branches)
- Branch comparison
- Merge capability
- Sandbox isolation

**Technical Approach**:

- Service: `/src/services/ai/narrativeSandbox.ts`
- Project forking system (like git branches)
- Storage: Forked projects in separate IndexedDB entries with `parentProjectId` reference
- UI: "Create Sandbox" button, branch switcher
- Comparison view between branches

**Dependencies**: None (Foundation)
**Duration**: 3-4 weeks

---

**Wave 4 Outcome**: Predictive intelligence, structural mastery, experimentation tools

---

## Wave 5: Series and World Systems (2027 Q1) - 3-4 months

**Goal**: Multi-book intelligence for series authors

### Features

#### 18. AI Series Bible Generator 🔧 High Complexity

**What**: Automatically builds and maintains canonical reference across multiple books

**Components**:

- Character arcs across series
- World rules and magic systems
- Languages and lore
- Setting history
- Canonical facts database

**Technical Approach**:

- New database: `inkwell-series`
- Service: `/src/services/ai/seriesBible.ts`
- Aggregate entities across multiple projects
- Data model: `SeriesBible` with cross-project references
- UI: New "Series" section in sidebar
- Auto-update as books change

**Dependencies**: All character, world, timeline features
**Duration**: 4-6 weeks

---

#### 19. AI Multi-Book Consistency Checking 🔧 Very High Complexity

**What**: Verifies continuity across manuscripts, identifies contradictions or regressions

**Checks**:

- Character trait consistency
- World rule violations
- Timeline contradictions across books
- Relationship regressions
- Plot continuity

**Technical Approach**:

- Service: `/src/services/ai/multibookConsistency.ts`
- Cross-project analysis engine
- Contradiction detection with severity scoring
- UI: "Series Consistency Report" with book references
- Link to specific chapters where contradictions occur

**Dependencies**: Series Bible (#18)
**Duration**: 6-8 weeks

---

#### 20. AI Encyclopedia Mode 🔧 High Complexity

**What**: Creates coherent, cross-linked entries for major characters, locations, factions, concepts

**Features**:

- Wiki-style knowledge base
- Automatic cross-linking
- Search and discovery
- Entity timelines
- Relationship graphs

**Technical Approach**:

- Service: `/src/services/ai/encyclopedia.ts`
- Builds on Series Bible + Worldbuilding Extraction
- Graph database structure (nodes = entities, edges = relationships)
- UI: New "Encyclopedia" view with search
- Component: `SeriesBibleExplorer.tsx`
- Export to markdown/wiki format

**Dependencies**: Series Bible (#18) + Worldbuilding Auto-Extraction (#11)
**Duration**: 4-6 weeks

---

**Wave 5 Outcome**: Series management, multi-book intelligence, unified knowledge base

---

## Wave 6: Real-Time Intelligence (2027 Q2-Q3) - 4-5 months

**Goal**: Live monitoring and assistance during writing

### Features

#### 21. Consistency Guardian 2.0 🔧 High Complexity

**What**: Real-time monitoring of continuity, voice drift, timeline stability, character motivation integrity

**Real-time Checks**:

- Voice drift detection (character and author)
- Timeline violations
- Character out-of-character moments
- Continuity breaks
- Motivation inconsistencies

**Technical Approach**:

- Service: `/src/services/ai/consistencyGuardian.ts`
- Real-time monitoring during writing (debounced)
- Rule engine for violations
- Non-intrusive notifications (subtle indicators)
- UI: Status bar indicator, expandable panel
- Performance: <100ms latency, Web Worker processing

**Dependencies**: Voice Modeling (#9), Timeline (#13), Tension Tracking (#8)
**Duration**: 6-8 weeks

---

#### 22. AI Draft-to-Draft Change Analyst 🔧 Medium Complexity

**What**: Explains differences between drafts, summarizes improvements, identifies unresolved issues

**Analysis**:

- What changed and why
- Improvements vs. regressions
- Unresolved issues
- Style evolution
- Structural changes

**Technical Approach**:

- Service: `/src/services/ai/draftAnalysis.ts`
- Extends snapshot comparison with AI insights
- Diff algorithm + LLM explanation
- UI: "Compare Drafts" view with AI commentary
- Highlight improvements in green, regressions in orange

**Dependencies**: Outline Comparison (#4)
**Duration**: 3 weeks

---

#### 23. AI Cover Concept Ideation 🔧 Medium Complexity

**What**: Generates moodboards and draft concepts for cover designers

**Outputs**:

- Moodboard (color palettes, imagery themes)
- Cover concept descriptions
- Visual references
- Genre-appropriate styling

**Technical Approach**:

- Service: `/src/services/ai/coverConcepts.ts`
- Input: Themes, tone, genre, key scenes
- Integration: DALL-E / Midjourney / Stable Diffusion APIs
- UI: "Cover Concepts" panel with gallery view
- Export: PDF moodboard for designers

**Dependencies**: Semantic Analysis (#6)
**Duration**: 2-3 weeks

---

#### 24. AI Market Positioning Assistant 🔧 Medium Complexity

**What**: Analyzes manuscript for genre alignment, comps, themes, and audience fit

**Analysis**:

- Genre classification (primary + sub-genres)
- Comparable titles (comps)
- Theme alignment with market trends
- Target audience identification
- Marketing angle suggestions

**Technical Approach**:

- Service: `/src/services/ai/marketPositioning.ts`
- Genre classification model
- Integration: Goodreads/Amazon APIs for comp matching
- Audience fit scoring
- UI: "Market Analysis" panel

**Dependencies**: Semantic Analysis (#6)
**Duration**: 3-4 weeks

---

**Wave 6 Outcome**: Real-time assistance, publishing readiness, market intelligence

---

## Wave 7: Creative Reasoning (2027 Q4) - 3-4 months

**Goal**: Advanced simulation and scenario exploration

### Features

#### 25. What-If Scenario Engine 🔧 Very High Complexity

**What**: Simulates alternate outcomes and presents ripple effects

**Scenarios**:

- Character death/survival
- Missing plot beats
- Altered motivations
- Structural changes
- Different endings

**Ripple Effects**:

- Character arc changes
- Plot thread impacts
- Relationship effects
- World consequence analysis

**Technical Approach**:

- Service: `/src/services/ai/scenarioSimulation.ts`
- Multi-turn LLM reasoning
- Causal modeling
- Simulation branching
- UI: "What-If Simulator" with scenario builder
- Impact visualization (tree/graph)
- Very expensive: Requires advanced prompting, multiple API calls

**Dependencies**: Everything from Waves 2-4
**Duration**: 8-12 weeks

---

**Wave 7 Outcome**: Experimental reasoning, scenario exploration, creative tools

---

## Wave 8: Private On-Device AI (2028+) - 12+ months

**Goal**: Complete privacy with local processing

### Features

#### 26. Local Mini-Language Model 🔧 Very High Complexity

**What**: Small, efficient, on-device model for line-level rewrites, voice retention, local reasoning

**Capabilities**:

- Line-level text improvement
- Voice-preserving rewrites
- Basic analysis (scene classification, sentiment)
- Offline operation

**Technical Approach**:

- Model selection: Llama 3.2 (1B/3B), Phi-3, Gemma 2
- Runtime: WebGPU (via transformers.js) or WASM (llama.cpp)
- Model quantization: 4-bit for performance
- Storage: IndexedDB for model weights (~2-6GB)
- Fallback: Cloud models when local fails
- Progressive enhancement

**Challenges**:

- Model size vs. quality tradeoff
- Device compatibility (GPU requirements)
- Download and initialization time
- Memory constraints

**Dependencies**: All features defined (to know what to optimize)
**Duration**: 3-6 months

---

#### 27. Encrypted Semantic Indexing 🔧 High Complexity

**What**: Semantic vectors stored locally for instant search, clustering, conceptual mapping

**Features**:

- Local embedding generation
- Encrypted vector storage
- Privacy-preserving search
- Concept mapping without cloud

**Technical Approach**:

- Local embeddings: transformers.js (sentence-transformers)
- Storage: IndexedDB with encryption layer
- Vector similarity search: Local implementation (cosine similarity)
- Optional: Homomorphic encryption for advanced privacy

**Dependencies**: Semantic Analysis (#6)
**Duration**: 2-3 months

---

#### 28. Offline Intelligent Revision 🔧 Very High Complexity

**What**: Full revision capability without cloud connectivity

**Capabilities**:

- All AI features running offline
- Local model inference
- Encrypted local storage
- No internet required

**Technical Approach**:

- Integration of Local Mini-LM (#26)
- All services updated to support local mode
- Fallback strategies for complex tasks
- UI: "Offline Mode" indicator
- Progressive enhancement: Degrade gracefully

**Dependencies**: Local Mini-LM (#26)
**Duration**: 3-4 months

---

**Wave 8 Outcome**: Complete privacy, offline capability, zero cloud dependency

---

## Technical Architecture

### New Infrastructure Required

#### 1. AI Service Layer

```
/src/services/ai/
  ├── chapterSynopsis.ts
  ├── sceneClassification.ts
  ├── revisionCoach.ts
  ├── semanticAnalysis.ts
  ├── characterVoice.ts
  ├── tensionTracking.ts
  ├── scenePurpose.ts
  ├── timelineAnalysis.ts
  ├── relationshipMapping.ts
  ├── plotNavigation.ts
  ├── projectAdvisor.ts
  ├── beatSheetGenerator.ts
  ├── narrativeSandbox.ts
  ├── seriesBible.ts
  ├── multibookConsistency.ts
  ├── encyclopedia.ts
  ├── consistencyGuardian.ts
  ├── draftAnalysis.ts
  ├── coverConcepts.ts
  ├── marketPositioning.ts
  ├── scenarioSimulation.ts
  ├── publishingTools.ts
  ├── outlineComparison.ts
  ├── voicePreservingRewrite.ts
  ├── worldbuildingExtraction.ts
  └── shared/
      ├── promptTemplates.ts
      ├── responseValidation.ts
      ├── caching.ts
      └── types.ts
```

#### 2. Extended IndexedDB Schema

Add to `/src/services/dbSchema.ts`:

```typescript
// AI-generated content and analysis
ai_suggestions: {
  (id, projectId, chapterId, type, content, timestamp, accepted, userFeedback);
}

scene_metadata: {
  (chapterId, sceneType, purpose, missingElements, emotionalScore, tensionScore, narrativeFunction);
}

character_voice_profiles: {
  (characterId, vocabulary, sentencePatterns, speechRhythm, formalityLevel, examples);
}

semantic_clusters: {
  (projectId, themes, motifs, concepts, toneConsistency, timestamp);
}

relationship_graph: {
  (projectId, nodes, edges, interactionCounts, lastUpdated);
}

tension_scores: {
  (chapterId, emotionalScore, tensionScore, pacingScore, timestamp);
}

timeline_events: {
  (projectId, events, contradictions, temporalGraph, lastAnalyzed);
}

series_bible: {
  (seriesId, projectIds, characters, worldRules, timeline, canonicalFacts, lastUpdated);
}

beat_sheet_analysis: {
  (projectId, framework, beats, chapterMapping, missingBeats, timestamp);
}
```

#### 3. New Data Models

```typescript
// /src/types/ai.ts

interface SceneMetadata {
  chapterId: string;
  sceneType: 'conflict' | 'reveal' | 'transition' | 'action' | 'emotional' | 'setup' | 'resolution';
  narrativePurpose: string;
  missingElements: string[];
  emotionalScore: number; // -1 to +1
  tensionScore: number; // 0 to 10
  narrativeFunction: 'setup' | 'development' | 'payoff';
}

interface CharacterVoiceProfile {
  characterId: string;
  vocabulary: string[];
  sentencePatterns: string[];
  speechRhythm: 'short' | 'medium' | 'long';
  formalityLevel: number; // 0-10
  examples: string[];
  lastAnalyzed: number;
}

interface RelationshipGraph {
  projectId: string;
  nodes: { id: string; name: string; type: string }[];
  edges: {
    source: string;
    target: string;
    type: 'family' | 'romantic' | 'friendship' | 'rivalry' | 'professional' | 'antagonistic';
    strength: number; // 0-10
    sentiment: number; // -1 to +1
    interactions: number;
  }[];
  lastUpdated: number;
}

interface SeriesBible {
  seriesId: string;
  name: string;
  projectIds: string[];
  characters: Map<string, CanonicalCharacter>;
  worldRules: Map<string, WorldRule>;
  timeline: TimelineEvent[];
  contradictions: Contradiction[];
  lastUpdated: number;
}

interface BeatSheetAnalysis {
  projectId: string;
  framework: 'save-the-cat' | 'heros-journey' | 'three-act' | 'seven-point' | 'kishotenketsu';
  beats: Beat[];
  chapterMapping: Map<string, string[]>; // beatId -> chapterIds
  missingBeats: string[];
  timestamp: number;
}
```

#### 4. Visualization Components

```
/src/components/Visualizations/
  ├── TensionCurve.tsx           // Emotional/tension over chapters
  ├── RelationshipGraph.tsx      // Character interaction map
  ├── ThemeCloud.tsx             // Theme prevalence
  ├── BeatSheetMap.tsx           // Beat alignment visualization
  ├── SeriesBibleExplorer.tsx    // Multi-book knowledge base
  └── PlotNavigator.tsx          // Story GPS interface
```

#### 5. AI Settings Extension

```typescript
interface AiSettings {
  // Existing
  provider: 'anthropic' | 'openai' | 'google' | 'local';
  model: string;
  apiKey?: string;

  // New feature toggles
  features: {
    enableRevisionCoach: boolean;
    enableVoiceModeling: boolean;
    enableConsistencyGuardian: boolean;
    enableLocalProcessing: boolean;
    enableRealTimeAnalysis: boolean;
  };

  // Local model configuration
  localModel?: {
    modelId: string;
    modelPath: string;
    modelSize: '1B' | '3B' | '7B';
    device: 'gpu' | 'cpu';
    loaded: boolean;
  };

  // Privacy settings
  privacy: {
    preferLocalProcessing: boolean;
    allowCloudFallback: boolean;
    encryptCache: boolean;
  };
}
```

#### 6. Prompt Engineering System

```typescript
// /src/services/ai/shared/promptTemplates.ts

export const PROMPTS = {
  chapterSynopsis: (chapter: Chapter) => ({
    system: `You are an expert literary analyst...`,
    user: `Analyze this chapter and provide...`,
    schema: ChapterSynopsisSchema,
  }),

  sceneClassification: (content: string) => ({
    system: `You are a narrative structure expert...`,
    user: `Classify this scene into one of: conflict, reveal...`,
    schema: SceneClassificationSchema,
  }),

  voiceAnalysis: (character: Character, dialogue: string[]) => ({
    system: `You are a dialogue and voice expert...`,
    user: `Analyze this character's voice patterns...`,
    schema: VoiceProfileSchema,
  }),

  // With validation
  withSchema: <T>(prompt: string, schema: ZodSchema<T>) => ({
    prompt,
    schema,
    validate: (response: unknown) => schema.parse(response),
  }),
};
```

#### 7. Background Processing

```typescript
// /src/workers/aiProcessor.worker.ts
// Web Worker for expensive operations:
// - Semantic embedding generation
// - Local model inference
// - Large manuscript analysis
// - Cross-book consistency checking
```

---

## Implementation Principles

### 1. Privacy First

- Local processing preferred
- Encrypted storage
- User controls cloud usage
- Transparent data handling

### 2. Author Control

- AI suggests, never overwrites
- Accept/Reject workflows
- Undo always available
- Explanations for all suggestions

### 3. Voice Preservation

- Learn author's style
- Maintain character voices
- Never homogenize
- Style-aware rewrites

### 4. Progressive Enhancement

- Features work independently
- Graceful degradation
- Optional cloud features
- Offline capability

### 5. Performance

- Aggressive caching
- Background processing
- Incremental analysis
- Lazy loading

---

## Success Metrics

### Wave 1-2 (Foundation)

- **Adoption**: 80%+ users try synopsis generator
- **Performance**: <2s generation time
- **Accuracy**: 70%+ correct scene classification
- **Usage**: 50%+ use Revision Coach weekly

### Wave 3-4 (Intelligence)

- **Quality**: 75%+ "sounds like character" (voice modeling)
- **Accuracy**: 90%+ accurate relationship connections
- **Utility**: 60%+ find Plot Navigator suggestions useful
- **Performance**: Real-time features <100ms latency

### Wave 5-6 (Series & Real-Time)

- **Accuracy**: 100% contradiction detection in Series Bible
- **Timeline**: 95%+ accuracy in timeline consistency
- **Adoption**: 40%+ series authors use Series Bible

### Wave 7-8 (Advanced & Privacy)

- **Privacy**: 100% offline capable for all features
- **Quality**: Local model achieves 90% of cloud quality
- **Performance**: Local inference <500ms

---

## Risk Mitigation

### Technical Risks

1. **AI Cost**: Aggressive caching, batch processing, user API keys
2. **Performance**: Web Workers, progressive loading, lazy analysis
3. **Accuracy**: Human-in-the-loop validation, confidence scores
4. **Privacy**: Local-first architecture, encrypted storage

### Product Risks

1. **Feature Creep**: Strict wave boundaries, no skipping ahead
2. **User Confusion**: Progressive disclosure, feature flags, onboarding
3. **Over-Automation**: Always suggest, never auto-apply
4. **Quality**: User feedback loops, A/B testing

### Business Risks

1. **Resource Constraints**: Start with Wave 1, validate before continuing
2. **Market Timing**: Quick wins first, advanced features later
3. **Competition**: Differentiate on privacy and depth

---

## Key Decisions Required

### Technical Decisions

1. **Primary AI Provider**: Anthropic Claude (recommended - best for creative writing)
2. **Embedding Strategy**: OpenAI ada-002 for semantic analysis
3. **Local Model**: Llama 3.2 3B or Phi-3 (Wave 8)
4. **Caching Strategy**: IndexedDB with 24-hour expiry, invalidate on content change
5. **Real-time Processing**: Debounced (500ms) with Web Workers

### Product Decisions

1. **Wave 1 Scope**: All 4 features or start with 2?
2. **Pricing Model**: Free tier limits, paid for advanced features?
3. **Beta Program**: Invite series authors for Wave 5 testing
4. **Feature Flags**: Enable/disable per user for gradual rollout

### Resource Planning

1. **Team Size**: 2-3 engineers per wave
2. **Budget**: API costs (estimate $X/user/month)
3. **Timeline Flexibility**: Can phases shift based on feedback?

---

## Next Steps

### Immediate (Now)

1. ✅ Validate roadmap with stakeholders
2. ⬜ Finalize Wave 1 scope (all 4 or subset?)
3. ⬜ Set up AI cost monitoring
4. ⬜ Create feature flags infrastructure

### Wave 1 Kickoff (2026 Q1)

1. ⬜ Implement IndexedDB schema extensions
2. ⬜ Build AI service layer foundation
3. ⬜ Create prompt template system
4. ⬜ Develop Chapter Synopsis Generator (Feature #1)
5. ⬜ Ship and gather feedback

### Ongoing

- User feedback collection after each wave
- Cost analysis and optimization
- Performance monitoring
- Accuracy validation with test manuscripts

---

## Appendix

### Related Documentation

- [Current AI Architecture](./src/ai/README.md) (if exists)
- [Data Models](./src/types/project.ts)
- [Plot Analysis Service](./src/services/plotAnalysis/)

### References

- [Anthropic Claude API](https://docs.anthropic.com/)
- [OpenAI API](https://platform.openai.com/docs)
- [transformers.js](https://huggingface.co/docs/transformers.js) (local models)
- [llama.cpp](https://github.com/ggerganov/llama.cpp) (WASM runtime)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-21
**Maintained By**: Product & Engineering
**Review Cycle**: Monthly during active development
