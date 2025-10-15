// @ts-nocheck
// src/services/exportService.ts
import { storageService } from './storageService';

export interface ExportOptions {
  format: string;
  includeMetadata?: boolean;
  includeSynopsis?: boolean;
  includeCharacterNotes?: boolean;
  chapterSeparator?: string;
  sceneSeparator?: string;
  customTitle?: string;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  downloadUrl?: string;
  error?: string;
}

export enum ExportFormat {
  MARKDOWN = 'markdown',
  TXT = 'txt',
  PDF = 'pdf',
  DOCX = 'docx',
}

class ExportService {
  // Generate formatted content from project
  private async generateContent(projectId: string, options: ExportOptions): Promise<string> {
    const project = storageService.loadProject(projectId);
    const chapters = await storageService.loadWritingChapters(projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    let content = '';

    // Title page
    if (options.includeMetadata) {
      content += `# ${options.customTitle || project.name}\n\n`;
      if (project.description) {
        content += `${project.description}\n\n`;
      }
      content += `*Generated on ${new Date().toLocaleDateString()}*\n\n`;
      content += '---\n\n';
    }

    // Synopsis
    if (options.includeSynopsis && project.description) {
      content += '## Synopsis\n\n';
      content += `${project.description}\n\n`;
      content += '---\n\n';
    }

    // Character notes (if implemented)
    if (options.includeCharacterNotes && (project as any).characters) {
      content += '## Characters\n\n';
      const characters = (project as any).characters || [];
      characters.forEach((char: any) => {
        content += `### ${char.name}\n`;
        content += `${char.description || 'No description'}\n\n`;
      });
      content += '---\n\n';
    }

    // Main content
    chapters.forEach((chapter, chapterIndex) => {
      // Chapter header
      content += `# ${chapter.title}\n\n`;

      // Chapter scenes
      chapter.scenes.forEach((scene: Scene, sceneIndex: number) => {
        if (scene.content) {
          // Scene separator (optional)
          if (sceneIndex > 0 && options.sceneSeparator) {
            content += `${options.sceneSeparator}\n\n`;
          }

          // Scene title (if different from default)
          if (scene.title !== `Scene ${sceneIndex + 1}`) {
            content += `## ${scene.title}\n\n`;
          }

          // Scene content
          content += `${scene.content}\n\n`;
        }
      });

      // Chapter separator
      if (chapterIndex < chapters.length - 1 && options.chapterSeparator) {
        content += `${options.chapterSeparator}\n\n`;
      }
    });

    return content.trim();
  }

  // Export as Markdown
  async exportMarkdown(projectId: string, options: ExportOptions): Promise<ExportResult> {
    try {
      const content = await this.generateContent(projectId, options);
      const project = storageService.loadProject(projectId);

      if (!project) {
        throw new Error('Project not found');
      }

      const filename = `${this.sanitizeFilename(options.customTitle || project.name)}.md`;

      // Create download
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      return {
        success: true,
        filename,
        downloadUrl: url,
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  // Export as Plain Text
  async exportPlainText(projectId: string, options: ExportOptions): Promise<ExportResult> {
    try {
      const rawContent = await this.generateContent(projectId, options);

      // Convert markdown to plain text (basic conversion)
      const content = rawContent
        .replace(/^#{1,6}\s+/gm, '') // Remove markdown headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text - FIXED LINE 146
        .replace(/---+/g, '* * *') // Convert horizontal rules
        .replace(/\n{3,}/g, '\n\n'); // Normalize line breaks

      const project = storageService.loadProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const filename = `${this.sanitizeFilename(options.customTitle || project.name)}.txt`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 1000);

      return {
        success: true,
        filename,
        downloadUrl: url,
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  // Export as PDF (using browser print)
  async exportPDF(projectId: string, options: ExportOptions): Promise<ExportResult> {
    try {
      const content = await this.generateContent(projectId, options);
      const project = storageService.loadProject(projectId);

      if (!project) {
        throw new Error('Project not found');
      }

      // Create a printable HTML version
      const htmlContent = this.markdownToHTML(content);
      const printWindow = window.open('', '_blank');

      if (!printWindow) {
        throw new Error('Popup blocked - please allow popups for PDF export');
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${options.customTitle || project.name}</title>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              font-size: 12pt;
              line-height: 1.6;
              max-width: 8.5in;
              margin: 1in auto;
              padding: 0;
              color: #000;
            }
            h1 {
              font-size: 18pt;
              font-weight: bold;
              margin: 24pt 0 12pt 0;
              page-break-after: avoid;
            }
            h2 {
              font-size: 14pt;
              font-weight: bold;
              margin: 18pt 0 9pt 0;
              page-break-after: avoid;
            }
            p {
              margin: 0 0 12pt 0;
              text-align: justify;
            }
            .page-break {
              page-break-before: always;
            }
            @media print {
              body { margin: 1in; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="position: fixed; top: 10px; right: 10px; background: #007cba; color: white; padding: 10px; border-radius: 5px; z-index: 1000;">
            <button onclick="window.print()" style="background: none; border: none; color: white; cursor: pointer;">📄 Print to PDF</button>
            <button onclick="window.close()" style="background: none; border: none; color: white; cursor: pointer; margin-left: 10px;">✖ Close</button>
          </div>
          ${htmlContent}
        </body>
        </html>
      `);

      printWindow.document.close();

      // Auto-trigger print dialog after a short delay
      setTimeout(() => {
        printWindow.print();
      }, 500);

      return {
        success: true,
        filename: `${this.sanitizeFilename(options.customTitle || project.name)}.pdf`,
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'PDF export failed',
      };
    }
  }

  // Export as DOCX (placeholder implementation)
  async exportDOCX(projectId: string, options: ExportOptions): Promise<ExportResult> {
    // For now, we'll export as rich text that can be opened in Word
    try {
      const content = await this.generateContent(projectId, options);
      const project = storageService.loadProject(projectId);

      if (!project) {
        throw new Error('Project not found');
      }

      // Convert markdown to RTF format
      const rtfContent = this.markdownToRTF(content);
      const filename = `${this.sanitizeFilename(options.customTitle || project.name)}.rtf`;

      const blob = new Blob([rtfContent], { type: 'application/rtf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 1000);

      return {
        success: true,
        filename,
        downloadUrl: url,
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'DOCX export failed',
      };
    }
  }

  // Utility: Convert markdown to HTML
  private markdownToHTML(markdown: string): string {
    return markdown
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/---+/g, '<hr>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.*)$/gm, '<p>$1</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p><h/g, '<h')
      .replace(/<\/h([1-6])><\/p>/g, '</h$1>');
  }

  // Utility: Convert markdown to RTF
  private markdownToRTF(markdown: string): string {
    let rtf = '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}\\f0\\fs24 ';

    const lines = markdown.split('\n');
    lines.forEach((line) => {
      if (line.startsWith('# ')) {
        rtf += `\\fs32\\b ${line.substring(2)}\\b0\\fs24\\par `;
      } else if (line.startsWith('## ')) {
        rtf += `\\fs28\\b ${line.substring(3)}\\b0\\fs24\\par `;
      } else if (line.trim() === '') {
        rtf += '\\par ';
      } else {
        // Simple text with basic formatting
        const formatted = line
          .replace(/\*\*(.*?)\*\*/g, '\\b $1\\b0 ')
          .replace(/\*(.*?)\*/g, '\\i $1\\i0 ');
        rtf += `${formatted}\\par `;
      }
    });

    rtf += '}';
    return rtf;
  }

  // Utility: Sanitize filename
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9\s\-_]/gi, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
  }

  // Main export method
  async exportProject(
    projectId: string,
    format: string,
    options: Partial<ExportOptions> = {},
  ): Promise<ExportResult> {
    const fullOptions: ExportOptions = {
      format,
      includeMetadata: true,
      includeSynopsis: true,
      includeCharacterNotes: false,
      chapterSeparator: '\n\n---\n\n',
      sceneSeparator: '\n\n* * *\n\n',
      ...options,
    };

    switch (format) {
      case ExportFormat.MARKDOWN:
        return this.exportMarkdown(projectId, fullOptions);
      case ExportFormat.TXT:
        return this.exportPlainText(projectId, fullOptions);
      case ExportFormat.PDF:
        return this.exportPDF(projectId, fullOptions);
      case ExportFormat.DOCX:
        return this.exportDOCX(projectId, fullOptions);
      default:
        return {
          success: false,
          filename: '',
          error: `Unsupported format: ${format}`,
        };
    }
  }
}

export const exportService = new ExportService();
