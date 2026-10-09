import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Zap, Users, ArrowRight, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ChatInterface from "@/components/chat-interface";
import type { Agent, Message } from "@shared/schema";

interface MasterAgentMessage extends Omit<Message, 'metadata'> {
  metadata?: {
    agentSwitched?: boolean;
    activeAgentId?: number;
    activeAgentName?: string;
  } | any;
}

export default function MasterAgentSimple() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MasterAgentMessage[]>([]);
  const [currentActiveAgent, setCurrentActiveAgent] = useState<Agent | null>(null);
  const [selectedMasterAgentId, setSelectedMasterAgentId] = useState<number>(222); // Default to GPT-4o Master Agent

  // Get all master agents
  const { data: allAgents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ["/api/agents"],
  });

  // Filter agents
  const masterAgents = Array.isArray(allAgents)
    ? allAgents.filter((agent: Agent) => agent.isMasterAgent)
    : [];


  const agentsList = Array.isArray(allAgents) 
    ? allAgents.filter((agent: Agent) => !agent.isMasterAgent && !agent.isTemplate)
    : [];

  // Get current master agent
  const activeMasterAgent = masterAgents.find((agent: Agent) => agent.id === selectedMasterAgentId) || masterAgents[0];


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

  // Use conversationMessages directly instead of local state
  const displayMessages = Array.isArray(conversationMessages) && conversationMessages.length > 0 ? conversationMessages : messages;

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
                value={selectedMasterAgentId.toString()} 
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
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent>
                  {masterAgents.map((agent: Agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <CardContent className="space-y-2">
                {agentsList.slice(0, 5).map((agent: Agent) => (
                  <div key={agent.id} className="p-2 bg-white rounded border text-sm">
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-xs text-slate-500 truncate">{agent.description}</div>
                  </div>
                ))}
                {agentsList.length > 5 && (
                  <div className="text-xs text-slate-500 text-center pt-2">
                    +{agentsList.length - 5} more agents available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick commands */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Commands</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {agentsWithKeywords.slice(0, 3).map((agent: Agent) => (
                  <div key={agent.id} className="p-2 bg-white rounded border text-sm">
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-xs text-slate-500">
                      Keywords: {agent.triggerKeywords}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <ChatInterface
            messages={displayMessages as any}
            onSendMessage={handleSendMessage}
            isLoading={chatMutation.isPending}
            placeholder="Ask me anything or say an agent's name to switch..."
            agentId={activeMasterAgent?.id || 0}
            voiceEnabled={activeMasterAgent?.voiceEnabled || false}
          />
        </div>
      </div>
    </>
  );
}