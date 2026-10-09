import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Calendar,
  Hash,
  BarChart3,
  Clock,
  Send,
  Eye,
  FileText,
  AlertTriangle,
  Info
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CommunityMessage {
  id: number;
  agentId: number;
  userId?: string;
  userHandle?: string;
  agentName?: string;
  role: "user" | "assistant";
  content: string;
  messageType: string;
  metadata?: any;
  isVisible: boolean;
  createdAt: string;
}

interface CommunitySummary {
  id: number;
  agentId: number;
  summaryType: string;
  summaryPeriod: string;
  title: string;
  content: string;
  messageCount: number;
  userCount: number;
  keyTopics: string[];
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface CommunityStats {
  totalMessages: number;
  totalUsers: number;
  dailyMessages: number;
  weeklyMessages: number;
  topTopics: string[];
}

export default function CommunityAgent() {
  const { id } = useParams();
  const agentId = parseInt(id || "0");
  const [newMessage, setNewMessage] = useState("");
  const [isWarningAccepted, setIsWarningAccepted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch agent details
  const { data: agent } = useQuery({
    queryKey: [`/api/agents/${agentId}`],
    enabled: !!agentId,
  });

  // Fetch community messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<CommunityMessage[]>({
    queryKey: [`/api/community/${agentId}/messages`],
    enabled: !!agentId && isWarningAccepted,
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });

  // Fetch community summaries
  const { data: summaries = [] } = useQuery<CommunitySummary[]>({
    queryKey: [`/api/community/${agentId}/summaries`],
    enabled: !!agentId && isWarningAccepted,
  });

  // Fetch community stats
  const { data: stats } = useQuery<CommunityStats>({
    queryKey: [`/api/community/${agentId}/stats`],
    enabled: !!agentId && isWarningAccepted,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest(`/api/community/${agentId}/messages`, {
        method: "POST",
        body: { content },
      });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/community/${agentId}/messages`] });
      queryClient.invalidateQueries({ queryKey: [`/api/community/${agentId}/stats`] });
      toast({
        title: "Message sent",
        description: "Your message is now visible to the community",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate summary mutation
  const generateSummaryMutation = useMutation({
    mutationFn: async ({ summaryType, period }: { summaryType: string; period: string }) => {
      return await apiRequest(`/api/community/${agentId}/summaries/generate`, {
        method: "POST",
        body: { summaryType, period },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/community/${agentId}/summaries`] });
      toast({
        title: "Summary generated",
        description: "AI summary has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate summary",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage);
  };

  const generateTodaySummary = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    generateSummaryMutation.mutate({ summaryType: "daily", period: today });
  };

  const generateWeeklySummary = () => {
    const now = new Date();
    const year = now.getFullYear();
    const week = Math.ceil((now.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    const period = `${year}-W${week.toString().padStart(2, '0')}`;
    generateSummaryMutation.mutate({ summaryType: "weekly", period });
  };

  if (!isWarningAccepted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl bg-gray-900 border-gray-700">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-orange-500/20">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Community Agent</CardTitle>
            <p className="text-gray-300">Transparent AI Conversations</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-red-400 mb-2 flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                Public Visibility Warning
              </h3>
              <p className="text-gray-300 text-sm">
                All messages in this Community Agent are <strong>publicly visible</strong> to everyone. 
                Your conversations will be seen by other users and included in AI-generated community summaries.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-white flex items-center">
                <Info className="h-4 w-4 mr-2" />
                What makes this different:
              </h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  Complete transparency - no private messages
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  Community learning and shared insights
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  AI-powered daily and weekly summaries
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  Real-time topic detection and trends
                </li>
              </ul>
            </div>

            <Button 
              onClick={() => setIsWarningAccepted(true)} 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              I Understand - Join Community
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">{agent?.name}</h1>
              <p className="text-gray-400">{agent?.description}</p>
            </div>
            <Badge variant="outline" className="bg-green-600/20 text-green-400 border-green-600">
              Community Agent
            </Badge>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <MessageSquare className="h-8 w-8 text-blue-400 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.totalMessages}</p>
                      <p className="text-xs text-gray-400">Total Messages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-green-400 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                      <p className="text-xs text-gray-400">Community Members</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-orange-400 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.dailyMessages}</p>
                      <p className="text-xs text-gray-400">Today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-400 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.weeklyMessages}</p>
                      <p className="text-xs text-gray-400">This Week</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages Feed */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-700 h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Community Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 mb-4">
                  {messagesLoading ? (
                    <div className="text-center text-gray-400 py-8">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      No messages yet. Be the first to start the conversation!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg ${
                            message.role === "user"
                              ? "bg-blue-600/20 border border-blue-600/30"
                              : "bg-gray-800 border border-gray-700"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-white">
                              {message.role === "user" 
                                ? `@${message.userHandle}` 
                                : message.agentName}
                            </span>
                            <span className="text-xs text-gray-400">
                              {format(new Date(message.createdAt), "HH:mm")}
                            </span>
                          </div>
                          <p className="text-gray-300">{message.content}</p>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message to the community..."
                    className="flex-1 bg-black border-gray-700 text-white"
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summaries */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    AI Summaries
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generateTodaySummary}
                      disabled={generateSummaryMutation.isPending}
                      className="text-xs"
                    >
                      Daily
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generateWeeklySummary}
                      disabled={generateSummaryMutation.isPending}
                      className="text-xs"
                    >
                      Weekly
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40">
                  {summaries.length === 0 ? (
                    <p className="text-gray-400 text-sm">No summaries yet</p>
                  ) : (
                    <div className="space-y-3">
                      {summaries.slice(0, 5).map((summary) => (
                        <Dialog key={summary.id}>
                          <DialogTrigger asChild>
                            <div className="cursor-pointer p-2 rounded hover:bg-gray-800 border border-gray-700">
                              <h4 className="font-medium text-white text-sm">{summary.title}</h4>
                              <p className="text-xs text-gray-400">
                                {summary.messageCount} messages • {summary.userCount} users
                              </p>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{summary.title}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex gap-4 text-sm text-gray-400">
                                <span>{summary.messageCount} messages</span>
                                <span>{summary.userCount} users</span>
                                <span>{format(new Date(summary.createdAt), "MMM d, yyyy")}</span>
                              </div>
                              <p className="text-gray-300">{summary.content}</p>
                              {summary.keyTopics && summary.keyTopics.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Key Topics:</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {summary.keyTopics.map((topic, index) => (
                                      <Badge key={index} variant="secondary">
                                        {topic}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Active Topics */}
            {stats?.topTopics && stats.topTopics.length > 0 && (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Hash className="h-5 w-5 mr-2" />
                    Trending Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {stats.topTopics.map((topic, index) => (
                      <Badge key={index} variant="outline" className="text-gray-300">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}