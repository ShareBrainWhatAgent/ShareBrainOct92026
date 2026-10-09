import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Bot, Brain, MessageSquare, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";

interface CreationAgent {
  id: number;
  name: string;
  description: string;
  model: string;
  category: string;
  sampleUser: string;
  sampleAgent: string;
  websiteUrl?: string;
  websiteSlug?: string;
}

export default function CreationAgents() {
  const { data: agents, isLoading, error } = useQuery<CreationAgent[]>({
    queryKey: ["/api/creation-agents"],
  });

  const { data: claudeTest } = useQuery<{connected: boolean}>({
    queryKey: ["/api/creation-agents/test-claude"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading Creation Agents...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          <Alert className="bg-red-900/20 border-red-800 text-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load Creation Agents. You may not have access to this section.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Creation Agents</h1>
          <p className="text-gray-400 text-lg">
            Advanced AI agents for creating and developing new agents on the ShareBrain platform
          </p>
          
          {/* Claude API Status */}
          {claudeTest && (
            <div className="mt-4">
              <Badge variant={claudeTest.connected ? "default" : "destructive"} className="text-sm">
                Claude API: {claudeTest.connected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
          )}
        </div>

        {/* Agents Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {agents?.map((agent) => (
            <Card key={agent.id} className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {agent.id === 372 ? (
                      <Bot className="h-8 w-8 text-blue-400" />
                    ) : (
                      <Brain className="h-8 w-8 text-purple-400" />
                    )}
                    <div>
                      <CardTitle className="text-white text-xl">{agent.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                          {agent.category}
                        </Badge>
                        {agent.id === 373 && (
                          <Badge className="text-xs bg-purple-700 text-white">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Claude Powered
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <CardDescription className="text-gray-400 mb-4 leading-relaxed">
                  {agent.description}
                </CardDescription>

                {/* Sample Conversation */}
                <div className="bg-gray-800 rounded-lg p-4 mb-4 space-y-3">
                  <div className="text-sm">
                    <div className="text-blue-400 font-medium mb-1">Sample User Question:</div>
                    <div className="text-gray-300 italic">"{agent.sampleUser}"</div>
                  </div>
                  
                  <div className="text-sm">
                    <div className="text-green-400 font-medium mb-1">Agent Response:</div>
                    <div className="text-gray-300 italic">"{agent.sampleAgent}"</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Link href={`/chat/${agent.id}`}>
                    <Button className="flex-1 bg-white text-black hover:bg-gray-200">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start Chat
                    </Button>
                  </Link>
                  
                  {agent.websiteSlug && (
                    <Link href={`/agent-website/${agent.websiteSlug}`}>
                      <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                        View Details
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Information Section */}
        <div className="mt-12">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-blue-400" />
                About Creation Agents
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <div>
                <h3 className="font-semibold text-white mb-2">Agent Creation Agent (ID 372)</h3>
                <p className="text-sm text-gray-400">
                  Uses existing ShareBrain infrastructure (Llama 3.1 70B) to help you create new agents through 
                  natural conversation. Guides you through the agent creation process step-by-step.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">Development Assistant (ID 373)</h3>
                <p className="text-sm text-gray-400">
                  Powered directly by Claude for advanced development assistance, technical guidance, and 
                  sophisticated agent creation help. Provides expert-level support for ShareBrain platform development.
                </p>
              </div>
              
              <Alert className="bg-yellow-900/20 border-yellow-800 text-yellow-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  These agents are currently in a private testing phase. Access is controlled to manage costs 
                  and ensure quality during development.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}