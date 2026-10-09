import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Plus, Play, Edit, Trash2, Settings, Eye, EyeOff, MessageSquare, FileText, Globe, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import type { Agent } from "@shared/schema";

function AgentsContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const { data: agents, isLoading } = useQuery({
    queryKey: ["/api/agents/public"],
  });

  console.log("Agents data:", agents);

  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: number) => {
      await apiRequest("DELETE", `/api/agents/${agentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: "Brain deleted",
        description: "The brain has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete brain. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAgent = (agentId: number) => {
    deleteAgentMutation.mutate(agentId);
  };

  const generateWebsiteMutation = useMutation({
    mutationFn: async ({ agentId, agentName }: { agentId: number; agentName: string }) => {
      const response = await apiRequest("POST", `/api/agents/${agentId}/generate-website`, {
        agentName,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: "Website Generated!",
        description: `Website created at ${data.websiteUrl}`,
      });
      // Open the website in a new tab
      window.open(data.websiteUrl, '_blank');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate website. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateWebsite = (agentId: number, agentName: string) => {
    generateWebsiteMutation.mutate({ agentId, agentName });
  };

  const toggleCardExpansion = (agentId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(agentId)) {
      newExpanded.delete(agentId);
    } else {
      newExpanded.add(agentId);
    }
    setExpandedCards(newExpanded);
  };

  return (
    <>
      {/* Header */}
      <header className="bg-black border-b border-white px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">My Brains</h2>
            <p className="text-white mt-1">Manage and configure your AI brains</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 scrollbar-track-slate-100">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded mb-4"></div>
                  <div className="h-8 bg-slate-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !agents ? (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Website Link Feature Demo
              </h3>
              <p className="text-blue-800 mb-4">Your India Motorcycle Trip Brain now has a companion website! When you're logged in, you'll see the website link button like this:</p>
              
              <div className="bg-white rounded-lg p-4 border shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Bot className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 flex items-center space-x-2">
                        <span>India Motorcycle Trip Brain</span>
                        <span className="text-xs text-slate-500">#321</span>
                      </h3>
                      <p className="text-xs text-slate-500">Travel & Transportation</p>
                    </div>
                  </div>
                  <Badge variant="default">active</Badge>
                </div>
                
                <p className="text-sm text-slate-600 mb-4">Expert guide for motorcycle travel across India's diverse regions, from the Himalayas to coastal roads.</p>
                
                <div className="flex space-x-2 flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="flex-1" disabled>
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Chat
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    title="View the companion website for this brain"
                    className="min-h-[44px] min-w-[44px] touch-manipulation bg-green-50 border-green-200 hover:bg-green-100"
                    onClick={() => window.open("https://sharebrain.me/agent-website/indiamotorcycletripagent", '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 text-green-600" />
                  </Button>
                  
                  <Button size="sm" variant="outline" className="min-h-[44px] min-w-[44px] touch-manipulation" disabled>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-100 rounded">
                <p className="text-blue-900 font-medium">✓ Website URL: <a href="https://sharebrain.me/agent-website/indiamotorcycletripagent" className="underline hover:text-blue-700" target="_blank">https://sharebrain.me/agent-website/indiamotorcycletripagent</a></p>
                <p className="text-blue-900 font-medium mt-2">✓ Brain Profile URL: <a href="https://sharebrain.me/agent/indiamotorcycletripagent" className="underline hover:text-blue-700" target="_blank">https://sharebrain.me/agent/indiamotorcycletripagent</a></p>
                <p className="text-blue-800 mt-2">Both URLs are publicly accessible (no login required) and great for SEO!</p>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <Link href="/chat-demo">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat Interface
                      </Button>
                    </Link>
                    <Link href="/agent/indiamotorcycletripagent">
                      <Button variant="outline" className="w-full">
                        <Bot className="h-4 w-4 mr-2" />
                        Brain Profile
                      </Button>
                    </Link>
                  </div>
                  <Link href="/url-comparison">
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Compare All URL Types
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : agents?.length === 0 ? (
          <div className="text-center py-16">
            <Bot className="h-16 w-16 text-white mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-white mb-2">No agents yet</h3>
            <p className="text-white mb-6 max-w-md mx-auto">
              Create your first AI agent to get started. You can choose from templates or build one from scratch.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/create-agent">
                <Button className="bg-primary hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Agent
                </Button>
              </Link>
              <Link href="/library">
                <Button variant="outline">Browse Templates</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents?.map((agent) => {
              const isExpanded = expandedCards.has(agent.id);
              return (
                <Card key={agent.id} className="hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Bot className="text-primary h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white flex items-center space-x-2">
                            <span>{agent.name}</span>
                            <span className="text-xs text-white">#{agent.id}</span>
                          </h3>
                          <p className="text-xs text-white">{agent.category}</p>
                        </div>
                      </div>
                      <Badge variant={agent.status === "active" ? "default" : agent.status === "testing" ? "secondary" : "outline"}>
                        {agent.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-white mb-4 line-clamp-2">{agent.description}</p>
                    
                    <div className="flex items-center justify-between mb-4 text-xs text-white">
                      <span></span>
                      <span>Updated {new Date(agent.updatedAt).toLocaleDateString()}</span>
                    </div>

                    {/* System Prompt Preview */}
                    {agent.systemPrompt && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-white">Instructions</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleCardExpansion(agent.id)}
                            className="h-8 w-8 p-0 touch-manipulation"
                          >
                            {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="bg-black border border-white rounded-lg p-3 text-xs text-white">
                          {isExpanded ? (
                            <div className="space-y-3">
                              <div>
                                <p className="font-mono whitespace-pre-wrap">{agent.systemPrompt}</p>
                              </div>
                              {agent.sampleUser && agent.sampleAgent && (
                                <div className="pt-3 border-t border-white">
                                  <div className="space-y-2">
                                    <div>
                                      <span className="font-medium text-white">Sample User:</span>
                                      <p className="text-white mt-1">{agent.sampleUser}</p>
                                    </div>
                                    <div>
                                      <span className="font-medium text-white">Sample Agent:</span>
                                      <p className="text-white mt-1">{agent.sampleAgent}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="truncate">{agent.systemPrompt}</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex space-x-2 flex-wrap gap-2">
                      <Link href={`/chat/${agent.id}`}>
                        <Button size="sm" variant="outline" className="flex-1">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Chat
                        </Button>
                      </Link>
                      
                      {/* Documents link - only for Llama models */}
                      {agent.model?.includes('Llama') && (
                        <Link href={`/agents/${agent.id}/documents`}>
                          <Button size="sm" variant="outline" title="Upload documents to enhance this agent's knowledge" className="min-h-[44px] min-w-[44px] touch-manipulation">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      
                      {/* Website buttons */}
                      {agent.websiteUrl ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          title="View the companion website for this brain"
                          className="min-h-[44px] min-w-[44px] touch-manipulation"
                          onClick={() => window.open(agent.websiteUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          title="Generate a companion website showcasing this brain's knowledge"
                          className="min-h-[44px] min-w-[44px] touch-manipulation"
                          onClick={() => generateWebsite(agent.id, agent.name)}
                        >
                          <Globe className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {!agent.isSystemAgent && (
                        <Link href={`/edit-agent/${agent.id}`}>
                          <Button size="sm" variant="outline" className="min-h-[44px] min-w-[44px] touch-manipulation">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      
                      {agent.isSystemAgent && (
                        <div className="flex items-center min-h-[44px] px-3">
                          <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                            System Agent
                          </Badge>
                        </div>
                      )}
                      
                      {!agent.isSystemAgent && (
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            disabled={deleteAgentMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px] min-w-[44px] touch-manipulation"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{agent.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteAgent(agent.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

export default function Agents() {
  return <AgentsContent />;
}
