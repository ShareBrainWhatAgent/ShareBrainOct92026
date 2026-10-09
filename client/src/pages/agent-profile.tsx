import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Bot, MessageSquare, ExternalLink, Globe, Volume2, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Agent } from "@shared/schema";

export default function AgentProfile() {
  const { slug } = useParams<{ slug: string }>();

  const { data: agent, isLoading, error } = useQuery({
    queryKey: ["/api/agents/profile", slug],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/agents/profile/${slug}`);
      return response.json();
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading agent profile...</p>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Bot className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Agent Not Found</h1>
          <p className="text-slate-600 mb-6">
            The agent you're looking for doesn't exist or isn't publicly available.
          </p>
          <Link href="/">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Back to ShareBrain
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              ShareBrain
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/api/auth/google">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/api/auth/google">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Agent Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agent Header */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-blue-100 rounded-xl">
                  <Bot className="h-12 w-12 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{agent.name}</h1>
                  <p className="text-lg text-slate-600 mb-4">{agent.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary">{agent.category}</Badge>
                    <Badge variant="outline">{agent.model}</Badge>
                    <Badge variant={agent.status === "active" ? "default" : "outline"}>
                      {agent.status}
                    </Badge>
                    {agent.voiceEnabled && (
                      <Badge variant="outline" className="gap-1">
                        <Volume2 className="h-3 w-3" />
                        Voice Enabled
                      </Badge>
                    )}
                    {agent.imageEnabled && (
                      <Badge variant="outline" className="gap-1">
                        <Sparkles className="h-3 w-3" />
                        Image Generation
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link href="/api/auth/google">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat with {agent.name}
                      </Button>
                    </Link>
                    
                    {agent.websiteUrl && (
                      <Button 
                        variant="outline"
                        onClick={() => window.open(agent.websiteUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Website
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* System Prompt */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Agent Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                    {agent.systemPrompt}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Sample Conversation */}
            {agent.sampleUser && agent.sampleAgent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Sample Conversation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-900 mb-1">User:</p>
                      <p className="text-sm text-blue-800">{agent.sampleUser}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-900 mb-1">{agent.name}:</p>
                      <p className="text-sm text-green-800">{agent.sampleAgent}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            {/* Get Started Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Get Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/api/auth/google">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Chatting
                  </Button>
                </Link>
                
                {agent.websiteUrl && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(agent.websiteUrl, '_blank')}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Explore Knowledge Base
                  </Button>
                )}
                
                <div className="text-center">
                  <p className="text-sm text-slate-500">
                    Sign in to access full features
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Agent Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agent Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">AI Model:</span>
                  <span className="text-sm font-medium">{agent.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Category:</span>
                  <span className="text-sm font-medium">{agent.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Status:</span>
                  <Badge variant={agent.status === "active" ? "default" : "outline"} className="text-xs">
                    {agent.status}
                  </Badge>
                </div>
                {agent.voiceEnabled && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Voice:</span>
                    <span className="text-sm font-medium text-green-600">Enabled</span>
                  </div>
                )}
                {agent.imageEnabled && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Images:</span>
                    <span className="text-sm font-medium text-purple-600">Enabled</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* About ShareBrain */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About ShareBrain</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  ShareBrain is an AI platform that provides specialized agents for various tasks and domains.
                </p>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Explore More Agents
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center text-sm text-slate-500">
            <p>&copy; 2025 ShareBrain. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}