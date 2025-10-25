export const PRINT_CSS = `
@page { size: A4; margin: 1in; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { font-family: Georgia, 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.15; color: #111; }
h1, h2, h3 { page-break-after: avoid; }
h1 { font-size: 20pt; margin: 0 0 8pt; }
h2 { font-size: 14pt; margin: 18pt 0 6pt; }
p { margin: 0 0 10pt; }
.page-break { page-break-before: always; }
.avoid-break { break-inside: avoid; }
.header, .footer { position: fixed; left: 0; right: 0; color: #666; font-size: 10pt; }
.header { top: 0.4in; text-align: center; }
.footer { bottom: 0.4in; text-align: center; }
.footer .pnum:after { content: counter(page); }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { border-bottom: 1px solid #ddd; padding: 6pt 0; font-size: 11pt; }
.badge { display: inline-block; padding: 2pt 6pt; border-radius: 4pt; font-size: 10pt; }
.badge.grade-A { background: #DCFCE7; color: #166534; }
.badge.grade-B { background: #DBEAFE; color: #1E40AF; }
.badge.grade-C { background: #FEF9C3; color: #854D0E; }
.badge.grade-D { background: #FFEDD5; color: #9A3412; }
.badge.grade-F { background: #FEE2E2; color: #991B1B; }
`;
