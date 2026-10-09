import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Target, AlertCircle, CheckCircle, XCircle, Clock, BarChart3 } from "lucide-react";

interface ABTestAnalytics {
  questionSet: {
    id: number;
    name: string;
    description: string;
    questions: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: string;
    }>;
    isActive: boolean;
    weight: number;
  };
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  averageTimeToComplete: number;
  abandonmentByStep: Array<{
    step: number;
    count: number;
    percentage: number;
  }>;
  topPerformingQuestions: Array<{
    questionId: string;
    responseRate: number;
  }>;
}

export default function ABTestingDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDateRange, setSelectedDateRange] = useState<string>("7d");

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/ab-testing/analytics", selectedDateRange],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedDateRange) {
        case "7d":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(startDate.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(startDate.getDate() - 90);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }
      
      const response = await apiRequest("GET", `/api/ab-testing/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      return response.json();
    },
  });

  const toggleQuestionSetMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/ab-testing/question-sets/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ab-testing/analytics"] });
      toast({
        title: "Question Set Updated",
        description: "Question set status has been updated successfully.",
      });
    },
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">A/B Testing Dashboard</h1>
          <p className="text-gray-600">
            Analyze sign-up question performance and user engagement patterns
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
            <TabsTrigger value="manage">Manage Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Date Range Selector */}
            <div className="flex gap-2 mb-6">
              {["7d", "30d", "90d"].map((range) => (
                <Button
                  key={range}
                  variant={selectedDateRange === range ? "default" : "outline"}
                  onClick={() => setSelectedDateRange(range)}
                  size="sm"
                >
                  {range === "7d" && "Last 7 Days"}
                  {range === "30d" && "Last 30 Days"}
                  {range === "90d" && "Last 90 Days"}
                </Button>
              ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.reduce((sum: number, test: ABTestAnalytics) => sum + test.totalSessions, 0) || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Completion Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.length > 0 
                      ? Math.round(analytics.reduce((sum: number, test: ABTestAnalytics) => sum + test.completionRate, 0) / analytics.length) 
                      : 0}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Time to Complete</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.length > 0 
                      ? formatTime(Math.round(analytics.reduce((sum: number, test: ABTestAnalytics) => sum + test.averageTimeToComplete, 0) / analytics.length))
                      : "0m 0s"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.filter((test: ABTestAnalytics) => test.questionSet.isActive).length || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Completion Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Completion Rates by Question Set</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="questionSet.name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completionRate" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <div className="grid gap-6">
              {analytics?.map((test: ABTestAnalytics, index: number) => (
                <Card key={test.questionSet.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {test.questionSet.name}
                          <Badge variant={test.questionSet.isActive ? "default" : "secondary"}>
                            {test.questionSet.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{test.questionSet.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{test.completionRate}%</div>
                        <div className="text-sm text-gray-500">completion rate</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Abandonment by Step */}
                      <div>
                        <h4 className="font-semibold mb-3">Abandonment by Step</h4>
                        <div className="space-y-2">
                          {test.abandonmentByStep.map((step, stepIndex) => (
                            <div key={step.step} className="flex items-center gap-2">
                              <div className="w-16 text-sm">Step {step.step}</div>
                              <Progress value={step.percentage} className="flex-1" />
                              <div className="w-16 text-sm text-right">{step.percentage}%</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top Performing Questions */}
                      <div>
                        <h4 className="font-semibold mb-3">Question Response Rates</h4>
                        <div className="space-y-2">
                          {test.topPerformingQuestions.map((question, qIndex) => {
                            const questionDetails = test.questionSet.questions.find(q => q.id === question.questionId);
                            return (
                              <div key={question.questionId} className="flex items-center gap-2">
                                <div className="flex-1 text-sm truncate">
                                  {questionDetails?.title || question.questionId}
                                </div>
                                <Progress value={question.responseRate} className="w-24" />
                                <div className="w-12 text-sm text-right">{Math.round(question.responseRate)}%</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold">{test.totalSessions}</div>
                        <div className="text-sm text-gray-500">Total Sessions</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">{test.completedSessions}</div>
                        <div className="text-sm text-gray-500">Completed</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">{formatTime(test.averageTimeToComplete)}</div>
                        <div className="text-sm text-gray-500">Avg Time</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Question Set Management</CardTitle>
                <p className="text-sm text-gray-600">
                  Activate or deactivate question sets for A/B testing
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.map((test: ABTestAnalytics) => (
                    <div key={test.questionSet.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{test.questionSet.name}</div>
                        <div className="text-sm text-gray-600">{test.questionSet.description}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {test.questionSet.questions.length} questions • Weight: {test.questionSet.weight}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium">{test.completionRate}%</div>
                          <div className="text-sm text-gray-500">completion</div>
                        </div>
                        <Button
                          variant={test.questionSet.isActive ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleQuestionSetMutation.mutate({
                            id: test.questionSet.id,
                            isActive: !test.questionSet.isActive
                          })}
                          disabled={toggleQuestionSetMutation.isPending}
                        >
                          {test.questionSet.isActive ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}