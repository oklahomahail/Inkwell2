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
    formatter: (title, content) => `${title}\n\n${content}`, // Placeholder — just plain text for now
  },
};
