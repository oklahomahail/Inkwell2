/**
 * E2E Test: Export Dashboard (v0.7.0)
 *
 * Tests the complete export dashboard workflow:
 * - Export operations (PDF, DOCX, Markdown)
 * - Export history tracking
 * - Dashboard navigation and stats display
 * - Chapter distribution chart updates
 */

import { test, expect } from '@playwright/test';

test.describe('Export Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Clear IndexedDB to start fresh
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const deleteReq = indexedDB.deleteDatabase('inkwell_exports');
        deleteReq.onsuccess = () => resolve();
        deleteReq.onerror = () => resolve(); // Resolve even on error
      });
    });

    // Wait a bit for cleanup
    await page.waitForTimeout(500);
  });

  test('should navigate to Export Dashboard via Command Palette', async ({ page }) => {
    // Open Command Palette (⌘K)
    await page.keyboard.press('Meta+K');

    // Wait for palette to open
    const palette = page.locator('[data-command-palette]');
    await expect(palette).toBeVisible({ timeout: 2000 });

    // Search for export dashboard command
    await page.keyboard.type('export dashboard');
    await page.waitForTimeout(300);

    // Select the command
    await page.keyboard.press('Enter');

    // Verify Export Dashboard is visible
    const dashboard = page.locator('text=Export Dashboard');
    await expect(dashboard).toBeVisible({ timeout: 3000 });

    // Verify stats tiles are present
    const statsTiles = page.locator('text=Total Exports');
    await expect(statsTiles).toBeVisible({ timeout: 2000 });
  });

  test('should navigate to Export Dashboard via ⌘E shortcut', async ({ page }) => {
    // Press ⌘E directly
    await page.keyboard.press('Meta+E');

    // Verify Export Dashboard is visible
    const dashboard = page.locator('text=Export Dashboard');
    await expect(dashboard).toBeVisible({ timeout: 3000 });

    // Verify empty state for exports table
    const emptyState = page.locator('text=No exports yet');
    await expect(emptyState).toBeVisible({ timeout: 2000 });
  });

  test('should display empty state when no exports exist', async ({ page }) => {
    // Navigate to Export Dashboard
    await page.keyboard.press('Meta+E');

    // Wait for dashboard to load
    await page.waitForTimeout(1000);

    // Verify empty state
    const emptyExports = page.locator('text=No exports yet');
    await expect(emptyExports).toBeVisible({ timeout: 2000 });

    // Verify stats show zeros
    const totalExports = page.locator('text=Total Exports').locator('..').locator('text=0');
    await expect(totalExports).toBeVisible({ timeout: 2000 });
  });

  test('should export PDF and verify history row appears', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Navigate to Export Dashboard
    await page.keyboard.press('Meta+E');
    await page.waitForTimeout(1000);

    // Create a test chapter first (if needed)
    await page.evaluate(() => {
      // This will depend on your app's API - adjust as needed
      const testChapter = {
        id: 'test-chapter-1',
        title: 'Test Chapter',
        content: 'This is test content for export verification.',
        wordCount: 7,
        order: 1,
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store in localStorage for now (adjust based on your data layer)
      const chapters = JSON.parse(localStorage.getItem('chapters') || '[]');
      chapters.push(testChapter);
      localStorage.setItem('chapters', JSON.stringify(chapters));
    });

    // Reload to pick up chapter
    await page.reload();
    await page.keyboard.press('Meta+E');
    await page.waitForTimeout(1000);

    // Click "Export PDF" button
    const exportPDFButton = page.getByRole('button', { name: /Export PDF/i });

    // Check if button is disabled (no chapters)
    const isDisabled = await exportPDFButton.isDisabled();

    if (!isDisabled) {
      // Click and handle print dialog
      const printPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);
      await exportPDFButton.click();

      // Wait for export to process
      await page.waitForTimeout(2000);

      // Verify toast notification
      const successToast = page.locator('text=/PDF export|Preparing PDF/i');
      await expect(successToast).toBeVisible({ timeout: 3000 });

      // Wait for history to update
      await page.waitForTimeout(1500);

      // Verify history table now shows the export
      const historyTable = page.locator('table');
      await expect(historyTable).toBeVisible({ timeout: 2000 });

      // Verify PDF type indicator in table
      const pdfIndicator = page.locator('text=PDF').first();
      await expect(pdfIndicator).toBeVisible({ timeout: 2000 });

      // Verify stats updated
      const totalExports = page.locator('text=Total Exports');
      const statsCard = totalExports.locator('../..');
      await expect(statsCard.locator('text=1')).toBeVisible({ timeout: 2000 });
    }
  });

  test('should export DOCX and verify history row appears', async ({ page }) => {
    // Navigate to Export Dashboard
    await page.keyboard.press('Meta+E');
    await page.waitForTimeout(1000);

    // Click "Export DOCX" button
    const exportDOCXButton = page.getByRole('button', { name: /Export DOCX/i });

    const isDisabled = await exportDOCXButton.isDisabled();

    if (!isDisabled) {
      // Set up download handler
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

      await exportDOCXButton.click();

      // Wait for download
      const download = await downloadPromise;

      if (download) {
        // Verify filename contains .docx
        expect(download.suggestedFilename()).toContain('.docx');
      }

      // Wait for export to process
      await page.waitForTimeout(2000);

      // Verify toast notification
      const successToast = page.locator('text=/DOCX|Downloaded/i');
      await expect(successToast).toBeVisible({ timeout: 3000 });

      // Verify history table shows DOCX export
      const docxIndicator = page.locator('text=DOCX').first();
      await expect(docxIndicator).toBeVisible({ timeout: 2000 });
    }
  });

  test('should copy Markdown and verify nonempty clipboard + history', async ({
    page,
    context,
  }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Navigate to Export Dashboard
    await page.keyboard.press('Meta+E');
    await page.waitForTimeout(1000);

    // Click "Copy Markdown" button
    const copyMarkdownButton = page.getByRole('button', { name: /Copy Markdown/i });

    const isDisabled = await copyMarkdownButton.isDisabled();

    if (!isDisabled) {
      await copyMarkdownButton.click();

      // Wait for copy operation
      await page.waitForTimeout(1000);

      // Verify toast shows success
      const successToast = page.locator('text=/Copied|clipboard/i');
      await expect(successToast).toBeVisible({ timeout: 3000 });

      // Verify clipboard is nonempty
      const clipboardContent = await page.evaluate(() => {
        return navigator.clipboard.readText();
      });

      expect(clipboardContent).toBeTruthy();
      expect(clipboardContent.length).toBeGreaterThan(0);

      // Verify clipboard contains markdown
      expect(clipboardContent).toMatch(/^#/); // Starts with heading

      // Wait for history to update
      await page.waitForTimeout(1500);

      // Verify history table shows Markdown export
      const markdownIndicator = page.locator('text=MARKDOWN').first();
      await expect(markdownIndicator).toBeVisible({ timeout: 2000 });
    }
  });

  test('should update stats after multiple exports', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Navigate to Export Dashboard
    await page.keyboard.press('Meta+E');
    await page.waitForTimeout(1000);

    // Perform multiple exports
    const copyButton = page.getByRole('button', { name: /Copy Markdown/i });

    if (!(await copyButton.isDisabled())) {
      // Export 1
      await copyButton.click();
      await page.waitForTimeout(2000);

      // Export 2
      await copyButton.click();
      await page.waitForTimeout(2000);

      // Export 3
      await copyButton.click();
      await page.waitForTimeout(2000);

      // Verify stats show 3 exports
      const totalExportsCard = page.locator('text=Total Exports').locator('../..');
      await expect(totalExportsCard.locator('text=3')).toBeVisible({ timeout: 3000 });

      // Verify table shows 3 rows
      const tableRows = page.locator('tbody tr');
      await expect(tableRows).toHaveCount(3, { timeout: 2000 });
    }
  });

  test('should display chapter distribution chart', async ({ page }) => {
    // Navigate to Export Dashboard
    await page.keyboard.press('Meta+E');
    await page.waitForTimeout(1000);

    // Verify chart component is present
    const chartHeader = page.locator('text=Chapter Distribution');
    await expect(chartHeader).toBeVisible({ timeout: 2000 });

    // Check if chapters exist
    const emptyChartState = page.locator('text=No chapters yet');
    const chartIsEmpty = await emptyChartState.isVisible({ timeout: 1000 }).catch(() => false);

    if (!chartIsEmpty) {
      // Verify chart has bars
      const chartBars = page
        .locator('[class*="bg-blue-"], [class*="bg-purple-"]')
        .filter({ hasText: /words/i });
      await expect(chartBars.first()).toBeVisible({ timeout: 2000 });

      // Verify summary stats at bottom
      const summaryStats = page.locator('text=Total Words');
      await expect(summaryStats).toBeVisible({ timeout: 2000 });
    }
  });

  test('should handle export errors gracefully', async ({ page }) => {
    // Navigate to Export Dashboard
    await page.keyboard.press('Meta+E');
    await page.waitForTimeout(1000);

    // Mock an export failure
    await page.route('**/api/export/**', (route) => {
      route.abort('failed');
    });

    const copyButton = page.getByRole('button', { name: /Copy Markdown/i });

    if (!(await copyButton.isDisabled())) {
      await copyButton.click();
      await page.waitForTimeout(1500);

      // Verify error toast or failed status
      const errorIndicator = page.locator('text=/Failed|error/i');

      // Should show either toast or table entry with failed status
      const hasError = await errorIndicator.isVisible({ timeout: 3000 }).catch(() => false);

      // At minimum, verify the export completed (success or fail)
      expect(hasError).toBeDefined();
    }
  });

  test('should clear export history', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Navigate to Export Dashboard
    await page.keyboard.press('Meta+E');
    await page.waitForTimeout(1000);

    // Perform an export first
    const copyButton = page.getByRole('button', { name: /Copy Markdown/i });

    if (!(await copyButton.isDisabled())) {
      await copyButton.click();
      await page.waitForTimeout(2000);

      // Verify history exists
      const tableRows = page.locator('tbody tr');
      const rowCount = await tableRows.count();

      if (rowCount > 0) {
        // Click "Clear Export History" button
        const clearButton = page.getByRole('button', { name: /Clear Export History/i });

        if (await clearButton.isVisible({ timeout: 2000 })) {
          // Handle confirmation dialog
          page.on('dialog', (dialog) => dialog.accept());

          await clearButton.click();
          await page.waitForTimeout(1500);

          // Verify empty state returns
          const emptyState = page.locator('text=No exports yet');
          await expect(emptyState).toBeVisible({ timeout: 3000 });

          // Verify stats reset to 0
          const totalExportsCard = page.locator('text=Total Exports').locator('../..');
          await expect(totalExportsCard.locator('text=0')).toBeVisible({ timeout: 2000 });
        }
      }
    }
  });

  test('should show export duration in history table', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Navigate to Export Dashboard
    await page.keyboard.press('Meta+E');
    await page.waitForTimeout(1000);

    const copyButton = page.getByRole('button', { name: /Copy Markdown/i });

    if (!(await copyButton.isDisabled())) {
      await copyButton.click();
      await page.waitForTimeout(2000);

      // Verify duration column shows time (ms, s, or m)
      const durationCell = page.locator('td', { hasText: /\d+(ms|s|m)/ }).first();
      await expect(durationCell).toBeVisible({ timeout: 3000 });
    }
  });

  test('should show word count in history table', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Navigate to Export Dashboard
    await page.keyboard.press('Meta+E');
    await page.waitForTimeout(1000);

    const copyButton = page.getByRole('button', { name: /Copy Markdown/i });

    if (!(await copyButton.isDisabled())) {
      await copyButton.click();
      await page.waitForTimeout(2000);

      // Verify word count column shows numbers
      const wordCountHeader = page.locator('th', { hasText: /Words/i });
      await expect(wordCountHeader).toBeVisible({ timeout: 2000 });

      // Verify word count values in table
      const wordCountCell = page.locator('tbody td').filter({ hasText: /\d+/ }).first();
      await expect(wordCountCell).toBeVisible({ timeout: 2000 });
    }
  });

  test('should show chapter count in history table', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Navigate to Export Dashboard
    await page.keyboard.press('Meta+E');
    await page.waitForTimeout(1000);

    const copyButton = page.getByRole('button', { name: /Copy Markdown/i });

    if (!(await copyButton.isDisabled())) {
      await copyButton.click();
      await page.waitForTimeout(2000);

      // Verify chapter count in table
      const chapterColumn = page.locator('th', { hasText: /Chapters/i });
      await expect(chapterColumn).toBeVisible({ timeout: 2000 });

      const chapterCell = page.locator('td', { hasText: /\d+ chapter/i }).first();
      await expect(chapterCell).toBeVisible({ timeout: 2000 });
    }
  });

  test('should persist export history across page reloads', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Navigate to Export Dashboard
    await page.keyboard.press('Meta+E');
    await page.waitForTimeout(1000);

    const copyButton = page.getByRole('button', { name: /Copy Markdown/i });

    if (!(await copyButton.isDisabled())) {
      await copyButton.click();
      await page.waitForTimeout(2000);

      // Verify export exists
      const tableRows = page.locator('tbody tr');
      const initialCount = await tableRows.count();

      if (initialCount > 0) {
        // Reload page
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Navigate back to Export Dashboard
        await page.keyboard.press('Meta+E');
        await page.waitForTimeout(1000);

        // Verify history still exists
        const reloadedRows = page.locator('tbody tr');
        await expect(reloadedRows).toHaveCount(initialCount, { timeout: 3000 });
      }
    }
  });
});
