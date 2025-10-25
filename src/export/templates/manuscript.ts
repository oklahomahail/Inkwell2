import { PRINT_CSS } from '../styles/printCss';

interface BookData {
  title: string;
  author?: string;
  chapters: { title: string; text: string }[];
}

export function renderManuscriptHTML(book: BookData) {
  const title = escapeHtml(book.title || 'Untitled Manuscript');
  const author = escapeHtml(book.author || '');

  const chapters =
    book.chapters
      ?.map((c, i) => {
        const h = escapeHtml(c.title || `Chapter ${i + 1}`);
        const body = paragraphize(c.text || '');
        const pageBreak = i === 0 ? '' : 'page-break ';
        return `
      <section class="${pageBreak}avoid-break">
        <h1>${h}</h1>
        ${body}
      </section>
    `;
      })
      .join('\n') || '<p>(No chapters)</p>';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  <div class="header">${title}${author ? ' — ' + author : ''}</div>
  <div class="footer">Page <span class="pnum"></span></div>

  <section class="avoid-break">
    <h1>${title}</h1>
    ${author ? `<p>By ${author}</p>` : ''}
  </section>

  ${chapters}
</body>
</html>
`;
}

function paragraphize(text: string) {
  const safe = escapeHtml(text).replace(/\r\n/g, '\n');
  const paras = safe.split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`);
  return paras.join('\n');
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
