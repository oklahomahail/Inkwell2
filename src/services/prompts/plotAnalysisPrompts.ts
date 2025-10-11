import type { AnalyzeBoardInput } from '@/types/plotAnalysis';
export const plotAnalysisSystem = `You are an expert story editor. Analyze structure, pacing, continuity, and character consistency. Output strict JSON only.`;
export const plotAnalysisUser = (_payload: AnalyzeBoardInput) =>
  ` ProjectId: ${payload.projectId} Structure: ${payload.structure ?? 'three_act'} Scenes: ${payload.scenes
    .sort((a, _b) => a.order - b.order)
    .map((s) => `- [${s.order}] ${s.id} :: ${s.title}\n${s.text}`)
    .join(
      '\n\n',
    )} Return JSON with: { "summary": "...", "qualityScore": 0..100, "issues": [ { "id": "string", "type": "plot_hole|pacing_spike|continuity_gap|character_inconsistency|timeline_conflict|tone_shift", "severity": "low|medium|high", "title": "string", "description": "string", "sceneIds": ["..."], "suggestions": ["..."] } ], "pacing": [{"sceneId": "...", "index": 0, "tension": 0..1, "pace": 0..1}], "conflictHeatmap": [{"row": 0, "col": 0, "value": 0..1}] } `;
