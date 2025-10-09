// src/features/writing/ExportMenu.tsx
import { Document, Packer, Paragraph } from 'docx';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
import JSZip from 'jszip';
import React from 'react';

interface ExportMenuProps {
  html: string; // rendered HTML of the story
  plain: string; // plain text
  title?: string;
}

export function ExportMenu({ html, plain, title = 'My Story' }: ExportMenuProps) {
  const exportToDocx = async () => {
    try {
      const doc = new Document({
        sections: [
          {
            children: plain.split('\n\n').map((p) => new Paragraph(p)),
          },
        ],
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${title}.docx`);
    } catch (error) {
      console.error('Error exporting to DOCX:', error);
    }
  };

  const exportToPdf = async () => {
    try {
      const el = document.createElement('div');
      el.innerHTML = html;
      await html2pdf()
        .from(el)
        .set({
          filename: `${title}.pdf`,
          margin: 10,
          format: [210, 297], // A4 size in mm
          orientation: 'portrait',
        })
        .save();
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
  };

  const exportToEpub = async () => {
    try {
      // Minimal EPUB v3 package via JSZip
      const zip = new JSZip();
      zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
      zip.file(
        'META-INF/container.xml',
        `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`,
      );

      const xhtml = `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
  <title>${title}</title>
  <style>
    body { font-family: Georgia, serif; font-size: 14pt; line-height: 1.6; margin: 2em; }
    h1, h2, h3 { color: #333; }
    p { margin-bottom: 1em; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${html}
</body>
</html>`;

      zip.folder('OEBPS')!.file('text.xhtml', xhtml);
      zip.folder('OEBPS')!.file(
        'nav.xhtml',
        `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <head><title>${title}</title></head>
  <body><nav epub:type="toc"><ol><li><a href="text.xhtml">Start</a></li></ol></nav></body>
</html>`,
      );

      zip.folder('OEBPS')!.file(
        'content.opf',
        `<?xml version="1.0" encoding="utf-8"?>
<package version="3.0" unique-identifier="pub-id" xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${title}</dc:title>
    <dc:language>en</dc:language>
    <dc:identifier id="pub-id">urn:uuid:${crypto.randomUUID()}</dc:identifier>
    <meta property="dcterms:modified">${new Date().toISOString()}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="c1" href="text.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine><itemref idref="c1"/></spine>
</package>`,
      );

      const blob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/epub+zip',
      });
      saveAs(blob, `${title}.epub`);
    } catch (error) {
      console.error('Error exporting to EPUB:', error);
    }
  };

  return (
    <div className="inline-flex gap-2">
      <button onClick={exportToDocx} className="ink-btn ink-btn-secondary">
        Export .docx
      </button>
      <button onClick={exportToPdf} className="ink-btn ink-btn-secondary">
        Export .pdf
      </button>
      <button onClick={exportToEpub} className="ink-btn ink-btn-secondary">
        Export .epub
      </button>
    </div>
  );
}
