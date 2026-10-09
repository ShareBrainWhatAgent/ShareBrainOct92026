import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  Settings, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Eye, 
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Database,
  TestTube,
  Globe,
  Lock,
  Target,
  Clock
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Agent {
  id: number;
  name: string;
  description: string;
  category: string;
  status: string;
  isPrivate: boolean;
  requiresSignup: boolean;
  hasOnboardingQuestions: boolean;
  uses: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

interface AgentSignup {
  id: number;
  agentId: number;
  userId: string;
  signupData: any;
  createdAt: string;
}

interface QuestionSet {
  id: number;
  name: string;
  description: string;
  questions: any[];
  isActive: boolean;
  weight: number;
}

interface ABTestAnalytics {
  questionSet: QuestionSet;
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  averageTimeToComplete: number;
  abandonmentByStep: { step: number; count: number; percentage: number }[];
}

export default function AgentManagementDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [createQuestionSetOpen, setCreateQuestionSetOpen] = useState(false);

  // Fetch user's agents
  const { data: agents = [], isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents/my-agents'],
    enabled: !!user,
  });

  // Fetch agent signups for selected agent
  const { data: signups = [], isLoading: signupsLoading } = useQuery<AgentSignup[]>({
    queryKey: ['/api/agent-signups', selectedAgent?.id],
    enabled: !!selectedAgent?.id,
  });

  // Fetch A/B testing analytics
  const { data: abTestAnalytics = [], isLoading: analyticsLoading } = useQuery<ABTestAnalytics[]>({
    queryKey: ['/api/ab-testing/analytics'],
    enabled: !!user,
  });

  // Create question set mutation
  const createQuestionSetMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/signup-question-sets", data);
    },
    onSuccess: () => {
      toast({
        title: "Question Set Created",
        description: "Your A/B testing question set has been created successfully.",
      });
      setCreateQuestionSetOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/ab-testing/analytics'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create question set.",
        variant: "destructive",
      });
    },
  });

  // Toggle agent privacy mutation
  const togglePrivacyMutation = useMutation({
    mutationFn: async ({ agentId, isPrivate }: { agentId: number; isPrivate: boolean }) => {
      return apiRequest("PATCH", `/api/agents/${agentId}`, { isPrivate });
    },
    onSuccess: () => {
      toast({
        title: "Privacy Updated",
        description: "Agent privacy settings have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/my-agents'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update privacy settings.",
        variant: "destructive",
      });
    },
  });

  // Toggle signup requirement mutation
  const toggleSignupMutation = useMutation({
    mutationFn: async ({ agentId, requiresSignup }: { agentId: number; requiresSignup: boolean }) => {
      return apiRequest("PATCH", `/api/agents/${agentId}`, { requiresSignup });
    },
    onSuccess: () => {
      toast({
        title: "Signup Requirement Updated",
        description: "Agent signup requirements have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/my-agents'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update signup requirements.",
        variant: "destructive",
      });
    },
  });

  if (agentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
            <p className="text-xs text-muted-foreground">
              {agents.filter((a: Agent) => a.status === 'active').length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.reduce((sum: number, agent: Agent) => sum + agent.uses, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all agents
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Signups Required</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.filter((a: Agent) => a.requiresSignup).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Agents requiring signup
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.length > 0 ? 
                (agents.reduce((sum: number, agent: Agent) => sum + agent.rating, 0) / agents.length).toFixed(1) : 
                '0.0'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 5.0 stars
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">My Agents</TabsTrigger>
          <TabsTrigger value="signups">User Signups</TabsTrigger>
          <TabsTrigger value="ab-testing">A/B Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Management</CardTitle>
              <CardDescription>
                Manage your AI agents, configure privacy settings, and enable signup requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Privacy</TableHead>
                    <TableHead>Signup</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent: Agent) => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-sm text-muted-foreground">{agent.category}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                          {agent.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{agent.uses}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {agent.isPrivate ? (
                            <Lock className="h-4 w-4 text-red-500" />
                          ) : (
                            <Globe className="h-4 w-4 text-green-500" />
                          )}
                          <Switch
                            checked={agent.isPrivate}
                            onCheckedChange={(checked) => 
                              togglePrivacyMutation.mutate({ agentId: agent.id, isPrivate: checked })
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={agent.requiresSignup}
                          onCheckedChange={(checked) => 
                            toggleSignupMutation.mutate({ agentId: agent.id, requiresSignup: checked })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAgent(agent)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/agents/${agent.id}`, '_blank')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Signups</CardTitle>
              <CardDescription>
                View and manage user signups for agents that require registration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={selectedAgent?.id?.toString() || ""} onValueChange={(value) => {
                  const agent = agents.find((a: Agent) => a.id.toString() === value);
                  setSelectedAgent(agent || null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent to view signups" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.filter((a: Agent) => a.requiresSignup).map((agent: Agent) => (
                      <SelectItem key={agent.id} value={agent.id.toString()}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedAgent && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        Signups for {selectedAgent.name}
                      </h3>
                      <Badge variant="outline">
                        {signups.length} total signups
                      </Badge>
                    </div>

                    {signupsLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    ) : signups.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No signups yet for this agent.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User ID</TableHead>
                            <TableHead>Signup Data</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {signups.map((signup: AgentSignup) => (
                            <TableRow key={signup.id}>
                              <TableCell className="font-mono text-sm">
                                {signup.userId}
                              </TableCell>
                              <TableCell>
                                <pre className="text-xs bg-muted p-2 rounded">
                                  {JSON.stringify(signup.signupData, null, 2)}
                                </pre>
                              </TableCell>
                              <TableCell>
                                {new Date(signup.createdAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ab-testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                A/B Testing Dashboard
                <Dialog open={createQuestionSetOpen} onOpenChange={setCreateQuestionSetOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Question Set
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create A/B Testing Question Set</DialogTitle>
                      <DialogDescription>
                        Create a new question set to test different onboarding flows.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Question Set Name</Label>
                        <Input id="name" placeholder="e.g., Short Onboarding" />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" placeholder="Describe this question set..." />
                      </div>
                      <div>
                        <Label htmlFor="weight">Weight (1-100)</Label>
                        <Input id="weight" type="number" min="1" max="100" defaultValue="50" />
                      </div>
                      <Button 
                        onClick={() => createQuestionSetMutation.mutate({
                          name: "Test Question Set",
                          description: "Test description",
                          weight: 50,
                          questions: []
                        })}
                        disabled={createQuestionSetMutation.isPending}
                      >
                        {createQuestionSetMutation.isPending ? "Creating..." : "Create Question Set"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
              <CardDescription>
                Monitor and analyze A/B testing performance for your agents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : abTestAnalytics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No A/B testing data available yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {abTestAnalytics.map((analytics: ABTestAnalytics) => (
                    <Card key={analytics.questionSet.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{analytics.questionSet.name}</CardTitle>
                        <CardDescription>{analytics.questionSet.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <div className="text-2xl font-bold">{analytics.totalSessions}</div>
                            <div className="text-sm text-muted-foreground">Total Sessions</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{analytics.completedSessions}</div>
                            <div className="text-sm text-muted-foreground">Completed</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</div>
                            <div className="text-sm text-muted-foreground">Completion Rate</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{analytics.averageTimeToComplete.toFixed(1)}s</div>
                            <div className="text-sm text-muted-foreground">Avg Time</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Completion Progress</span>
                            <span className="text-sm text-muted-foreground">
                              {analytics.completionRate.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={analytics.completionRate} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}