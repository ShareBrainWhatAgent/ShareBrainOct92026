import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Play, Upload, Bot, Sparkles, Server, MessageCircle, Save, FolderOpen, Globe, Users, User, ExternalLink, Plus, Github, GitBranch, Cloud, Download, Upload as UploadIcon, Search, Lightbulb, BookOpen, Bug, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface AgentWorkspace {
  id: string;
  agentId?: number;
  deployedAgentId?: number;
  name: string;
  description: string;
  code: string;
  systemPrompt: string;
  memoryType: 'personal' | 'friends' | 'global';
  status: 'development' | 'testing' | 'deployed';
  replitUrl: string;
  lastModified: Date;
  githubRepoUrl?: string;
  githubRepoName?: string;
  githubUsername?: string;
  lastGitSync?: Date;
  gitSyncStatus?: 'pending' | 'synced' | 'error';
}

export default function AgentBuilder() {
  const [currentWorkspace, setCurrentWorkspace] = useState<AgentWorkspace | null>(null);
  const [code, setCode] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [codeAnalysis, setCodeAnalysis] = useState<any>(null);
  const [codeDocumentation, setCodeDocumentation] = useState<any>(null);
  const [developerInsights, setDeveloperInsights] = useState<any>(null);
  const [smartSuggestions, setSmartSuggestions] = useState<any[]>([]);
  const [learningPath, setLearningPath] = useState<any>(null);
  const [debugWorkflow, setDebugWorkflow] = useState<any>(null);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGeneratingDocs, setIsGeneratingDocs] = useState(false);
  
  // AI Modification states
  const [aiProvider, setAiProvider] = useState<'claude' | 'gpt4' | 'codex'>('claude');
  const [modificationScope, setModificationScope] = useState<'content' | 'system_prompt' | 'code' | 'structure'>('system_prompt');
  const [modificationInstruction, setModificationInstruction] = useState('');
  const [isGeneratingModification, setIsGeneratingModification] = useState(false);
  const [currentModification, setCurrentModification] = useState<any>(null);
  const [modificationHistory, setModificationHistory] = useState<any[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workspaces, isLoading: workspacesLoading } = useQuery({
    queryKey: ["/api/agent-workspaces"],
    retry: false,
  });

  const { data: githubStatus, isLoading: githubLoading } = useQuery({
    queryKey: ["/api/github/status"],
    retry: false,
  });

  const { data: commits, isLoading: commitsLoading } = useQuery({
    queryKey: ["/api/github/commits", currentWorkspace?.id],
    enabled: !!(currentWorkspace?.id && currentWorkspace?.githubRepoName),
    retry: false,
  });

  const { data: changes } = useQuery({
    queryKey: ["/api/github/changes", currentWorkspace?.id],
    enabled: !!(currentWorkspace?.id && currentWorkspace?.githubRepoName),
    retry: false,
    refetchInterval: 30000, // Check for changes every 30 seconds
  });

  const saveWorkspaceMutation = useMutation({
    mutationFn: async (workspaceData: Partial<AgentWorkspace>) => {
      return await apiRequest("POST", "/api/agent-workspaces", workspaceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent-workspaces"] });
      toast({
        title: "Workspace Saved",
        description: "Your workspace has been saved successfully.",
      });
    },
    onError: (error) => {
      console.error("Save failed:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save workspace. Please try again.",
        variant: "destructive",
      });
    },
  });

  const connectGitHubMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/github/auth");
      return response;
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        // OAuth flow
        window.location.href = data.authUrl;
      } else if (data.success) {
        // Simplified connection - refresh GitHub status
        queryClient.invalidateQueries({ queryKey: ["/api/github/status"] });
        toast({
          title: "GitHub Connected",
          description: "GitHub connection established successfully!",
        });
      }
    },
    onError: (error) => {
      console.error("GitHub auth failed:", error);
      toast({
        title: "GitHub Connection Failed",
        description: "Failed to connect GitHub. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createRepoMutation = useMutation({
    mutationFn: async (workspaceId: string) => {
      return await apiRequest("POST", "/api/github/create-repo", { workspaceId });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent-workspaces"] });
      toast({
        title: "Repository Created",
        description: "GitHub repository created successfully!",
      });
    },
    onError: (error) => {
      console.error("Create repo failed:", error);
      toast({
        title: "Repository Creation Failed",
        description: "Failed to create GitHub repository. Please try again.",
        variant: "destructive",
      });
    },
  });

  const syncGitHubMutation = useMutation({
    mutationFn: async ({ workspaceId, direction }: { workspaceId: string; direction: 'push' | 'pull' }) => {
      return await apiRequest("POST", "/api/github/sync", { workspaceId, direction });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent-workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/github/commits", currentWorkspace?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/github/changes", currentWorkspace?.id] });
      
      toast({
        title: `Git ${variables.direction === 'push' ? 'Push' : 'Pull'} Successful`,
        description: `Changes ${variables.direction === 'push' ? 'pushed to' : 'pulled from'} GitHub successfully!`,
      });
    },
    onError: (error, variables) => {
      console.error("GitHub sync failed:", error);
      toast({
        title: `Git ${variables.direction === 'push' ? 'Push' : 'Pull'} Failed`,
        description: "Failed to sync with GitHub. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!currentWorkspace) return;
    
    const workspaceData = {
      ...currentWorkspace,
      code: code || currentWorkspace.code,
      systemPrompt: systemPrompt || currentWorkspace.systemPrompt,
    };
    
    saveWorkspaceMutation.mutate(workspaceData);
  };

  const handleTest = async () => {
    if (!code && !currentWorkspace?.code) {
      toast({
        title: "Missing Code",
        description: "Please provide JavaScript code for your agent.",
        variant: "destructive",
      });
      return;
    }
    
    if (!systemPrompt && !currentWorkspace?.systemPrompt) {
      toast({
        title: "Missing System Prompt",
        description: "Please provide a system prompt for your agent.",
        variant: "destructive",
      });
      return;
    }
    
    if (!testMessage) {
      toast({
        title: "Missing Test Message",
        description: "Please provide a test message.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch("/api/agent-workspaces/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code || currentWorkspace?.code,
          systemPrompt: systemPrompt || currentWorkspace?.systemPrompt,
          message: testMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Test failed");
      }

      const result = await response.json();
      setTestResult(result.response);
      toast({
        title: "Test Successful",
        description: "Your agent responded successfully!",
      });
    } catch (error: any) {
      console.error("Test failed:", error);
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test agent",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeploy = async () => {
    if (!currentWorkspace || !currentWorkspace.id) {
      toast({
        title: "Save First",
        description: "Please save your workspace before deploying.",
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);
    try {
      const response = await fetch(`/api/agent-workspaces/${currentWorkspace.id}/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Deployment failed");
      }

      const result = await response.json();
      toast({
        title: "Deployment Successful",
        description: `Agent deployed successfully! Agent ID: ${result.agentId}`,
      });

      // Update current workspace with deployed agent ID and refresh list
      setCurrentWorkspace({ ...currentWorkspace, deployedAgentId: result.agentId, status: 'deployed' });
      queryClient.invalidateQueries({ queryKey: ["/api/agent-workspaces"] });
      
    } catch (error: any) {
      console.error("Deployment failed:", error);
      toast({
        title: "Deployment Failed",
        description: error.message || "Failed to deploy agent",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const exampleCode = `// Example ShareBrain Agent
function processMessage(message, context) {
  // Your custom agent logic here
  const response = \`Hello! You said: \${message}\`;
  
  // You can access user context, memory, and other features
  if (context.user) {
    return \`Hi \${context.user.name}, \${response}\`;
  }
  
  return response;
}

// Export the main function
module.exports = { processMessage };`;

  const exampleSystemPrompt = `You are a helpful AI assistant created with ShareBrain Agent Builder. 
You have access to custom JavaScript code that processes messages and provides enhanced functionality.
Always be helpful, accurate, and engaging in your responses.

When responding to users:
- Use the custom code functionality when available
- Maintain context across conversations
- Be friendly and professional
- Provide clear, actionable information`;

  const createNewWorkspace = () => {
    const newWorkspace: AgentWorkspace = {
      id: `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: 'New Workspace',
      description: '',
      code: exampleCode,
      systemPrompt: exampleSystemPrompt,
      memoryType: 'personal',
      status: 'development',
      replitUrl: '',
      lastModified: new Date()
    };
    setCurrentWorkspace(newWorkspace);
    setCode(exampleCode);
    setSystemPrompt(exampleSystemPrompt);
  };

  const selectWorkspace = (workspace: AgentWorkspace) => {
    setCurrentWorkspace(workspace);
    setCode(workspace.code);
    setSystemPrompt(workspace.systemPrompt);

    // Load modification history for this workspace
    loadModificationHistory(workspace);
  };

  // Phase 3: Codex Integration - AI-Powered Code Assistant Functions
  const handleCodeAnalysis = async () => {
    if (!code.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const response = await apiRequest("POST", "/api/codex/analyze", {
        code: code,
        systemPrompt: systemPrompt
      });
      
      setCodeAnalysis(response);
      toast({
        title: "Code Analysis Complete",
        description: "Your code has been analyzed for issues and improvements.",
      });
    } catch (error: any) {
      console.error("Code analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCodeOptimization = async () => {
    if (!code.trim()) return;
    
    setIsOptimizing(true);
    try {
      const response = await apiRequest("POST", "/api/codex/optimize", {
        code: code,
        systemPrompt: systemPrompt,
        optimizationGoal: 'all'
      });
      
      if (response.code && response.code !== code) {
        setCode(response.code);
        toast({
          title: "Code Optimized",
          description: "Your code has been optimized for performance and best practices.",
        });
      } else {
        toast({
          title: "No Optimizations Available",
          description: "Your code is already well-optimized!",
        });
      }
    } catch (error: any) {
      console.error("Code optimization failed:", error);
      toast({
        title: "Optimization Failed",
        description: "Failed to optimize code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerateDocumentation = async () => {
    if (!code.trim()) return;
    
    setIsGeneratingDocs(true);
    try {
      const response = await apiRequest("POST", "/api/codex/documentation", {
        code: code,
        systemPrompt: systemPrompt
      });
      
      setCodeDocumentation(response);
      toast({
        title: "Documentation Generated",
        description: "Comprehensive documentation has been generated for your code.",
      });
    } catch (error: any) {
      console.error("Documentation generation failed:", error);
      toast({
        title: "Documentation Failed",
        description: "Failed to generate documentation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDocs(false);
    }
  };

  const handleDebugCode = async (errorMessage: string) => {
    if (!code.trim() || !errorMessage) return;
    
    try {
      const response = await apiRequest("POST", "/api/codex/debug", {
        code: code,
        error: errorMessage,
        systemPrompt: systemPrompt
      });
      
      if (response.solutions && response.solutions.length > 0) {
        const solution = response.solutions[0];
        if (solution.code) {
          setCode(solution.code);
          toast({
            title: "Debug Solution Applied",
            description: solution.explanation,
          });
        }
      }
    } catch (error: any) {
      console.error("Debug failed:", error);
      toast({
        title: "Debug Failed",
        description: "Failed to debug code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateFromDescription = async (description: string) => {
    if (!description.trim()) return;
    
    try {
      const response = await apiRequest("POST", "/api/codex/generate", {
        description: description,
        systemPrompt: systemPrompt,
        memoryType: currentWorkspace?.memoryType || 'personal'
      });
      
      if (response.code) {
        setCode(response.code);
        toast({
          title: "Code Generated",
          description: "Code has been generated from your description.",
        });
      }
    } catch (error: any) {
      console.error("Code generation failed:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate code. Please try again.",
        variant: "destructive",
      });
    }
  }

  // AI Brain Modification Functions
  const handleGenerateModification = async () => {
    if (!currentWorkspace || !modificationInstruction.trim()) return;
    if (!currentWorkspace.deployedAgentId) {
      toast({
        title: "Agent Not Deployed",
        description: "Please deploy the agent before requesting modifications.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingModification(true);
    try {
      const response = await apiRequest("POST", "/api/brain-modifications/generate", {
        brainId: currentWorkspace.deployedAgentId,
        instruction: modificationInstruction,
        aiProvider: aiProvider,
        modificationScope: modificationScope
      });

      const modification = await response.json();
      setCurrentModification(modification);
      setModificationInstruction('');
      
      // Refresh modification history
      await loadModificationHistory();
      
      toast({
        title: "Modification Generated",
        description: `${aiProvider.toUpperCase()} has generated a proposed modification. Review and apply if satisfied.`,
      });
    } catch (error: any) {
      console.error("Modification generation failed:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate modification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingModification(false);
    }
  };

  const handleApplyModification = async (modificationId: number) => {
    try {
      await apiRequest("POST", `/api/brain-modifications/${modificationId}/apply`);
      
      setCurrentModification(null);
      await loadModificationHistory();
      
      // Refresh the current workspace to reflect changes
      if (currentWorkspace) {
        queryClient.invalidateQueries({ queryKey: ["/api/agent-workspaces"] });
      }
      
      toast({
        title: "Modification Applied",
        description: "AI-generated changes have been applied successfully to your agent.",
      });
    } catch (error: any) {
      console.error("Modification application failed:", error);
      toast({
        title: "Application Failed",
        description: "Failed to apply modification. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectModification = async (modificationId: number) => {
    try {
      await apiRequest("POST", `/api/brain-modifications/${modificationId}/reject`, {
        reason: "User rejected the proposed changes"
      });
      
      setCurrentModification(null);
      await loadModificationHistory();
      
      toast({
        title: "Modification Rejected",
        description: "The proposed changes have been rejected.",
      });
    } catch (error: any) {
      console.error("Modification rejection failed:", error);
      toast({
        title: "Rejection Failed",
        description: "Failed to reject modification. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadModificationHistory = async (workspace?: AgentWorkspace) => {
    const target = workspace || currentWorkspace;
    if (!target?.deployedAgentId) return;

    try {
      const response = await apiRequest("GET", `/api/brain-modifications/${target.deployedAgentId}/history`);
      const history = await response.json();
      setModificationHistory(history || []);
    } catch (error: any) {
      console.error("Failed to load modification history:", error);
    }
  };

  // Phase 4: Developer Experience Enhancement Functions
  const handleGetDeveloperInsights = async () => {
    if (!code.trim()) return;
    
    try {
      const response = await apiRequest("POST", "/api/developer-experience/insights", {
        code: code.trim(),
        systemPrompt,
        workspaceHistory: []
      });
      
      if (response.ok) {
        const insights = await response.json();
        setDeveloperInsights(insights);
        toast({
          title: "Developer Insights Generated",
          description: "Comprehensive code insights generated successfully",
        });
      } else {
        throw new Error("Failed to get developer insights");
      }
    } catch (error) {
      toast({
        title: "Insights Failed",
        description: "Failed to generate developer insights",
        variant: "destructive",
      });
    }
  };

  const handleGetSmartSuggestions = async () => {
    if (!code.trim()) return;
    
    try {
      const response = await apiRequest("POST", "/api/developer-experience/suggestions", {
        code: code.trim(),
        systemPrompt,
        userHistory: []
      });
      
      if (response.ok) {
        const result = await response.json();
        setSmartSuggestions(result.suggestions);
        toast({
          title: "Smart Suggestions Generated",
          description: "Intelligent improvement suggestions generated successfully",
        });
      } else {
        throw new Error("Failed to get smart suggestions");
      }
    } catch (error) {
      toast({
        title: "Suggestions Failed",
        description: "Failed to generate smart suggestions",
        variant: "destructive",
      });
    }
  };

  const handleGetLearningPath = async () => {
    try {
      const response = await apiRequest("POST", "/api/developer-experience/learning-path", {
        currentSkillLevel: "intermediate",
        interests: ["agent-development", "ai-integration", "javascript"],
        completedProjects: []
      });
      
      if (response.ok) {
        const path = await response.json();
        setLearningPath(path);
        toast({
          title: "Learning Path Generated",
          description: "Personalized learning path created successfully",
        });
      } else {
        throw new Error("Failed to get learning path");
      }
    } catch (error) {
      toast({
        title: "Learning Path Failed",
        description: "Failed to generate learning path",
        variant: "destructive",
      });
    }
  };

  const handleGetDebugWorkflow = async (errorDescription: string) => {
    if (!code.trim() || !errorDescription.trim()) return;
    
    try {
      const response = await apiRequest("POST", "/api/developer-experience/debug-workflow", {
        code: code.trim(),
        error: errorDescription.trim(),
        systemPrompt,
        debugHistory: []
      });
      
      if (response.ok) {
        const workflow = await response.json();
        setDebugWorkflow(workflow);
        toast({
          title: "Debug Workflow Generated",
          description: "Comprehensive debugging workflow created successfully",
        });
      } else {
        throw new Error("Failed to get debug workflow");
      }
    } catch (error) {
      toast({
        title: "Debug Workflow Failed",
        description: "Failed to generate debug workflow",
        variant: "destructive",
      });
    }
  };;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-4">
              <Code className="text-white h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Agent Builder</h1>
              <p className="text-xl text-gray-600">Build custom AI agents with Replit integration</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-6">
            <div className="flex items-center">
              <Server className="h-4 w-4 mr-1" />
              <span>Replit Powered</span>
            </div>
            <div className="flex items-center">
              <Sparkles className="h-4 w-4 mr-1" />
              <span>Custom JavaScript</span>
            </div>
            <div className="flex items-center">
              <Bot className="h-4 w-4 mr-1" />
              <span>AI Integration</span>
            </div>
          </div>
        </div>

        {/* Workspace Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Workspace List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FolderOpen className="h-5 w-5 mr-2" />
                  Workspaces
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workspacesLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading workspaces...</p>
                  </div>
                ) : workspaces?.length ? (
                  <div className="space-y-2">
                    {workspaces.map((workspace: AgentWorkspace) => (
                      <button
                        key={workspace.id}
                        onClick={() => selectWorkspace(workspace)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          currentWorkspace?.id === workspace.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">{workspace.name}</div>
                        <div className="text-sm text-gray-500">{workspace.description}</div>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant={workspace.status === 'deployed' ? 'default' : 'secondary'}>
                            {workspace.status}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {workspace.memoryType}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No workspaces yet</p>
                    <p className="text-xs text-gray-400 mt-1">Create your first agent to get started</p>
                  </div>
                )}
                
                <Button className="w-full mt-4" onClick={createNewWorkspace}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Workspace
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentWorkspace ? (
              <Tabs defaultValue="code" className="space-y-4">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="code">Code Editor</TabsTrigger>
                  <TabsTrigger value="prompt">System Prompt</TabsTrigger>
                  <TabsTrigger value="ai-modify" className="relative">
                    <Zap className="h-4 w-4 mr-1" />
                    AI Modify
                  </TabsTrigger>
                  <TabsTrigger value="test">Test & Debug</TabsTrigger>
                  <TabsTrigger value="github" className="relative">
                    GitHub
                    {changes?.hasChanges && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full"></div>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="deploy">Deploy</TabsTrigger>
                </TabsList>
                
                <TabsContent value="code" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>JavaScript Code Editor</CardTitle>
                      <CardDescription>
                        Write custom JavaScript code for your agent. Use the processMessage function to handle user interactions.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="workspace-name">Workspace Name</Label>
                            <Input
                              id="workspace-name"
                              value={currentWorkspace.name}
                              onChange={(e) => setCurrentWorkspace({...currentWorkspace, name: e.target.value})}
                              placeholder="My Custom Agent"
                            />
                          </div>
                          <div>
                            <Label htmlFor="memory-type">Memory Type</Label>
                            <Select value={currentWorkspace.memoryType} onValueChange={(value) => setCurrentWorkspace({...currentWorkspace, memoryType: value as any})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="personal">
                                  <div className="flex items-center">
                                    <User className="h-4 w-4 mr-2" />
                                    Personal Memory
                                  </div>
                                </SelectItem>
                                <SelectItem value="friends">
                                  <div className="flex items-center">
                                    <Users className="h-4 w-4 mr-2" />
                                    Friends Memory
                                  </div>
                                </SelectItem>
                                <SelectItem value="global">
                                  <div className="flex items-center">
                                    <Globe className="h-4 w-4 mr-2" />
                                    Global Memory
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Input
                            id="description"
                            value={currentWorkspace.description}
                            onChange={(e) => setCurrentWorkspace({...currentWorkspace, description: e.target.value})}
                            placeholder="What does your agent do?"
                          />
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label htmlFor="code">JavaScript Code</Label>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCodeAnalysis()}
                                disabled={!code.trim() || isAnalyzing}
                              >
                                {isAnalyzing ? (
                                  <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full mr-1"></div>
                                ) : (
                                  <Sparkles className="h-4 w-4 mr-1" />
                                )}
                                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCodeOptimization()}
                                disabled={!code.trim() || isOptimizing}
                              >
                                {isOptimizing ? (
                                  <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full mr-1"></div>
                                ) : (
                                  <Code className="h-4 w-4 mr-1" />
                                )}
                                {isOptimizing ? 'Optimizing...' : 'Optimize'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGenerateDocumentation()}
                                disabled={!code.trim() || isGeneratingDocs}
                              >
                                {isGeneratingDocs ? (
                                  <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full mr-1"></div>
                                ) : (
                                  <MessageCircle className="h-4 w-4 mr-1" />
                                )}
                                {isGeneratingDocs ? 'Generating...' : 'Document'}
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAdvancedTools(!showAdvancedTools)}
                              >
                                {showAdvancedTools ? 'Hide' : 'Show'} Advanced Tools
                              </Button>
                            </div>
                          </div>
                          <Textarea
                            id="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Write your agent's custom code here..."
                            className="min-h-[400px] font-mono text-sm"
                          />
                        </div>
                        
                        {/* Code Analysis Results */}
                        {codeAnalysis && (
                          <div className="mt-4 space-y-4">
                            <div className="border-t pt-4">
                              <h3 className="font-semibold mb-2">Code Analysis Results</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Complexity Score</span>
                                    <Badge variant={codeAnalysis.complexity <= 5 ? 'default' : 'destructive'}>
                                      {codeAnalysis.complexity}/10
                                    </Badge>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Readability Score</span>
                                    <Badge variant={codeAnalysis.readability >= 7 ? 'default' : 'secondary'}>
                                      {codeAnalysis.readability}/10
                                    </Badge>
                                  </div>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg">
                                  <div className="text-sm font-medium mb-2">Security Issues</div>
                                  <div className="text-sm text-gray-600">
                                    {codeAnalysis.security?.length || 0} issues found
                                  </div>
                                </div>
                              </div>
                              
                              {codeAnalysis.issues && codeAnalysis.issues.length > 0 && (
                                <div className="mt-4">
                                  <h4 className="font-medium mb-2">Code Issues</h4>
                                  <div className="space-y-2">
                                    {codeAnalysis.issues.map((issue: any, index: number) => (
                                      <div key={index} className="p-3 bg-yellow-50 rounded-md">
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <div className="font-medium text-sm">{issue.message}</div>
                                            {issue.line && <div className="text-xs text-gray-500">Line {issue.line}</div>}
                                          </div>
                                          <Badge variant={issue.severity === 'error' ? 'destructive' : 'secondary'}>
                                            {issue.severity}
                                          </Badge>
                                        </div>
                                        {issue.fix && (
                                          <div className="mt-2 text-xs text-gray-600">
                                            <strong>Fix:</strong> {issue.fix}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Code Documentation */}
                        {codeDocumentation && (
                          <div className="mt-4 space-y-4">
                            <div className="border-t pt-4">
                              <h3 className="font-semibold mb-2">Generated Documentation</h3>
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-medium">Summary</h4>
                                    <p className="text-sm text-gray-600 mt-1">{codeDocumentation.summary}</p>
                                  </div>
                                  
                                  {codeDocumentation.functions && codeDocumentation.functions.length > 0 && (
                                    <div>
                                      <h4 className="font-medium">Functions</h4>
                                      <div className="space-y-2 mt-2">
                                        {codeDocumentation.functions.map((func: any, index: number) => (
                                          <div key={index} className="p-3 bg-white rounded-md">
                                            <div className="font-medium text-sm">{func.name}</div>
                                            <div className="text-sm text-gray-600 mt-1">{func.description}</div>
                                            <div className="text-xs text-gray-500 mt-1">Returns: {func.returns}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {codeDocumentation.examples && codeDocumentation.examples.length > 0 && (
                                    <div>
                                      <h4 className="font-medium">Examples</h4>
                                      <div className="space-y-2 mt-2">
                                        {codeDocumentation.examples.map((example: string, index: number) => (
                                          <div key={index} className="p-3 bg-white rounded-md">
                                            <pre className="text-xs text-gray-600 whitespace-pre-wrap">{example}</pre>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Phase 4: Advanced Developer Tools */}
                        {showAdvancedTools && (
                          <div className="mt-4 border-t pt-4">
                            <h3 className="font-semibold mb-3">Advanced Developer Tools</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleGetDeveloperInsights}
                                  disabled={!code.trim()}
                                  className="w-full justify-start"
                                >
                                  <Search className="h-4 w-4 mr-2" />
                                  Get Developer Insights
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleGetSmartSuggestions}
                                  disabled={!code.trim()}
                                  className="w-full justify-start"
                                >
                                  <Lightbulb className="h-4 w-4 mr-2" />
                                  Get Smart Suggestions
                                </Button>
                              </div>
                              
                              <div className="space-y-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleGetLearningPath}
                                  className="w-full justify-start"
                                >
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  Get Learning Path
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const errorDesc = prompt("Describe the error or issue you're facing:");
                                    if (errorDesc) handleGetDebugWorkflow(errorDesc);
                                  }}
                                  disabled={!code.trim()}
                                  className="w-full justify-start"
                                >
                                  <Bug className="h-4 w-4 mr-2" />
                                  Debug Workflow
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Developer Insights Display */}
                        {developerInsights && (
                          <div className="mt-4 border-t pt-4">
                            <h3 className="font-semibold mb-3">Developer Insights</h3>
                            <div className="space-y-4">
                              <div className="p-4 bg-blue-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Code Quality Score</span>
                                  <Badge variant={developerInsights.codeQuality >= 70 ? 'default' : 'destructive'}>
                                    {developerInsights.codeQuality}/100
                                  </Badge>
                                </div>
                                
                                {developerInsights.bestPractices && developerInsights.bestPractices.length > 0 && (
                                  <div className="mt-3">
                                    <h4 className="font-medium text-sm mb-2">Best Practices</h4>
                                    <ul className="text-xs text-gray-600 space-y-1">
                                      {developerInsights.bestPractices.map((practice: string, index: number) => (
                                        <li key={index}>• {practice}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              
                              {developerInsights.recommendations && developerInsights.recommendations.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Recommendations</h4>
                                  <div className="space-y-2">
                                    {developerInsights.recommendations.map((rec: any, index: number) => (
                                      <div key={index} className="p-3 bg-yellow-50 rounded-md">
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <div className="font-medium text-sm">{rec.title}</div>
                                            <div className="text-xs text-gray-600 mt-1">{rec.description}</div>
                                          </div>
                                          <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                                            {rec.priority}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Smart Suggestions Display */}
                        {smartSuggestions && smartSuggestions.length > 0 && (
                          <div className="mt-4 border-t pt-4">
                            <h3 className="font-semibold mb-3">Smart Suggestions</h3>
                            <div className="space-y-2">
                              {smartSuggestions.map((suggestion: any, index: number) => (
                                <div key={index} className="p-3 bg-green-50 rounded-md">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <div className="font-medium text-sm">{suggestion.title}</div>
                                      <div className="text-xs text-gray-600 mt-1">{suggestion.description}</div>
                                    </div>
                                    <Badge variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}>
                                      {suggestion.priority}
                                    </Badge>
                                  </div>
                                  {suggestion.code && (
                                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                                      <pre className="whitespace-pre-wrap">{suggestion.code}</pre>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Learning Path Display */}
                        {learningPath && (
                          <div className="mt-4 border-t pt-4">
                            <h3 className="font-semibold mb-3">Personalized Learning Path</h3>
                            <div className="space-y-3">
                              {learningPath.path && learningPath.path.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Learning Modules</h4>
                                  <div className="space-y-2">
                                    {learningPath.path.map((module: any, index: number) => (
                                      <div key={index} className="p-3 bg-purple-50 rounded-md">
                                        <div className="font-medium text-sm">{module.title}</div>
                                        <div className="text-xs text-gray-600 mt-1">{module.description}</div>
                                        <div className="text-xs text-gray-500 mt-1">Duration: {module.duration}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {learningPath.nextSteps && learningPath.nextSteps.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Next Steps</h4>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {learningPath.nextSteps.map((step: string, index: number) => (
                                      <li key={index}>• {step}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Debug Workflow Display */}
                        {debugWorkflow && (
                          <div className="mt-4 border-t pt-4">
                            <h3 className="font-semibold mb-3">Debug Workflow</h3>
                            <div className="space-y-3">
                              <div className="p-3 bg-red-50 rounded-md">
                                <div className="font-medium text-sm">Root Cause</div>
                                <div className="text-xs text-gray-600 mt-1">{debugWorkflow.rootCause}</div>
                              </div>
                              
                              {debugWorkflow.steps && debugWorkflow.steps.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Debugging Steps</h4>
                                  <div className="space-y-2">
                                    {debugWorkflow.steps.map((step: any, index: number) => (
                                      <div key={index} className="p-3 bg-blue-50 rounded-md">
                                        <div className="font-medium text-sm">Step {step.step}: {step.title}</div>
                                        <div className="text-xs text-gray-600 mt-1">{step.description}</div>
                                        {step.code && (
                                          <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                                            <pre className="whitespace-pre-wrap">{step.code}</pre>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <Button onClick={handleSave} disabled={saveWorkspaceMutation.isPending}>
                            {saveWorkspaceMutation.isPending ? (
                              <>
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Workspace
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="prompt" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>System Prompt Configuration</CardTitle>
                      <CardDescription>
                        Define your agent's personality, instructions, and behavior patterns.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="system-prompt">System Prompt</Label>
                          <Textarea
                            id="system-prompt"
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder="You are a helpful AI assistant..."
                            className="min-h-[300px]"
                          />
                        </div>
                        
                        <Button onClick={handleSave} disabled={saveWorkspaceMutation.isPending}>
                          {saveWorkspaceMutation.isPending ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Prompt
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="ai-modify" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                        AI-Powered Brain Modification
                      </CardTitle>
                      <CardDescription>
                        Use natural language to modify your agent with AI assistance. Select an AI provider and describe the changes you want.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* AI Provider Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            aiProvider === 'claude' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                          }`} onClick={() => setAiProvider('claude')}>
                            <div className="flex items-center mb-2">
                              <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                              <h3 className="font-semibold">Claude 4.0</h3>
                            </div>
                            <p className="text-sm text-gray-600">Best for complex reasoning and system prompt modifications</p>
                          </div>
                          
                          <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            aiProvider === 'gpt4' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                          }`} onClick={() => setAiProvider('gpt4')}>
                            <div className="flex items-center mb-2">
                              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                              <h3 className="font-semibold">GPT-4o</h3>
                            </div>
                            <p className="text-sm text-gray-600">Best for creative content generation and lessons</p>
                          </div>
                          
                          <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            aiProvider === 'codex' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          }`} onClick={() => setAiProvider('codex')}>
                            <div className="flex items-center mb-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                              <h3 className="font-semibold">Codex</h3>
                            </div>
                            <p className="text-sm text-gray-600">Best for code modifications and feature implementation</p>
                          </div>
                        </div>

                        {/* Modification Scope */}
                        <div>
                          <Label htmlFor="modification-scope">Modification Scope</Label>
                          <Select value={modificationScope} onValueChange={(value: any) => setModificationScope(value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select what to modify" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="system_prompt">System Prompt & Personality</SelectItem>
                              <SelectItem value="content">Content & Knowledge</SelectItem>
                              <SelectItem value="code">JavaScript Code & Logic</SelectItem>
                              <SelectItem value="structure">Agent Structure & Settings</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Natural Language Instruction */}
                        <div>
                          <Label htmlFor="modification-instruction">Describe Your Changes</Label>
                          <Textarea
                            id="modification-instruction"
                            value={modificationInstruction}
                            onChange={(e) => setModificationInstruction(e.target.value)}
                            placeholder={`Example: "Create 50 Spanish lessons with 20 words each" or "Make this agent more friendly and conversational" or "Add calendar management features"`}
                            className="min-h-[100px]"
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Be specific about what you want to change. The AI will analyze your current agent and propose modifications.
                          </p>
                        </div>

                        {/* Generate Modification Button */}
                        <Button 
                          onClick={() => handleGenerateModification()}
                          disabled={!modificationInstruction.trim() || isGeneratingModification}
                          className="w-full"
                        >
                          {isGeneratingModification ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                              Generating AI Modification...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Generate Modification with {aiProvider === 'claude' ? 'Claude' : aiProvider === 'gpt4' ? 'GPT-4' : 'Codex'}
                            </>
                          )}
                        </Button>

                        {/* Current Modification Preview */}
                        {currentModification && (
                          <div className="border rounded-lg p-4 bg-gray-50">
                            <h3 className="font-semibold mb-3 flex items-center">
                              <Search className="h-4 w-4 mr-2" />
                              Proposed Modification
                            </h3>
                            
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium text-sm mb-2">Preview:</h4>
                                <p className="text-sm bg-white p-3 rounded border">{currentModification.previewContent}</p>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-sm mb-2">Estimated Impact:</h4>
                                <p className="text-sm text-gray-600">{currentModification.estimatedImpact}</p>
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button 
                                  onClick={() => handleApplyModification(currentModification.id)}
                                  className="flex-1"
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Apply Changes
                                </Button>
                                <Button 
                                  variant="outline" 
                                  onClick={() => handleRejectModification(currentModification.id)}
                                  className="flex-1"
                                >
                                  Reject Changes
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Modification History */}
                        {modificationHistory.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-3">Modification History</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {modificationHistory.slice(0, 5).map((mod: any) => (
                                <div key={mod.id} className="flex items-center justify-between p-3 bg-white border rounded">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{mod.instruction}</p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(mod.createdAt).toLocaleDateString()} • {mod.aiProvider}
                                    </p>
                                  </div>
                                  <Badge variant={mod.status === 'applied' ? 'default' : mod.status === 'pending_review' ? 'secondary' : 'outline'}>
                                    {mod.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="test" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Test Your Agent</CardTitle>
                      <CardDescription>
                        Test your agent's responses before deployment.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="test-message">Test Message</Label>
                          <Input
                            id="test-message"
                            value={testMessage}
                            onChange={(e) => setTestMessage(e.target.value)}
                            placeholder="Hello, how can you help me?"
                          />
                        </div>
                        
                        <Button onClick={handleTest} disabled={isTesting}>
                          {isTesting ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                              Testing...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Test Agent
                            </>
                          )}
                        </Button>
                        
                        {testResult && (
                          <div className="mt-4">
                            <Label>Agent Response:</Label>
                            <div className="bg-gray-50 p-4 rounded-lg mt-2 border">
                              <p className="text-sm whitespace-pre-wrap">{testResult}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* AI-Powered Debug Assistant */}
                        <div className="border-t pt-4">
                          <h3 className="font-semibold mb-3">AI Debug Assistant</h3>
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="debug-error">Describe the error or issue:</Label>
                              <Input
                                id="debug-error"
                                placeholder="e.g., Function returns undefined, TypeError, etc."
                                className="mt-1"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const target = e.target as HTMLInputElement;
                                    if (target.value.trim()) {
                                      handleDebugCode(target.value.trim());
                                      target.value = '';
                                    }
                                  }
                                }}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="code-description">Or generate code from description:</Label>
                              <Input
                                id="code-description"
                                placeholder="e.g., Create a function that calculates user sentiment"
                                className="mt-1"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const target = e.target as HTMLInputElement;
                                    if (target.value.trim()) {
                                      handleGenerateFromDescription(target.value.trim());
                                      target.value = '';
                                    }
                                  }
                                }}
                              />
                            </div>
                            
                            <div className="text-xs text-gray-500">
                              Press Enter to submit, or use the AI assistance buttons in the Code Editor tab
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="github" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Github className="h-5 w-5 mr-2" />
                        GitHub Integration
                      </CardTitle>
                      <CardDescription>
                        Connect your workspace to GitHub for version control and collaboration.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* GitHub Connection Status */}
                        <div className="border rounded-lg p-4">
                          <h3 className="font-medium mb-2">GitHub Connection</h3>
                          {githubLoading ? (
                            <div className="flex items-center">
                              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                              <span className="text-sm text-gray-500">Checking connection...</span>
                            </div>
                          ) : githubStatus?.connected ? (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                <span className="text-sm font-medium">Connected as {githubStatus.username}</span>
                              </div>
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Connected
                              </Badge>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                                <span className="text-sm text-gray-500">Not connected</span>
                              </div>
                              <Button
                                onClick={() => connectGitHubMutation.mutate()}
                                disabled={connectGitHubMutation.isPending}
                                variant="outline"
                                size="sm"
                              >
                                {connectGitHubMutation.isPending ? (
                                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                                ) : (
                                  <Github className="h-4 w-4 mr-2" />
                                )}
                                Connect GitHub
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Repository Status */}
                        {githubStatus?.connected && currentWorkspace && (
                          <div className="border rounded-lg p-4">
                            <h3 className="font-medium mb-2">Repository Status</h3>
                            {currentWorkspace.githubRepoUrl ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <GitBranch className="h-4 w-4 mr-2 text-gray-500" />
                                    <span className="text-sm font-medium">{currentWorkspace.githubRepoName}</span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(currentWorkspace.githubRepoUrl, '_blank')}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View on GitHub
                                  </Button>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <Cloud className="h-4 w-4 mr-2 text-gray-500" />
                                    <span className="text-sm text-gray-500">
                                      Last sync: {currentWorkspace.lastGitSync ? new Date(currentWorkspace.lastGitSync).toLocaleString() : 'Never'}
                                    </span>
                                  </div>
                                  <Badge variant={currentWorkspace.gitSyncStatus === 'synced' ? 'default' : 'secondary'}>
                                    {currentWorkspace.gitSyncStatus || 'pending'}
                                  </Badge>
                                </div>
                                
                                <div className="flex space-x-2">
                                  <Button
                                    onClick={() => syncGitHubMutation.mutate({ workspaceId: currentWorkspace.id, direction: 'push' })}
                                    disabled={syncGitHubMutation.isPending}
                                    size="sm"
                                  >
                                    {syncGitHubMutation.isPending ? (
                                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                    ) : (
                                      <UploadIcon className="h-4 w-4 mr-2" />
                                    )}
                                    Push to GitHub
                                  </Button>
                                  <Button
                                    onClick={() => syncGitHubMutation.mutate({ workspaceId: currentWorkspace.id, direction: 'pull' })}
                                    disabled={syncGitHubMutation.isPending}
                                    variant="outline"
                                    size="sm"
                                  >
                                    {syncGitHubMutation.isPending ? (
                                      <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                                    ) : (
                                      <Download className="h-4 w-4 mr-2" />
                                    )}
                                    Pull from GitHub
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 mb-4">No repository connected</p>
                                <Button
                                  onClick={() => createRepoMutation.mutate(currentWorkspace.id)}
                                  disabled={createRepoMutation.isPending || !currentWorkspace.id}
                                >
                                  {createRepoMutation.isPending ? (
                                    <>
                                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                      Creating...
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4 mr-2" />
                                      Create Repository
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Commit History */}
                        {currentWorkspace?.githubRepoName && (
                          <div className="border rounded-lg p-4">
                            <h3 className="font-medium mb-2">Recent Commits</h3>
                            {commitsLoading ? (
                              <div className="text-center py-4">
                                <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                                <span className="text-sm text-gray-500">Loading commits...</span>
                              </div>
                            ) : commits?.commits?.length > 0 ? (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {commits.commits.slice(0, 5).map((commit: any) => (
                                  <div key={commit.sha} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div className="flex-1">
                                      <div className="text-sm font-medium truncate">{commit.commit.message}</div>
                                      <div className="text-xs text-gray-500">
                                        {commit.commit.author.name} • {new Date(commit.commit.author.date).toLocaleDateString()}
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-400 font-mono">
                                      {commit.sha.substring(0, 7)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 text-center py-4">No commits yet</p>
                            )}
                          </div>
                        )}

                        {/* Change Detection */}
                        {changes && currentWorkspace?.githubRepoName && (
                          <div className="border rounded-lg p-4">
                            <h3 className="font-medium mb-2">Repository Status</h3>
                            <div className="space-y-2">
                              {changes.hasChanges && (
                                <div className="flex items-center p-2 bg-yellow-50 border border-yellow-200 rounded">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                                  <span className="text-sm text-yellow-800">
                                    New changes detected in repository
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Sync Status:</span>
                                <Badge variant={changes.syncStatus === 'synced' ? 'default' : 'secondary'}>
                                  {changes.syncStatus}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Last Sync:</span>
                                <span className="text-gray-500">
                                  {changes.lastSync ? new Date(changes.lastSync).toLocaleDateString() : 'Never'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* GitHub Features */}
                        <div className="border rounded-lg p-4">
                          <h3 className="font-medium mb-2">GitHub Features</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                              <Github className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                              <h4 className="font-medium text-sm">Version Control</h4>
                              <p className="text-xs text-gray-500 mt-1">Track changes and history</p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                              <Users className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                              <h4 className="font-medium text-sm">Collaboration</h4>
                              <p className="text-xs text-gray-500 mt-1">Work with team members</p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                              <Cloud className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                              <h4 className="font-medium text-sm">Backup</h4>
                              <p className="text-xs text-gray-500 mt-1">Secure cloud storage</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="deploy" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Deploy Your Agent</CardTitle>
                      <CardDescription>
                        Deploy your agent to make it available for conversations.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Alert>
                          <Bot className="h-4 w-4" />
                          <AlertDescription>
                            Deploying will create a new agent in your ShareBrain account that you can chat with and share.
                          </AlertDescription>
                        </Alert>
                        
                        <div className="flex items-center space-x-4">
                          <Button onClick={handleDeploy} disabled={isDeploying || !currentWorkspace.id}>
                            {isDeploying ? (
                              <>
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                Deploying...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Deploy Agent
                              </>
                            )}
                          </Button>
                          
                          <Button variant="outline" asChild>
                            <Link href="/agents">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View My Agents
                            </Link>
                          </Button>
                        </div>
                        
                        {!currentWorkspace.id && (
                          <p className="text-sm text-gray-500">
                            Please save your workspace first before deploying.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="text-center py-16">
                  <Code className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Workspace Selected</h3>
                  <p className="text-gray-500 mb-6">Select a workspace from the sidebar or create a new one to get started.</p>
                  <Button onClick={createNewWorkspace}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Workspace
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}