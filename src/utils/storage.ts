// Centralized storage helpers

export const storage = {
  saveWritingContent: (data: { title: string; content: string }) => {
    try {
      localStorage.setItem("writing_content", JSON.stringify(data));
    } catch (err) {
      console.warn("Failed to save writing content:", err);
    }
  },

  loadWritingContent: (): { title: string; content: string } | null => {
    try {
      const stored = localStorage.getItem("writing_content");
      return stored ? JSON.parse(stored) : null;
    } catch (err) {
      console.warn("Failed to load writing content:", err);
      return null;
    }
  },

  saveTimeline: (scenes: any[]) => {
    try {
      localStorage.setItem("timeline_scenes", JSON.stringify(scenes));
    } catch (err) {
      console.warn("Failed to save timeline:", err);
    }
  },

  loadTimeline: (): any[] => {
    try {
      const stored = localStorage.getItem("timeline_scenes");
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.warn("Failed to load timeline:", err);
      return [];
    }
  }
};
