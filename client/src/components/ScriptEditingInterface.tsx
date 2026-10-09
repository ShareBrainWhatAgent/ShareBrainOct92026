import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Edit3, Save, X, Copy, Clock, User, FileText, RotateCcw, Sparkles, Lightbulb } from "lucide-react";

interface ScriptEditingInterfaceProps {
  agentId: number;
  isOpen: boolean;
  onClose: () => void;
  onScriptUpdated: () => void;
}

// Removed OwnershipInfo interface as ownership is handled by parent component

interface ScriptInfo {
  script: string;
  scriptVersion: number;
  lastModified: string;
  agentName: string;
  agentDescription: string;
}

export function ScriptEditingInterface({ agentId, isOpen, onClose, onScriptUpdated }: ScriptEditingInterfaceProps) {
  const [newScript, setNewScript] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [improvementRequest, setImprovementRequest] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current script (ownership already verified by parent Edit Agent page)
  const { data: scriptInfo, isLoading: scriptLoading } = useQuery<ScriptInfo>({
    queryKey: ["/api/agents", agentId, "script"],
    enabled: isOpen && !!agentId,
  });

  // Update script mutation
  const updateScriptMutation = useMutation({
    mutationFn: async ({ script, reason }: { script: string; reason?: string }) => {
      const response = await fetch(`/api/agents/${agentId}/script`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newScript: script, changeReason: reason }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update script");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Script Updated",
        description: "Agent script has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agentId] });
      onScriptUpdated();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update agent script.",
        variant: "destructive",
      });
    },
  });

  // Initialize script text when data loads
  useEffect(() => {
    if (scriptInfo?.script) {
      setNewScript(scriptInfo.script);
    }
  }, [scriptInfo]);

  const handleCopyScript = async () => {
    if (scriptInfo?.script) {
      try {
        await navigator.clipboard.writeText(scriptInfo.script);
        toast({
          title: "Script Copied",
          description: "Script has been copied to clipboard.",
        });
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy script to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveScript = () => {
    if (!newScript.trim()) {
      toast({
        title: "Invalid Script",
        description: "Script cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    updateScriptMutation.mutate({
      script: newScript,
      reason: changeReason.trim() || undefined,
    });
  };

  const handlePreview = () => {
    setPreviewMode(!previewMode);
  };

  const handleReset = () => {
    if (scriptInfo?.script) {
      setNewScript(scriptInfo.script);
      setChangeReason("");
      setPreviewMode(false);
      setShowSuggestions(false);
      setAiSuggestions("");
      setImprovementRequest("");
    }
  };

  const generateAISuggestions = async () => {
    if (!scriptInfo?.script) return;
    
    setIsGeneratingSuggestions(true);
    try {
      const response = await fetch('/api/agents/ai-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentScript: scriptInfo.script,
          agentName: scriptInfo.agentName,
          agentDescription: scriptInfo.agentDescription,
          improvementRequest: improvementRequest.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      setAiSuggestions(data.suggestions);
      setShowSuggestions(true);
    } catch (error) {
      toast({
        title: "AI Suggestions Failed",
        description: "Unable to generate AI improvements. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const applyAISuggestions = () => {
    if (aiSuggestions) {
      setNewScript(aiSuggestions);
      setChangeReason("Applied AI-generated improvements");
      setShowSuggestions(false);
      toast({
        title: "AI Suggestions Applied",
        description: "The improved script has been applied. Review and save when ready.",
      });
    }
  };

  if (!isOpen) return null;

  // Ownership already verified by parent Edit Agent page, no additional checks needed

  return (
    <Card className="fixed inset-4 z-50 bg-white dark:bg-black border-gray-200 dark:border-gray-800 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Script Editor
            </CardTitle>
            <CardDescription>
              {scriptInfo?.agentName} - Edit system prompt and behavior
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {scriptInfo && (
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Version {scriptInfo.scriptVersion}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(scriptInfo.lastModified).toLocaleDateString()}
            </div>
            <Badge variant="secondary">Editable</Badge>
          </div>
        )}
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 p-4 overflow-hidden">
        {scriptLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500 dark:text-gray-400">Loading script...</p>
          </div>
        ) : (
          <div className="h-full flex flex-col space-y-4">
            {/* Script Editor */}
            <div className="flex-1 min-h-0">
              <label className="block text-sm font-medium mb-2">
                System Prompt
              </label>
              <Textarea
                value={previewMode ? newScript : newScript}
                onChange={(e) => setNewScript(e.target.value)}
                placeholder="Enter the agent's system prompt..."
                className="h-full resize-none font-mono text-sm"
                readOnly={previewMode}
              />
            </div>

            {/* Change Reason */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Change Reason (Optional)
              </label>
              <Input
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="Describe what you changed and why..."
                className="w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyScript}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  Copy Original
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="flex items-center gap-1"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 'add lesson plans', 'make it funnier', 'add more examples'"
                    value={improvementRequest}
                    onChange={(e) => setImprovementRequest(e.target.value)}
                    className="px-2 py-1 text-xs border border-purple-300 rounded w-64"
                    onKeyDown={(e) => e.key === 'Enter' && generateAISuggestions()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateAISuggestions}
                    disabled={isGeneratingSuggestions}
                    className="flex items-center gap-1 text-purple-600 border-purple-300 hover:bg-purple-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    {isGeneratingSuggestions ? "Generating..." : "AI Improve"}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  className="flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  {previewMode ? "Edit" : "Preview"}
                </Button>
                <Button
                  onClick={handleSaveScript}
                  disabled={updateScriptMutation.isPending || !newScript.trim()}
                  className="flex items-center gap-1"
                >
                  <Save className="h-4 w-4" />
                  {updateScriptMutation.isPending ? "Saving..." : "Save Script"}
                </Button>
              </div>
            </div>

            {previewMode && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="font-medium mb-2">Preview Changes</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This is how your updated script will look. Click "Save Script" to apply changes.
                </p>
              </div>
            )}

            {/* AI Suggestions Panel */}
            {showSuggestions && aiSuggestions && (
              <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2 text-purple-800 dark:text-purple-200">
                    <Lightbulb className="h-4 w-4" />
                    AI Improvement Suggestions
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSuggestions(false)}
                    className="text-purple-600 hover:text-purple-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded border p-3 mb-3 max-h-48 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-200">
                    {aiSuggestions}
                  </pre>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={applyAISuggestions}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Apply Suggestions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(aiSuggestions)}
                    className="text-purple-600 border-purple-300"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <p className="text-xs text-purple-600 dark:text-purple-400 ml-auto">
                    Review AI suggestions before applying
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}