# PDF Export Feature

Export your manuscript or plot analysis to professional PDF documents.

## Quick Start

**Keyboard Shortcut**: `Cmd+E` (Mac) / `Ctrl+E` (Windows/Linux)

Or click the **Export** button in the top navigation bar.

## Available Templates

### 1. Manuscript Standard

Professional manuscript format suitable for submissions and sharing.

**Features**:

- Serif body font (Georgia, Times New Roman, 12pt)
- 1.15 line spacing with 1-inch margins
- A4 page size
- Headers with title and author
- Footers with page numbers and project name
- Chapter titles on new pages
- Orphan and widow control

**Use Cases**:

- First drafts for beta readers
- Submission to writing groups
- Archive copies
- Print-ready manuscripts

### 2. Analysis Summary

One-page overview of your plot analysis results.

**Features**:

- Letter-graded scorecard table (Structure, Pacing, Scene Purpose, Coverage)
- Top 5 insights with severity indicators
- Pacing chart visualization
- Arc heatmap visualization
- Color-coded grade badges (A-F scale)

**Use Cases**:

- Quick reference for revision planning
- Sharing analysis results with editors
- Progress tracking over multiple drafts
- Presentation materials

## How to Export

1. **Open Export Dialog**
   - Press `Cmd+E` or click Export button
   - Select your project if not already active

2. **Choose Template**
   - **Manuscript Standard**: Full manuscript with all chapters
   - **Analysis Summary**: Plot analysis results (requires running Plot Analysis first)

3. **Generate PDF**
   - Click "Generate PDF"
   - Wait for generation (typically 2-5 seconds for manuscripts, <1s for summaries)
   - PDF downloads automatically

## Technical Details

### Export API

- **Endpoint**: `/api/export/pdf`
- **Method**: POST
- **Engine**: Puppeteer (headless Chromium)
- **Max payload**: 10MB HTML
- **Timeout**: 30 seconds
- **Memory**: 1GB allocated

### Print CSS

Professional print styling includes:

- `@page` rules for margins and size
- Proper page break controls
- Header/footer positioning
- Font optimization for print
- Color-accurate rendering

### File Naming

- Manuscript: `{ProjectTitle}.pdf`
- Analysis: `{ProjectTitle}-summary.pdf`
- Special characters sanitized to underscores
- Max filename length: 120 characters

## Telemetry

Export events are tracked for performance monitoring:

**Events**:

- `export_started`: Template selection
- `export_succeeded`: Completion time, file size
- `export_failed`: Error details

**Metrics**:

- Template ID (manuscript / analysis-summary)
- Project ID
- Duration (milliseconds)
- File size (KB)

## Limitations

### Current Limitations

- No DOCX export (PDF only)
- Analysis export requires Plot Analysis to be run first
- Internet connection required for serverless function
- Maximum 30-second generation time

### Manuscript Template

- No custom fonts (system fonts only)
- Fixed page margins (1 inch)
- No table of contents generation
- No inline images support

### Analysis Template

- Single page only
- Top 5 insights maximum
- Static chart images (no interactivity)
- Requires SVG chart data

## Troubleshooting

### "Export failed" Error

**Cause**: Network issue or serverless function timeout

**Solution**:

1. Check internet connection
2. Try again with shorter manuscript
3. Report if persists

### Analysis Export Disabled

**Cause**: Plot Analysis not run yet

**Solution**:

1. Navigate to Plot Analysis panel
2. Click "Run Analysis"
3. Wait for completion
4. Return to Export dialog

### PDF Won't Open

**Cause**: Corrupt download or unsupported viewer

**Solution**:

1. Re-download PDF
2. Try different PDF viewer (Preview, Adobe, browser)
3. Check file size (should be > 1KB)

## Future Enhancements

Planned features for future releases:

- [ ] DOCX export support
- [ ] Custom fonts and styling
- [ ] Table of contents generation
- [ ] Inline image support
- [ ] Multi-page analysis reports
- [ ] Export templates customization
- [ ] Batch export multiple projects
- [ ] Direct email sharing
- [ ] Cloud storage integration

## API Reference

### POST /api/export/pdf

**Request Body**:

```json
{
  "html": "<html>...</html>",
  "meta": {
    "filename": "my-manuscript.pdf"
  }
}
```

**Response Headers**:

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="my-manuscript.pdf"
Content-Length: {size in bytes}
```

**Error Codes**:

- `400`: Missing or invalid HTML
- `405`: Method not allowed (not POST)
- `413`: Payload too large (> 10MB)
- `500`: PDF generation failed

## Examples

### Exporting a Manuscript

1. Complete your manuscript with 3+ chapters
2. Press `Cmd+E`
3. Select "Manuscript Standard"
4. Click "Generate PDF"
5. PDF downloads with title: `MyNovel.pdf`

### Exporting Plot Analysis

1. Navigate to Plot Analysis panel
2. Click "Run Analysis" and wait for completion
3. Press `Cmd+E`
4. Select "Analysis Summary (1-pager)"
5. Click "Generate PDF"
6. PDF downloads with title: `MyNovel-summary.pdf`

## Support

For issues or feature requests:

- GitHub Issues: [Report a bug](https://github.com/oklahomahail/Inkwell2/issues)
- Documentation: [Full docs](../README.md)
- Community: [Discussions](https://github.com/oklahomahail/Inkwell2/discussions)
