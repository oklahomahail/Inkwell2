import React, { useState, useRef, useEffect } from "react";
import WritingToolbar from "../Writing/WritingToolbar";
import ClaudeToolbar from "../Writing/ClaudeToolbar";
import WritingEditor from "../Writing/WritingEditor";
import WritingStats from "../Writing/WritingStats";
import { ExportFormat } from "../../types/writing";
import { useToastContext } from "@/context/ToastContext";

interface WritingPanelProps {
  draftText: string;
  onChangeText: (value: string) => void;
  onTextSelect: () => void;
  selectedText: string;
}

const DEFAULT_TITLE = "Untitled Chapter";
const AUTO_SAVE_INTERVAL = 30000;

const WritingPanel: React.FC<WritingPanelProps> = ({
  draftText,
  onChangeText,
  onTextSelect,
  selectedText,
}) => {
  const [content, setContent] = useState(draftText);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [lastSaved, setLastSaved] = useState<string>("Never");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("markdown");

  const { showToast } = useToastContext();
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync with parent state
  useEffect(() => {
    setContent(draftText);
  }, [draftText]);

  // Listen for Claude-inserted text
  useEffect(() => {
    const handleInsert = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (custom.detail) {
        setContent((prev) => `${prev}\n${custom.detail}`);
        onChangeText(`${content}\n${custom.detail}`);
        showToast({ message: "Claude inserted text", type: "success" });
      }
    };
    window.addEventListener("claude-insert-text", handleInsert as EventListener);
    return () => {
      window.removeEventListener("claude-insert-text", handleInsert as EventListener);
    };
  }, [onChangeText, content, showToast]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setIsDirty(true);
    saveTimer.current = setTimeout(() => {
      handleSave(true);
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [title, content]);

  // Load saved draft
  useEffect(() => {
    try {
      const stored = localStorage.getItem("writing_content");
      if (stored) {
        const { title: savedTitle, content: savedContent } = JSON.parse(stored);
        if (savedTitle) setTitle(savedTitle);
        if (savedContent) {
          setContent(savedContent);
          onChangeText(savedContent);
        }
      }
    } catch {
      console.warn("Failed to load writing content");
    }
  }, [onChangeText]);

  const handleContentChange = (text: string) => {
    setContent(text);
    onChangeText(text);
  };

  const handleSave = (auto = false) => {
    try {
      setIsSaving(true);
      localStorage.setItem("writing_content", JSON.stringify({ title, content }));
      setLastSaved(new Date().toLocaleTimeString());
      setIsDirty(false);
      showToast({
        message: auto ? "Draft autosaved" : "Draft saved",
        type: "info",
      });
    } catch {
      showToast({
        message: "Failed to save draft",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 bg-[#0A0F1C] text-gray-100 rounded-lg shadow-lg flex flex-col space-y-4">
      <WritingToolbar
        title={title}
        onTitleChange={setTitle}
        titleRef={titleRef}
        content={content}
        lastSaved={lastSaved}
        isSaving={isSaving}
        onSave={() => handleSave(false)}
        exportFormat={exportFormat}
        onExportFormatChange={setExportFormat}
        defaultTitle={DEFAULT_TITLE}
        isDirty={isDirty}
      />

      <ClaudeToolbar
        selectedText={selectedText}
        onInsertText={(text) => handleContentChange(`${content}\n${text}`)}
      />

      <WritingEditor
        content={content}
        onContentChange={handleContentChange}
        onTextSelect={onTextSelect}
        textareaRef={textareaRef}
      />

      <WritingStats content={content} title={title} />
    </div>
  );
};

export default WritingPanel;
