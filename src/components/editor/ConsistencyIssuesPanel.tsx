// src/components/editor/ConsistencyIssuesPanel.tsx - Sidebar panel showing consistency issues
import {
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  XCircle,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  User,
  Clock,
  Lightbulb,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/context/ToastContext';
import type {
  EditorIssue,
  ConsistencyDecorationOptions,
} from '@/services/editorConsistencyDecorator';

interface ConsistencyIssuesPanelProps {
  issues: EditorIssue[];
  isEnabled: boolean;
  options: Partial<ConsistencyDecorationOptions>;
  onToggleEnabled: (enabled: boolean) => void;
  onUpdateOptions: (options: Partial<ConsistencyDecorationOptions>) => void;
  onIssueClick: (issue: EditorIssue) => void;
  onRefreshAnalysis: () => void;
  className?: string;
}

const issueTypeIcons = {
  character: User,
  voice: MessageSquare,
  phrase: Lightbulb,
  timeline: Clock,
  world: AlertCircle,
  plot: AlertOctagon,
};

const severityIcons = {
  low: AlertCircle,
  medium: AlertTriangle,
  high: AlertOctagon,
  critical: XCircle,
};

const severityColors = {
  low: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  medium: 'bg-orange-100 text-orange-800 border-orange-200',
  high: 'bg-red-100 text-red-800 border-red-200',
  critical: 'bg-red-200 text-red-900 border-red-300',
};

const darkSeverityColors = {
  low: 'dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
  medium: 'dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
  high: 'dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  critical: 'dark:bg-red-900/30 dark:text-red-200 dark:border-red-700',
};

export default function ConsistencyIssuesPanel({
  issues,
  isEnabled,
  options,
  onToggleEnabled,
  onUpdateOptions,
  onIssueClick,
  onRefreshAnalysis,
  className = '',
}: ConsistencyIssuesPanelProps) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['high', 'critical']));

  // Filter and group issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesSearch =
        !searchQuery ||
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.text.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === 'all' || issue.type === selectedType;
      const matchesSeverity = selectedSeverity === 'all' || issue.severity === selectedSeverity;

      return matchesSearch && matchesType && matchesSeverity;
    });
  }, [issues, searchQuery, selectedType, selectedSeverity]);

  // Group issues by severity
  const groupedIssues = useMemo(() => {
    const groups = {
      critical: filteredIssues.filter((i) => i.severity === 'critical'),
      high: filteredIssues.filter((i) => i.severity === 'high'),
      medium: filteredIssues.filter((i) => i.severity === 'medium'),
      low: filteredIssues.filter((i) => i.severity === 'low'),
    };

    return Object.entries(groups).filter(([, issues]) => issues.length > 0);
  }, [filteredIssues]);

  const handleToggleGroup = (severity: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(severity)) {
      newExpanded.delete(severity);
    } else {
      newExpanded.add(severity);
    }
    setExpandedGroups(newExpanded);
  };

  const handleIssueClick = (issue: EditorIssue) => {
    onIssueClick(issue);
    showToast(`Jumped to: ${issue.title}`, 'success');
  };

  const handleUpdateOption = <K extends keyof ConsistencyDecorationOptions>(
    key: K,
    value: ConsistencyDecorationOptions[K],
  ) => {
    onUpdateOptions({ [key]: value });
  };

  const issueTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    issues.forEach((issue) => {
      counts[issue.type] = (counts[issue.type] || 0) + 1;
    });
    return counts;
  }, [issues]);

  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    issues.forEach((issue) => {
      counts[issue.severity] = (counts[issue.severity] || 0) + 1;
    });
    return counts;
  }, [issues]);

  const IssueItem = ({ issue }: { issue: EditorIssue }) => {
    const IconComponent = issueTypeIcons[issue.type] || AlertCircle;
    const SeverityIcon = severityIcons[issue.severity];

    return (
      <Card
        className={`mb-2 cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
          severityColors[issue.severity]
        } ${darkSeverityColors[issue.severity]}`}
        onClick={() => handleIssueClick(issue)}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-1">
              <IconComponent className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-medium truncate">{issue.title}</h4>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <SeverityIcon className="w-3 h-3" />
                  <Badge variant="secondary" className="text-xs px-1">
                    {issue.type}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{issue.description}</p>
              <div className="text-xs bg-muted p-1 rounded font-mono truncate">"{issue.text}"</div>
              {issue.suggestion && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 italic">
                  💡 {issue.suggestion}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`h-full flex flex-col bg-background border-l ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold">Consistency Issues</h3>
            {issues.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {issues.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefreshAnalysis}
              disabled={!isEnabled}
              title="Refresh analysis"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={isEnabled}
              onCheckedChange={onToggleEnabled}
              id="consistency-enabled"
            />
            <Label htmlFor="consistency-enabled" className="text-sm">
              {isEnabled ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
          {isEnabled ? (
            <Eye className="w-4 h-4 text-green-500" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Collapsible open={showSettings} onOpenChange={setShowSettings}>
          <CollapsibleContent className="p-4 border-b bg-muted/25">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Check Types</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={options.enableCharacterChecks !== false}
                      onCheckedChange={(checked) =>
                        handleUpdateOption('enableCharacterChecks', checked)
                      }
                      id="enable-character"
                    />
                    <Label htmlFor="enable-character" className="text-xs">
                      Character
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={options.enableVoiceChecks !== false}
                      onCheckedChange={(checked) =>
                        handleUpdateOption('enableVoiceChecks', checked)
                      }
                      id="enable-voice"
                    />
                    <Label htmlFor="enable-voice" className="text-xs">
                      Voice
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={options.enablePhraseChecks !== false}
                      onCheckedChange={(checked) =>
                        handleUpdateOption('enablePhraseChecks', checked)
                      }
                      id="enable-phrase"
                    />
                    <Label htmlFor="enable-phrase" className="text-xs">
                      Phrases
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={options.enableTimelineChecks === true}
                      onCheckedChange={(checked) =>
                        handleUpdateOption('enableTimelineChecks', checked)
                      }
                      id="enable-timeline"
                    />
                    <Label htmlFor="enable-timeline" className="text-xs">
                      Timeline
                    </Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="debounce-ms" className="text-sm font-medium">
                  Analysis Delay (ms)
                </Label>
                <Input
                  id="debounce-ms"
                  type="number"
                  min="500"
                  max="5000"
                  step="100"
                  value={options.debounceMs || 1500}
                  onChange={(e) => handleUpdateOption('debounceMs', parseInt(e.target.value, 10))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="min-words" className="text-sm font-medium">
                  Min Word Count
                </Label>
                <Input
                  id="min-words"
                  type="number"
                  min="10"
                  max="500"
                  step="10"
                  value={options.minWordCount || 50}
                  onChange={(e) => handleUpdateOption('minWordCount', parseInt(e.target.value, 10))}
                  className="mt-1"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Filters */}
      {isEnabled && (
        <div className="p-4 border-b space-y-3">
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All Types ({Object.keys(issueTypeCounts).length})
                </SelectItem>
                {Object.entries(issueTypeCounts).map(([type, count]) => (
                  <SelectItem key={type} value={type}>
                    {type} ({count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {Object.entries(severityCounts).map(([severity, count]) => (
                  <SelectItem key={severity} value={severity}>
                    {severity} ({count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto">
        {!isEnabled ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <EyeOff className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Consistency checking is disabled</p>
              <p className="text-xs">Enable it to see real-time issues</p>
            </div>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No issues found</p>
              <p className="text-xs">Your writing looks consistent!</p>
            </div>
          </div>
        ) : (
          <div className="p-4">
            {groupedIssues.map(([severity, severityIssues]) => (
              <div key={severity} className="mb-4">
                <Collapsible
                  open={expandedGroups.has(severity)}
                  onOpenChange={() => handleToggleGroup(severity)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-2">
                      {expandedGroups.has(severity) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium capitalize">
                        {severity} ({severityIssues.length})
                      </span>
                    </div>
                    <Badge
                      className={`text-xs ${severityColors[severity as keyof typeof severityColors]} ${darkSeverityColors[severity as keyof typeof darkSeverityColors]}`}
                    >
                      {severityIssues.length}
                    </Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    {severityIssues.map((issue) => (
                      <IssueItem key={issue.id} issue={issue} />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      {isEnabled && (
        <div className="p-2 border-t bg-muted/50 text-xs text-muted-foreground">
          <div className="flex justify-between items-center">
            <span>
              {filteredIssues.length} of {issues.length} issues
            </span>
            <span>Ctrl+F7 to toggle</span>
          </div>
        </div>
      )}
    </div>
  );
}
