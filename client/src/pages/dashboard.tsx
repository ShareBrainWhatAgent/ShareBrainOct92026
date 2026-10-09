import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Bot, CheckCircle, MessageSquare, TrendingUp, Plus, Bell, Play, Edit, Code, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ["/api/agents"],
  });

  const recentAgents = Array.isArray(agents) ? agents.slice(0, 3) : [];

  return (
    <>
      {/* Test Environment Banner */}
      <div className="bg-yellow-500 text-black px-4 py-2 text-center font-semibold">
        🧪 TEST ENVIRONMENT - This change should only appear on https://sharebrain.me/test
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboard</h2>
            <p className="text-slate-600 mt-1 text-sm sm:text-base">Manage your AI brains and monitor performance</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Total Brains</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {statsLoading ? "..." : (stats as any)?.totalAgents || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bot className="text-primary h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Active Brains</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {statsLoading ? "..." : (stats as any)?.activeAgents || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="text-accent h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Total Conversations</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {statsLoading ? "..." : (stats as any)?.totalConversations || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="text-purple-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">API Calls Today</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {statsLoading ? "..." : (stats as any)?.apiCallsToday?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-amber-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Master Agent Models */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Master Agent Models</h3>
            <p className="text-slate-600 mb-6">Choose from different LLM models to test performance and capabilities</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* GPT-4o Master Agent */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href="/master-agent-gpt">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <Bot className="text-white h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">Master Agent - GPT-4o</h4>
                        <p className="text-sm text-slate-600 mt-1">OpenAI's most advanced model</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          GPT-4o
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-500">
                      ✓ Best reasoning capabilities<br/>
                      ✓ Excellent for complex orchestration<br/>
                      ✓ Fast response times
                    </div>
                  </CardContent>
                </Link>
              </Card>

              {/* Advanced Master Agent */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href="/master-agent-llama-70b">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <Bot className="text-white h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">Advanced Master Agent</h4>
                        <p className="text-sm text-slate-600 mt-1">AI orchestrator for complex tasks</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          Advanced Model
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-500">
                      ✓ Strong performance<br/>
                      ✓ Advanced reasoning<br/>
                      ✓ Complex task handling
                    </div>
                  </CardContent>
                </Link>
              </Card>

              {/* Fast Master Agent */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href="/master-agent-llama-8b">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                        <Bot className="text-white h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">Fast Master Agent</h4>
                        <p className="text-sm text-slate-600 mt-1">Efficient AI orchestrator</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          Fast Model
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-500">
                      ✓ Fastest response times<br/>
                      ✓ Efficient performance<br/>
                      ✓ Quick task handling
                    </div>
                  </CardContent>
                </Link>
              </Card>
            </div>
          </div>

          {/* Recent Agents */}
          <Card>
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Recent Brains</h3>
                <Link href="/agents">
                  <span className="text-primary hover:text-blue-700 text-sm font-medium cursor-pointer">View All</span>
                </Link>
              </div>
            </div>
            <CardContent className="p-6">
              {agentsLoading ? (
                <p className="text-slate-500">Loading brains...</p>
              ) : recentAgents.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-2">No brains created yet</p>
                  <Link href="/create">
                    <Button>Create Your First Brain</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentAgents.map((agent: any) => (
                    <div key={agent.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Bot className="text-primary h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{agent.name}</h4>
                          <p className="text-xs text-slate-500">ID: {agent.id}</p>
                          <p className="text-sm text-slate-600">{agent.description}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Created {new Date(agent.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                          {agent.status}
                        </Badge>
                        <Link href={`/chat/${agent.id}`} className="flex items-center justify-center h-10 w-10 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer">
                          <MessageSquare className="h-4 w-4" />
                        </Link>
                        {!agent.isSystemAgent ? (
                          <Link href={`/edit-agent/${agent.id}`} className="flex items-center justify-center h-10 w-10 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer">
                            <Edit className="h-4 w-4" />
                          </Link>
                        ) : (
                          <div className="flex items-center justify-center h-10 w-10">
                            <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300 px-2 py-1">
                              System
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
