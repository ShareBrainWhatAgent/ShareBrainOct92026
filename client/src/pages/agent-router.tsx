import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { Brain, Bot, Users, ArrowRight, Star, Clock } from "lucide-react";

interface Agent {
  id: number;
  name: string;
  description: string;
  category: string;
  status: string;
}

interface OrchestrationResult {
  primary: {
    agent: Agent;
    response: string;
    reasoning: string;
  };
  alternatives?: Array<{
    agent: Agent;
    response: string;
    reasoning: string;
  }>;
  showAlternatives?: boolean;
  allowSelection?: boolean;
}

interface AgentRecommendation {
  agent: Agent;
  score: number;
  reasoning: string;
}

export default function AgentRouter() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("language_learning");
  const [orchestrationResult, setOrchestrationResult] = useState<OrchestrationResult | null>(null);
  const queryClient = useQueryClient();

  // Fetch user preferences
  const { data: preferences } = useQuery({
    queryKey: ["/api/agent-orchestration/preferences"],
    enabled: true,
  });

  // Fetch recommendations for selected category
  const { data: recommendations, isLoading: loadingRecommendations } = useQuery({
    queryKey: ["/api/agent-orchestration/recommendations", selectedCategory],
    enabled: !!selectedCategory,
  });

  // Route query to agent
  const routeQueryMutation = useMutation({
    mutationFn: async (data: { query: string; sourceAgentId?: number; conversationId?: number }) => {
      const response = await fetch("/api/agent-orchestration/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to route query");
      return response.json();
    },
    onSuccess: (result: OrchestrationResult) => {
      setOrchestrationResult(result);
    },
  });

  // Rating mutation
  const rateMutation = useMutation({
    mutationFn: async (data: { agentId: number; category: string; rating: number; wasHelpful: boolean }) => {
      const response = await fetch(`/api/agent-orchestration/rank/${data.agentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to rate agent");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent-orchestration/recommendations"] });
    },
  });

  const handleRouteQuery = () => {
    if (!query.trim()) return;
    routeQueryMutation.mutate({ query });
  };

  const handleRateAgent = (agentId: number, category: string, rating: number, wasHelpful: boolean) => {
    rateMutation.mutate({ agentId, category, rating, wasHelpful });
  };

  const categories = [
    "language_learning",
    "customer_support", 
    "content_creation",
    "technical_assistance",
    "education",
    "travel",
    "health_wellness",
    "finance"
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Brain className="h-8 w-8" />
            Agent Orchestration System
          </h1>
          <p className="text-gray-300">
            Test intelligent agent routing and multi-agent collaboration
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Query Input Section */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Agent Router
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Ask any question and let the system route it to the best agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Ask anything... e.g., 'How do I say hello in Catalan?' or 'Plan a trip to Tokyo'"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-black border-gray-600 text-white"
                  rows={3}
                />
                <Button 
                  onClick={handleRouteQuery}
                  disabled={!query.trim() || routeQueryMutation.isPending}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  {routeQueryMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Routing...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Route Query
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results Section */}
            {orchestrationResult && (
              <Card className="bg-gray-900 border-gray-700 mt-6">
                <CardHeader>
                  <CardTitle className="text-white">Orchestration Result</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Primary Agent Response */}
                  <div className="border border-green-600 rounded-lg p-4 bg-green-950/20">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-green-400 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Primary Agent: {orchestrationResult.primary.agent.name}
                      </h3>
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        Primary
                      </Badge>
                    </div>
                    <p className="text-gray-300 mb-3 text-sm">
                      <strong>Reasoning:</strong> {orchestrationResult.primary.reasoning}
                    </p>
                    <div className="bg-black rounded p-3">
                      <p className="text-white">{orchestrationResult.primary.response}</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Button
                          key={rating}
                          size="sm"
                          variant="outline"
                          onClick={() => handleRateAgent(
                            orchestrationResult.primary.agent.id,
                            "general",
                            rating,
                            rating >= 4
                          )}
                          className="text-white border-gray-600 hover:bg-gray-800"
                        >
                          {rating}★
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Alternative Agents */}
                  {orchestrationResult.alternatives && orchestrationResult.alternatives.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-300 mb-3">Alternative Options:</h3>
                      <div className="space-y-3">
                        {orchestrationResult.alternatives.map((alt, index) => (
                          <div key={index} className="border border-gray-600 rounded-lg p-3 bg-gray-800/50">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-200">{alt.agent.name}</h4>
                              <Badge variant="secondary">Alternative</Badge>
                            </div>
                            <p className="text-gray-400 text-sm mb-2">
                              <strong>Reasoning:</strong> {alt.reasoning}
                            </p>
                            <div className="bg-black rounded p-2">
                              <p className="text-gray-300 text-sm">{alt.response}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category Recommendations */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Recommended Agents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-black border border-gray-600 rounded px-3 py-2 text-white"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
                
                {loadingRecommendations ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : recommendations && recommendations.length > 0 ? (
                  <div className="space-y-2">
                    {recommendations.map((rec: AgentRecommendation, index: number) => (
                      <div key={index} className="border border-gray-600 rounded p-2 bg-gray-800/50">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-200 text-sm">{rec.agent.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {rec.score.toFixed(1)}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">{rec.reasoning}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No recommendations available</p>
                )}
              </CardContent>
            </Card>

            {/* User Preferences */}
            {preferences && Object.keys(preferences).length > 0 && (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Your Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(preferences).map(([category, stats]: [string, any]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">
                        {category.replace("_", " ")}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {stats.count} uses
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {(stats.averageConfidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Example Queries */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Example Queries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  "How do I say 'good morning' in Spanish?",
                  "Plan a 3-day trip to Paris",
                  "Explain quantum computing",
                  "Write a marketing email",
                  "Help with customer complaint"
                ].map((example, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuery(example)}
                    className="w-full text-left justify-start text-gray-300 hover:text-white hover:bg-gray-800 h-auto p-2"
                  >
                    <span className="text-xs">{example}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}