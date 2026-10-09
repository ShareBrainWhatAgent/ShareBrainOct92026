import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Bot, Download, Star, Eye, Headphones, PenTool, BarChart3, Handshake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Agent } from "@shared/schema";

export default function AgentLibrary() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [previewAgent, setPreviewAgent] = useState<Agent | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["/api/agents/templates"],
  });

  const useTemplateMutation = useMutation({
    mutationFn: async (template: Agent) => {
      const agentData = {
        name: `${template.name} (Copy)`,
        description: template.description,
        category: template.category,
        model: template.model,
        temperature: template.temperature,
        maxTokens: template.maxTokens,
        systemPrompt: template.systemPrompt,
        sampleUser: template.sampleUser,
        sampleAgent: template.sampleAgent,
        status: "draft",
        isTemplate: false,
      };
      
      const response = await apiRequest("POST", "/api/agents", agentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Template used successfully",
        description: "A new agent has been created from the template.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error using template",
        description: error.message || "Failed to create agent from template.",
        variant: "destructive",
      });
    },
  });

  const filteredTemplates = templates?.filter((template: any) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "All Categories" || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  })?.sort((a: any, b: any) => a.name.localeCompare(b.name)) || [];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Customer Support":
        return <Headphones className="text-primary h-5 w-5" />;
      case "Content Creation":
        return <PenTool className="text-purple-600 h-5 w-5" />;
      case "Data Analysis":
        return <BarChart3 className="text-amber-600 h-5 w-5" />;
      case "Sales":
        return <Handshake className="text-green-600 h-5 w-5" />;
      default:
        return <Bot className="text-primary h-5 w-5" />;
    }
  };

  const getPopularityBadge = (uses: number) => {
    if (uses > 1000) return { label: "Popular", variant: "default" as const };
    if (uses > 500) return { label: "Trending", variant: "secondary" as const };
    return { label: "New", variant: "outline" as const };
  };

  return (
    <>
      {/* Header */}
      <header className="bg-black border-b border-white px-6 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Agent Library</h2>
            <p className="text-white mt-1">Browse and discover pre-built AI agents</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search agents..."
                className="pl-10 pr-4 py-2 w-64"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Categories">All Categories</SelectItem>
                <SelectItem value="Customer Support">Customer Support</SelectItem>
                <SelectItem value="Content Creation">Content Creation</SelectItem>
                <SelectItem value="Data Analysis">Data Analysis</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
              </SelectContent>
            </Select>
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
                  <div className="h-16 bg-slate-200 rounded mb-4"></div>
                  <div className="h-8 bg-slate-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-16">
            <Bot className="h-16 w-16 text-white mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-white mb-2">No agents found</h3>
            <p className="text-white">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const popularityBadge = getPopularityBadge(template.uses);
              
              return (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {getCategoryIcon(template.category)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{template.name}</h3>
                          <p className="text-xs text-white">{template.category}</p>
                        </div>
                      </div>
                      <Badge variant={popularityBadge.variant}>
                        {popularityBadge.label}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-white mb-4 line-clamp-3">{template.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 text-xs text-white">
                        <span>
                          <Download className="h-3 w-3 mr-1 inline" />
                          {template.uses.toLocaleString()} uses
                        </span>
                        <span>
                          <Star className="h-3 w-3 mr-1 inline" />
                          {template.rating.toFixed(1)} rating
                        </span>
                      </div>
                      <span className="text-xs text-white">{template.model}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        className="flex-1 bg-primary hover:bg-blue-700 text-white"
                        onClick={() => useTemplateMutation.mutate(template)}
                        disabled={useTemplateMutation.isPending}
                      >
                        {useTemplateMutation.isPending ? "Creating..." : "Use Template"}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setPreviewAgent(template)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Preview Dialog */}
      <Dialog open={!!previewAgent} onOpenChange={() => setPreviewAgent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                {previewAgent && getCategoryIcon(previewAgent.category)}
              </div>
              <div>
                <h3 className="font-semibold text-white">{previewAgent?.name}</h3>
                <p className="text-sm text-white">{previewAgent?.category}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {previewAgent && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-white mb-2">Description</h4>
                <p className="text-sm text-white">{previewAgent.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-white mb-2">Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white">Model:</span>
                      <span className="text-white">{previewAgent.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white">Temperature:</span>
                      <span className="text-white">{previewAgent.temperature}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white">Max Tokens:</span>
                      <span className="text-white">{previewAgent.maxTokens}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-white mb-2">Usage Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white">Uses:</span>
                      <span className="text-white">{previewAgent.uses.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white">Rating:</span>
                      <span className="flex items-center text-white">
                        <Star className="h-3 w-3 mr-1 text-yellow-500" />
                        {previewAgent.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">System Prompt</h4>
                <div className="bg-black border border-white rounded-lg p-4">
                  <p className="text-sm font-mono text-white">{previewAgent.systemPrompt}</p>
                </div>
              </div>
              
              {previewAgent.sampleUser && previewAgent.sampleAgent && (
                <div>
                  <p className="text-sm text-white">
                    If you would like an example of a sample conversation, please write
                    "sample" in the chat box.
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setPreviewAgent(null)}>
                  Close
                </Button>
                <Button 
                  className="bg-primary hover:bg-blue-700 text-white"
                  onClick={() => {
                    useTemplateMutation.mutate(previewAgent);
                    setPreviewAgent(null);
                  }}
                  disabled={useTemplateMutation.isPending}
                >
                  Use Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
