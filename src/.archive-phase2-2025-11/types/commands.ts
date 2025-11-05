export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  action: () => void | Promise<void>;
  shortcut?: string;
  category: 'writing' | 'claude' | 'project' | 'navigation' | 'export';
  keywords: string[];
  enabled?: boolean;
}
export interface CommandGroup {
  category: Command['category'];
  label: string;
  commands: Command[];
}
