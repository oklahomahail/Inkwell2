// src/components/editor/extensions/ConsistencyExtension.ts - TipTap extension for real-time consistency checking
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { DecorationSet } from '@tiptap/pm/view';

import editorConsistencyDecorator, {
  type EditorIssue,
  type ConsistencyDecorationOptions,
} from '@/services/editorConsistencyDecorator';
import type { EnhancedProject } from '@/types/project';
import type { Scene, Chapter } from '@/types/writing';

export interface ConsistencyExtensionOptions {
  project: EnhancedProject | null;
  scene: Scene | null;
  chapter: Chapter | null;
  enabled: boolean;
  decorationOptions: Partial<ConsistencyDecorationOptions>;
  onIssuesUpdated?: (issues: EditorIssue[]) => void;
  onIssueClicked?: (issue: EditorIssue) => void;
}

const consistencyPluginKey = new PluginKey('consistency-checking');

export const ConsistencyExtension = Extension.create<ConsistencyExtensionOptions>({
  name: 'consistency',

  addOptions() {
    return {
      project: null,
      scene: null,
      chapter: null,
      enabled: true,
      decorationOptions: {},
      onIssuesUpdated: undefined,
      onIssueClicked: undefined,
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: consistencyPluginKey,

        state: {
          init() {
            return DecorationSet.empty;
          },

          apply(tr, oldState, oldDoc, newDoc) {
            // If document hasn't changed, keep existing decorations
            if (!tr.docChanged) {
              return oldState;
            }

            // Clear decorations if disabled or missing required data
            if (
              !extension.options.enabled ||
              !extension.options.project ||
              !extension.options.scene ||
              !extension.options.chapter
            ) {
              return DecorationSet.empty;
            }

            // Get text content and trigger consistency analysis
            const content = newDoc.textContent;
            editorConsistencyDecorator.analyzeContent(
              content,
              extension.options.project,
              extension.options.scene,
              extension.options.chapter,
              extension.options.decorationOptions,
            );

            // Return current decorations (will be updated asynchronously)
            return editorConsistencyDecorator.generateDecorations(newDoc);
          },
        },

        props: {
          decorations(state) {
            return this.getState(state);
          },

          handleClick(view, pos, event) {
            // Check if click was on a consistency issue decoration
            const target = event.target as HTMLElement;
            const issueElement = target.closest('.consistency-issue');

            if (issueElement) {
              const issueId = issueElement.getAttribute('data-issue-id');
              if (issueId) {
                const issues = editorConsistencyDecorator.getCurrentIssues();
                const issue = issues.find((i) => i.id === issueId);

                if (issue && extension.options.onIssueClicked) {
                  extension.options.onIssueClicked(issue);
                  return true;
                }
              }
            }

            return false;
          },

          handleKeyDown(view, event) {
            // Handle keyboard shortcuts for consistency checking
            if (event.key === 'F7' && event.ctrlKey) {
              // Ctrl+F7: Toggle consistency checking
              extension.options.enabled = !extension.options.enabled;

              // Force re-analysis
              if (
                extension.options.enabled &&
                extension.options.project &&
                extension.options.scene &&
                extension.options.chapter
              ) {
                const content = view.state.doc.textContent;
                editorConsistencyDecorator.analyzeContent(
                  content,
                  extension.options.project,
                  extension.options.scene,
                  extension.options.chapter,
                  extension.options.decorationOptions,
                );
              } else {
                editorConsistencyDecorator.getCurrentIssues().forEach(() => {
                  // Clear issues when disabled
                });
              }

              // Trigger view update
              view.dispatch(view.state.tr.setMeta('consistency-toggle', true));
              return true;
            }

            return false;
          },
        },

        view() {
          // Set up issue update listener
          const unsubscribe = editorConsistencyDecorator.onIssuesUpdated((issues) => {
            // Notify parent component about issues
            if (extension.options.onIssuesUpdated) {
              extension.options.onIssuesUpdated(issues);
            }

            // Update decorations in the editor
            if (this.editor?.view) {
              const { view } = this.editor;
              const decorations = editorConsistencyDecorator.generateDecorations(view.state.doc);
              const tr = view.state.tr.setMeta('consistency-decorations', decorations);
              view.dispatch(tr);
            }
          });

          return {
            destroy() {
              unsubscribe();
            },
          };
        },
      }),
    ];
  },

  addCommands() {
    return {
      toggleConsistencyChecking:
        () =>
        ({ commands }) => {
          this.options.enabled = !this.options.enabled;

          // Force re-render
          return commands.focus();
        },

      updateConsistencyContext:
        (project: EnhancedProject, scene: Scene, chapter: Chapter) =>
        ({ commands: _commands }) => {
          this.options.project = project;
          this.options.scene = scene;
          this.options.chapter = chapter;

          // Trigger immediate re-analysis if enabled
          if (this.options.enabled) {
            setTimeout(() => {
              const editor = this.editor;
              if (editor?.view) {
                const content = editor.view.state.doc.textContent;
                editorConsistencyDecorator.analyzeContent(
                  content,
                  project,
                  scene,
                  chapter,
                  this.options.decorationOptions,
                );
              }
            }, 0);
          }

          return true;
        },

      updateDecorationOptions:
        (options: Partial<ConsistencyDecorationOptions>) =>
        ({ commands: _commands }) => {
          this.options.decorationOptions = {
            ...this.options.decorationOptions,
            ...options,
          };

          // Trigger re-analysis with new options
          if (
            this.options.enabled &&
            this.options.project &&
            this.options.scene &&
            this.options.chapter
          ) {
            setTimeout(() => {
              const editor = this.editor;
              if (editor?.view) {
                const content = editor.view.state.doc.textContent;
                editorConsistencyDecorator.analyzeContent(
                  content,
                  this.options.project,
                  this.options.scene,
                  this.options.chapter,
                  this.options.decorationOptions,
                );
              }
            }, 0);
          }

          return true;
        },

      getCurrentConsistencyIssues:
        () =>
        ({ commands: _commands }) => {
          return editorConsistencyDecorator.getCurrentIssues();
        },
    };
  },

  onUpdate() {
    // Handle content updates
    if (
      this.options.enabled &&
      this.options.project &&
      this.options.scene &&
      this.options.chapter
    ) {
      const content = this.editor.getText();

      // Trigger debounced analysis
      editorConsistencyDecorator.analyzeContent(
        content,
        this.options.project,
        this.options.scene,
        this.options.chapter,
        this.options.decorationOptions,
      );
    }
  },
});

export default ConsistencyExtension;
