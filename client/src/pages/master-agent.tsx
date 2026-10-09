import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Zap, Users, ArrowRight, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ChatInterface from "@/components/chat-interface";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Agent, Message } from "@shared/schema";

interface MasterAgentMessage extends Omit<Message, 'metadata'> {
  metadata?: {
    agentSwitched?: boolean;
    activeAgentId?: number;
    activeAgentName?: string;
  } | any;
}

export default function MasterAgent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MasterAgentMessage[]>([]);
  const [currentActiveAgent, setCurrentActiveAgent] = useState<Agent | null>(null);
  const [selectedMasterAgentId, setSelectedMasterAgentId] = useState<number | null>(null);

  // Get all master agents
  const { data: allAgents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ["/api/agents"],
  });

  // Filter master agents
  const masterAgents = Array.isArray(allAgents)
    ? allAgents.filter((agent: Agent) => agent.isMasterAgent)
    : [];

  // Master agents should exist from server startup

  // Filter out master agents and templates from the available agents list
  const agentsList = Array.isArray(allAgents) 
    ? allAgents.filter((agent: Agent) => !agent.isMasterAgent && !agent.isTemplate)
    : [];

  // Get active master agent - use selected one or default to first available
  const activeMasterAgent = selectedMasterAgentId && masterAgents.length > 0
    ? masterAgents.find((agent: Agent) => agent.id === selectedMasterAgentId) || masterAgents[0]
    : masterAgents[0];


  // Master agent chat mutation
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!activeMasterAgent) throw new Error("No master agent selected");
      const response = await apiRequest("POST", "/api/master-agent/chat", {
        message,
        conversationId,
        masterAgentId: activeMasterAgent.id
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Update conversation ID if new
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      // Update current active agent
      if (data.activeAgent) {
        setCurrentActiveAgent(data.activeAgent);
      }

      // Show agent switch notification
      if (data.agentSwitched && data.activeAgent) {
        toast({
          title: "Agent Switched",
          description: `Now channeling ${data.activeAgent.name}`,
        });
      }

      // Update messages
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${data.conversationId}/messages`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message to Master Agent",
        variant: "destructive",
      });
    },
  });

  // Load conversation messages when conversation ID is available
  const { data: conversationMessages = [] } = useQuery({
    queryKey: [`/api/conversations/${conversationId}/messages`],
    enabled: Boolean(conversationId),
  });

  // Update local messages when conversation messages change
  useEffect(() => {
    if (Array.isArray(conversationMessages)) {
      setMessages(conversationMessages);
    }
  }, [conversationMessages]);

  const handleSendMessage = (message: string) => {
    chatMutation.mutate(message);
  };

  if (isLoadingAgents) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (masterAgents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-500">No master agent available</p>
      </div>
    );
  }

  if (!activeMasterAgent) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const agentsWithKeywords = agentsList.filter(agent => agent.triggerKeywords);

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Zap className="text-white h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{activeMasterAgent?.name || "Master Agent"}</h2>
              <p className="text-slate-600 mt-1">
                {currentActiveAgent 
                  ? `Currently channeling: ${currentActiveAgent.name}`
                  : "AI orchestrator that can access all your agents"
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Model Selector */}
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-slate-500" />
              <Select 
                value={selectedMasterAgentId?.toString() || ""} 
                onValueChange={(value) => {
                  const agentId = parseInt(value);
                  setSelectedMasterAgentId(agentId);
                  // Clear conversation when switching models
                  setConversationId(null);
                  setMessages([]);
                  setCurrentActiveAgent(null);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {masterAgents.map((agent: Agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{agent.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {agent.model}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {currentActiveAgent && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Active: {currentActiveAgent.name}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar with agent info */}
        <div className="w-80 bg-slate-50 border-r border-slate-200 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* How it works */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Bot className="h-5 w-5 mr-2" />
                  How Master Agent Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p>Say any agent's name to switch to that agent</p>
                </div>
                <div className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p>Use trigger keywords to quickly activate agents</p>
                </div>
                <div className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p>Get general help when no specific agent is active</p>
                </div>
              </CardContent>
            </Card>

            {/* Available agents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Available Agents ({agentsList.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {agentsList.slice(0, 5).map((agent: Agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{agent.name}</p>
                      <p className="text-xs text-slate-500">{agent.category}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {agent.model}
                    </Badge>
                  </div>
                ))}
                {agentsList.length > 5 && (
                  <p className="text-xs text-slate-500 text-center">
                    +{agentsList.length - 5} more agents
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Trigger keywords */}
            {agentsWithKeywords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Triggers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agentsWithKeywords.slice(0, 3).map((agent: Agent) => (
                    <div key={agent.id} className="space-y-1">
                      <p className="font-medium text-sm">{agent.name}</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.triggerKeywords?.split(',').map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {keyword.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Example prompts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Try These</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => handleSendMessage("Show me all my agents")}
                >
                  "Show me all my agents"
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => handleSendMessage("Help me choose the right agent for coding")}
                >
                  "Help me choose an agent for coding"
                </Button>
                {agentsWithKeywords.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => handleSendMessage(agentsWithKeywords[0].triggerKeywords?.split(',')[0]?.trim() || "")}
                  >
                    Try: "{agentsWithKeywords[0].triggerKeywords?.split(',')[0]?.trim()}"
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <ChatInterface
            messages={messages as any}
            onSendMessage={handleSendMessage}
            isLoading={chatMutation.isPending}
            placeholder="Ask me anything or say an agent's name to switch..."
            agentId={(activeMasterAgent as Agent)?.id || 0}
            voiceEnabled={(activeMasterAgent as Agent)?.voiceEnabled || false}
          />
        </div>
      </div>
    </>
  );
}