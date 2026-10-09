import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bot, MessageSquare, Trash2, Copy, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ChatInterface from "@/components/chat-interface";
import type { Agent, Message } from "@shared/schema";

export default function TestingLab() {
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<(Message & { metadata?: any })[]>([]);

  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ["/api/agents"],
  });

  const chatMutation = useMutation({
    mutationFn: async ({ agentId, message, conversationId }: { 
      agentId: number; 
      message: string; 
      conversationId?: number;
    }) => {
      const response = await apiRequest("POST", "/api/chat", {
        agentId,
        message,
        conversationId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentConversationId(data.conversationId);
      setMessages(prev => [...prev, data.message]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setMessages([]);
    setCurrentConversationId(null);
  };

  const handleSendMessage = (inputMessage: string) => {
    if (!inputMessage.trim() || !selectedAgent || chatMutation.isPending) return;

    // Add user message to chat immediately
    const userMessage: Message & { metadata?: any } = {
      id: Date.now(),
      conversationId: currentConversationId || 0,
      role: "user",
      content: inputMessage,
      metadata: null,
      createdAt: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    chatMutation.mutate({
      agentId: selectedAgent.id,
      message: inputMessage,
      conversationId: currentConversationId || undefined,
    });
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    toast({
      title: "Chat cleared",
      description: "Conversation history has been cleared.",
    });
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Testing Lab</h2>
          <p className="text-slate-600 mt-1">Test and refine your AI agents</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
          {/* Agent Selection */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Select Agent</h3>
              </div>
              <CardContent className="p-6">
                {agentsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-3 border border-slate-200 rounded-lg animate-pulse">
                        <div className="h-4 bg-slate-200 rounded mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : agents?.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No agents available for testing</p>
                ) : (
                  <div className="space-y-3">
                    {agents?.map((agent) => (
                      <div
                        key={agent.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedAgent?.id === agent.id
                            ? "border-primary bg-blue-50"
                            : "border-slate-200 hover:border-primary"
                        }`}
                        onClick={() => handleSelectAgent(agent)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Bot className="text-primary h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900 text-sm">{agent.name}</h4>
                            <p className="text-xs text-slate-500">ID: {agent.id} • {agent.model} • {agent.status}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Agent Details */}
            {selectedAgent && (
              <Card>
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Agent Details</h3>
                </div>
                  <CardContent className="p-6">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Agent ID:</span>
                        <span className="font-medium">{selectedAgent.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Model:</span>
                        <span className="font-medium">{selectedAgent.model}</span>
                      </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Temperature:</span>
                      <span className="font-medium">{selectedAgent.temperature}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Max Tokens:</span>
                      <span className="font-medium">{selectedAgent.maxTokens}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Status:</span>
                      <Badge variant={selectedAgent.status === "active" ? "default" : "secondary"}>
                        {selectedAgent.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="flex flex-col h-full">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {selectedAgent ? (
                      <>
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Bot className="text-primary h-4 w-4" />
                        </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{selectedAgent.name}</h3>
                            <p className="text-xs text-slate-500">ID: {selectedAgent.id} • Testing Mode</p>
                          </div>
                      </>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="h-8 w-8 text-slate-300" />
                        <div>
                          <h3 className="font-semibold text-slate-900">Select an agent to start testing</h3>
                          <p className="text-xs text-slate-500">Choose from your available agents</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedAgent && messages.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearChat}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear Chat
                    </Button>
                  )}
                </div>
              </div>

              {/* Chat Interface */}
              <div className="flex-1 flex flex-col">
                {!selectedAgent ? (
                  <div className="flex-1 flex items-center justify-center text-center text-slate-500">
                    <div>
                      <Bot className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                      <p>Select an agent from the sidebar to start testing</p>
                    </div>
                  </div>
                ) : (
                  <ChatInterface
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    conversationId={currentConversationId || undefined}
                    isLoading={chatMutation.isPending}
                    disabled={!selectedAgent}
                    placeholder={selectedAgent ? "Type your message..." : "Select an agent first"}
                    agentId={selectedAgent.id}
                    voiceEnabled={selectedAgent.voiceEnabled || false}
                  />
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
