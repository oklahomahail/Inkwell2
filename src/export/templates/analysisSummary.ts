import { PRINT_CSS } from '../styles/printCss';

interface Scorecard {
  structure: number;
  pacing: number;
  scenePurpose: number;
  coverage: number;
  grade: string;
}
interface Insight {
  finding: string;
  suggestion: string;
  affectedChapters: number[];
}

export function renderAnalysisSummaryHTML(input: {
  title: string;
  author?: string;
  scorecard?: Scorecard;
  insights: Insight[];
  pacingSVG?: string; // data URL (optional)
  arcsSVG?: string; // data URL (optional)
}) {
  const title = escapeHtml(input.title || 'Analysis Summary');
  const author = input.author ? ` — ${escapeHtml(input.author)}` : '';

  const sc = input.scorecard;
  const scoreRow = sc
    ? `
      <tr><th>Structure</th><td>${sc.structure}</td></tr>
      <tr><th>Pacing</th><td>${sc.pacing}</td></tr>
      <tr><th>Scene Purpose</th><td>${sc.scenePurpose}</td></tr>
      <tr><th>Coverage</th><td>${sc.coverage}</td></tr>
    `
    : `<tr><td colspan="2">Scorecard unavailable</td></tr>`;

  const gradeBadge = sc
    ? `<span class="badge grade-${gradeClass(sc.grade)}">Grade ${escapeHtml(sc.grade)}</span>`
    : '';

  const insights = (input.insights || [])
    .slice(0, 5)
    .map(
      (ins) => `
    <li class="avoid-break">
      <strong>${escapeHtml(ins.finding)}</strong>
      <div>${escapeHtml(ins.suggestion)}</div>
      ${ins.affectedChapters?.length ? `<div>Chapters: ${ins.affectedChapters.join(', ')}</div>` : ''}
    </li>
  `,
    )
    .join('');

  const pacingImg = input.pacingSVG
    ? `<img alt="Pacing chart" src="${input.pacingSVG}" style="max-width:100%; height:auto;" />`
    : '';
  const arcsImg = input.arcsSVG
    ? `<img alt="Arc heatmap" src="${input.arcsSVG}" style="max-width:100%; height:auto;" />`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title} — Analysis</title>
  <style>${PRINT_CSS}</style>
  <style>
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16pt; }
    .card { padding: 10pt 0; }
    .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 12pt; }
    @media print { .cols { grid-template-columns: 1fr 1fr; } }
  </style>
</head>
<body>
  <div class="header">${title}${author}</div>
  <div class="footer">Page <span class="pnum"></span></div>

  <section class="avoid-break">
    <h1>Analysis Summary</h1>
    ${gradeBadge}
  </section>

  <section class="cols">
    <div class="card">
      <h2>Scorecard</h2>
      <table class="table">
        <tbody>
          ${scoreRow}
        </tbody>
      </table>
    </div>
    <div class="card">
      <h2>Top Insights</h2>
      <ol style="margin:0; padding-left:16pt;">
        ${insights || '<li>No insights available</li>'}
      </ol>
    </div>
  </section>

  <section class="charts page-break avoid-break">
    <div>
      <h2>Pacing</h2>
      ${pacingImg || '<div>Chart unavailable</div>'}
    </div>
    <div>
      <h2>Arcs</h2>
      ${arcsImg || '<div>Chart unavailable</div>'}
    </div>
  </section>
</body>
</html>
`;
}

function gradeClass(g: string) {
  const s = (g || '').toUpperCase();
  return s === 'A' ? 'A' : s === 'B' ? 'B' : s === 'C' ? 'C' : s === 'D' ? 'D' : 'F';
}
function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (m) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[m]!,
  );
}
