// src/utils/exportFormats.ts
import { ExportFormat } from '../types/writing';

interface ExportConfig {
  ext: string;
  mime: string;
  formatter: (title: string, content: string) => string;
}

export const exportFormats: Record<ExportFormat, ExportConfig> = {
  markdown: {
    ext: 'md',
    mime: 'text/markdown',
    formatter: (title, content) => `# ${title}\n\n${content}`,
  },
  txt: {
    ext: 'txt',
    mime: 'text/plain',
    formatter: (title, content) => {
      const underline = '='.repeat(title.length);
      return `${title}\n${underline}\n\n${content}`;
    },
  },
  docx: {
    ext: 'docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    formatter: (title, content) => `${title}\n\n${content}`,
  },
  html: {
    ext: 'html',
    mime: 'text/html',
    formatter: (title, content) => {
      return `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <meta charset="utf-8">
</head>
<body>
  <h1>${title}</h1>
  <div>${content.replace(/\n/g, '<br>')}</div>
</body>
</html>`;
    },
  },
  pdf: {
    ext: 'pdf',
    mime: 'application/pdf',
    formatter: (title, content) => {
      return `PDF Export not implemented - use print to PDF instead.\n\n${title}\n\n${content}`;
    },
  },
};
