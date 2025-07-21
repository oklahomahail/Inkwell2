import React, { useState, useRef, useEffect } from "react";
import WritingToolbar from "../Writing/WritingToolbar";
import ClaudeToolbar from "../Writing/ClaudeToolbar";
import WritingEditor from "../Writing/WritingEditor";
import WritingStats from "../Writing/WritingStats";
import { ExportFormat } from "../../types/writing";

interface WritingPanelProps {
  draftText?: string;
  onChangeText?: (value: string) => void;
  onTextSelect?: () => void;
  selectedText?: string;
}

const DEFAULT_TITLE = "Untitled Chapter";
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

const WritingPanel: React.FC<WritingPanelProps> = ({
  draftText = "",
  onChangeText,
  onTextSelect,
  selectedText = "",
}) => {
  const [content, setContent] = useState(draftText);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [lastSaved, setLastSaved] = useState<string>("Never");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("markdown");

  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Autosave draft every 30 seconds
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setIsDirty(true);
    saveTimer.current = setTimeout(() => {
      try {
        setIsSaving(true);
        localStorage.setItem(
          "writing_content",
          JSON.stringify({ title, content })
        );
        setLastSaved(new Date().toLocaleTimeString());
        setIsDirty(false);
      } catch (error) {
        console.warn("Failed to save writing content", error);
      } finally {
        setIsSaving(false);
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [title, content]);

  // Load saved draft on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("writing_content");
      if (stored) {
        const { title: savedTitle, content: savedContent } = JSON.parse(stored);
        if (savedTitle) setTitle(savedTitle);
        if (savedContent) setContent(savedContent);
      }
    } catch (error) {
      console.warn("Failed to load writing content", error);
    }
  }, []);

  const handleContentChange = (text: string) => {
    setContent(text);
    if (onChangeText) onChangeText(text);
  };

  const handleSave = () => {
    try {
      setIsSaving(true);
      localStorage.setItem(
        "writing_content",
        JSON.stringify({ title, content })
      );
      setLastSaved(new Date().toLocaleTimeString());
      setIsDirty(false);
    } catch (error) {
      console.warn("Manual save failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg shadow-md flex flex-col space-y-4">
      {/* Toolbar for title, save, export */}
      <WritingToolbar
        title={title}
        onTitleChange={setTitle}
        titleRef={titleRef}
        content={content}
        lastSaved={lastSaved}
        isSaving={isSaving}
        onSave={handleSave}
        exportFormat={exportFormat}
        onExportFormatChange={setExportFormat}
        defaultTitle={DEFAULT_TITLE}
        isDirty={isDirty}
      />

      {/* Claude AI inline toolbar */}
      <ClaudeToolbar
        selectedText={selectedText}
        onInsertText={(text: any) => setContent((prev) => `${prev}\n${text}`)}
      />

      {/* Main text editor */}
      <WritingEditor
        content={content}
        onContentChange={handleContentChange}
        onTextSelect={onTextSelect}
        textareaRef={textareaRef}
      />

      {/* Stats display */}
      <WritingStats draftText={content} />
    </div>
  );
};

export default WritingPanel;
