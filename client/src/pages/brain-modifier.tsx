import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Bot, Code, FileText, Settings, History, GitBranch, Play, Check, X } from "lucide-react";

interface BrainModificationRequest {
  instruction: string;
  aiProvider: 'claude' | 'gpt4' | 'codex';
  modificationScope: 'content' | 'system_prompt' | 'code' | 'structure';
}

interface BrainModificationResult {
  modificationId: number;
  previewContent: string;
  proposedChanges: any;
  estimatedImpact: string;
  requiresApproval: boolean;
}

interface Brain {
  id: number;
  name: string;
  description: string;
  category: string;
  systemPrompt: string;
  model: string;
  temperature: number;
}

export default function BrainModifier() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [instruction, setInstruction] = useState("");
  const [aiProvider, setAiProvider] = useState<'claude' | 'gpt4' | 'codex'>('claude');
  const [modificationScope, setModificationScope] = useState<'content' | 'system_prompt' | 'code' | 'structure'>('content');
  const [currentModification, setCurrentModification] = useState<BrainModificationResult | null>(null);

  const brainId = parseInt(id as string);

  // Get brain details
  const { data: brain, isLoading: brainLoading } = useQuery({
    queryKey: [`/api/agents/${brainId}`],
    enabled: !!brainId,
  });

  // Get brain modification history
  const { data: history } = useQuery({
    queryKey: [`/api/brain-modifications/${brainId}/history`],
    enabled: !!brainId,
  });

  // Generate modification mutation
  const generateModificationMutation = useMutation({
    mutationFn: async (request: BrainModificationRequest) => {
      const response = await apiRequest("POST", "/api/brain-modifications/generate", {
        brainId,
        ...request
      });
      return response.json();
    },
    onSuccess: (result: BrainModificationResult) => {
      setCurrentModification(result);
      toast({
        title: "Modification Generated",
        description: "AI has analyzed your request and generated proposed changes.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate modification. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Apply modification mutation
  const applyModificationMutation = useMutation({
    mutationFn: async (modificationId: number) => {
      return await apiRequest("POST", `/api/brain-modifications/${modificationId}/apply`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/agents/${brainId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/brain-modifications/${brainId}/history`] });
      setCurrentModification(null);
      setInstruction("");
      toast({
        title: "Modification Applied",
        description: "Your brain has been successfully updated!",
      });
    },
    onError: (error) => {
      toast({
        title: "Application Failed",
        description: "Failed to apply modification. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject modification
  const rejectModification = () => {
    setCurrentModification(null);
    toast({
      title: "Modification Rejected",
      description: "The proposed changes have been discarded.",
    });
  };

  const handleGenerate = async () => {
    if (!instruction.trim()) {
      toast({
        title: "Instruction Required",
        description: "Please provide an instruction for the AI.",
        variant: "destructive",
      });
      return;
    }

    generateModificationMutation.mutate({
      instruction: instruction.trim(),
      aiProvider,
      modificationScope,
    });
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'claude':
        return <Bot className="w-4 h-4" />;
      case 'gpt4':
        return <Bot className="w-4 h-4" />;
      case 'codex':
        return <Code className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'content':
        return <FileText className="w-4 h-4" />;
      case 'system_prompt':
        return <Settings className="w-4 h-4" />;
      case 'code':
        return <Code className="w-4 h-4" />;
      case 'structure':
        return <GitBranch className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (brainLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  if (!brain) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Brain Not Found</h1>
          <Button onClick={() => setLocation("/agents")}>
            Back to Agents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/agents")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Agents
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Modify {brain.name}</h1>
            <p className="text-muted-foreground mt-1">{brain.description}</p>
          </div>
          <Badge variant="secondary" className="ml-auto">
            {brain.category}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Modification Interface */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Modification Request */}
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Brain Modification</CardTitle>
              <CardDescription>
                Describe the changes you want to make to your brain using natural language.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">AI Provider</label>
                  <Select value={aiProvider} onValueChange={(value: 'claude' | 'gpt4' | 'codex') => setAiProvider(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude">
                        <div className="flex items-center gap-2">
                          {getProviderIcon('claude')}
                          Claude 4.0 (Best for complex reasoning)
                        </div>
                      </SelectItem>
                      <SelectItem value="gpt4">
                        <div className="flex items-center gap-2">
                          {getProviderIcon('gpt4')}
                          GPT-4o (Creative content generation)
                        </div>
                      </SelectItem>
                      <SelectItem value="codex">
                        <div className="flex items-center gap-2">
                          {getProviderIcon('codex')}
                          Codex (Code modifications)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Modification Scope</label>
                  <Select value={modificationScope} onValueChange={(value: 'content' | 'system_prompt' | 'code' | 'structure') => setModificationScope(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="content">
                        <div className="flex items-center gap-2">
                          {getScopeIcon('content')}
                          Content (lessons, examples, knowledge)
                        </div>
                      </SelectItem>
                      <SelectItem value="system_prompt">
                        <div className="flex items-center gap-2">
                          {getScopeIcon('system_prompt')}
                          Personality & Behavior
                        </div>
                      </SelectItem>
                      <SelectItem value="code">
                        <div className="flex items-center gap-2">
                          {getScopeIcon('code')}
                          Logic & Features
                        </div>
                      </SelectItem>
                      <SelectItem value="structure">
                        <div className="flex items-center gap-2">
                          {getScopeIcon('structure')}
                          Architecture & Organization
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Instructions</label>
                <Textarea
                  placeholder="Example: Create 50 new Spanish lessons with 20 vocabulary words each, focusing on common conversational phrases..."
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={generateModificationMutation.isPending || !instruction.trim()}
                className="w-full"
              >
                {generateModificationMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Modifications...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Generate Modifications
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Generated Modifications */}
          {currentModification && (
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Proposed Modifications
                </CardTitle>
                <CardDescription>
                  Review the AI-generated changes before applying them to your brain.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Summary</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm">{currentModification.previewContent}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Impact Assessment</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm">{currentModification.estimatedImpact}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => applyModificationMutation.mutate(currentModification.modificationId)}
                    disabled={applyModificationMutation.isPending}
                    className="flex-1"
                  >
                    {applyModificationMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Applying...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Apply Changes
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={rejectModification} className="flex-1">
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Brain Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium">Model</label>
                <p className="text-sm text-muted-foreground">{brain.model}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Temperature</label>
                <p className="text-sm text-muted-foreground">{brain.temperature}</p>
              </div>
              <div>
                <label className="text-sm font-medium">System Prompt</label>
                <div className="bg-gray-50 p-3 rounded text-xs max-h-32 overflow-y-auto">
                  {brain.systemPrompt}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modification History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-4 h-4" />
                Recent Changes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {history?.modifications?.length ? (
                  <div className="space-y-3">
                    {history.modifications.slice(0, 10).map((mod: any) => (
                      <div key={mod.id} className="border-l-2 border-gray-200 pl-3">
                        <div className="flex items-center gap-2 mb-1">
                          {getProviderIcon(mod.aiProvider)}
                          <Badge variant={mod.status === 'applied' ? 'default' : 'secondary'} className="text-xs">
                            {mod.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {mod.instruction}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(mod.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No modifications yet
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <GitBranch className="w-4 h-4 mr-2" />
                View GitHub Repo
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <History className="w-4 h-4 mr-2" />
                Version History
              </Button>
              <Link href={`/agents/${brainId}/test`}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Play className="w-4 h-4 mr-2" />
                  Test Brain
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}