import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Zap, Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default function MasterAgentLlama70B() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MasterAgentMessage[]>([]);
  const [currentActiveAgent, setCurrentActiveAgent] = useState<Agent | null>(null);
  // Get all agents
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

  // Get current master agent - find master agent
  const activeMasterAgent = masterAgents.find((agent: Agent) => 
    agent.model === "Llama 3.1 70B" && agent.isMasterAgent
  ) || masterAgents[0];


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
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      if (data.activeAgent) {
        setCurrentActiveAgent(data.activeAgent);
      }

      if (data.agentSwitched && data.activeAgent) {
        toast({
          title: "Agent Switched",
          description: `Now channeling ${data.activeAgent.name}`,
        });
      }

      // Clear local messages since we now have fresh data from server
      setMessages([]);
      
      // Force refetch messages from server
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${data.conversationId}/messages`] });
      queryClient.refetchQueries({ queryKey: [`/api/conversations/${data.conversationId}/messages`] });
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

  // Use conversation messages when available, otherwise use local messages
  const displayMessages = (conversationMessages && Array.isArray(conversationMessages) && conversationMessages.length > 0) 
    ? conversationMessages 
    : messages;

  const handleSendMessage = (message: string) => {
    if (!activeMasterAgent) return;
    
    // Add user message optimistically to show it immediately
    const optimisticUserMessage: MasterAgentMessage = {
      id: Date.now(), // temporary ID
      conversationId: conversationId || 0,
      role: "user",
      content: message,
      metadata: null,
      createdAt: new Date()
    };
    
    setMessages(prev => [...prev, optimisticUserMessage]);
    chatMutation.mutate(message);
  };

  if (isLoadingAgents || !activeMasterAgent) {
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
      <header className="bg-white border-b border-slate-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Zap className="text-white h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Master Agent</h2>
              <p className="text-slate-600 mt-1">
                {currentActiveAgent 
                  ? `Currently channeling: ${currentActiveAgent.name}`
                  : "AI orchestrator that can seamlessly switch between specialized agents"
                }
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar with agent info */}
        <div className="w-80 bg-slate-50 border-r border-slate-200 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Model Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Bot className="h-5 w-5 mr-2" />
                  AI Model
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <p>Strong performance</p>
                </div>
                <div className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <p>Open source model</p>
                </div>
                <div className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <p>Good for complex tasks</p>
                </div>
              </CardContent>
            </Card>

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