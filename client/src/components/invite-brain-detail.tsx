import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Settings, 
  BarChart3, 
  MessageSquare, 
  Plus, 
  Clock,
  Crown,
  Edit3,
  Trash2,
  UserCheck,
  UserX,
  Shield
} from "lucide-react";

interface InviteBrainDetailProps {
  brainId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteBrainDetail({ brainId, isOpen, onClose }: InviteBrainDetailProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [addMemoryText, setAddMemoryText] = useState("");

  // Fetch brain details
  const { data: brainDetails, isLoading } = useQuery({
    queryKey: ['/api/invite-brains', brainId],
    enabled: isOpen && !!brainId,
  });

  // Fetch brain memories
  const { data: memories } = useQuery({
    queryKey: ['/api/invite-brains', brainId, 'memories'],
    enabled: isOpen && !!brainId,
  });

  // Fetch brain analytics (if user is creator)
  const { data: analytics } = useQuery({
    queryKey: ['/api/invite-brains', brainId, 'analytics'],
    enabled: isOpen && !!brainId && brainDetails?.userMembership?.role === 'creator',
    retry: false, // Don't retry if not authorized
  });

  // Add memory mutation
  const addMemoryMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(`/api/invite-brains/${brainId}/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error('Failed to add memory');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invite-brains', brainId, 'memories'] });
      setAddMemoryText("");
      toast({
        title: "Success",
        description: "Memory added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add memory",
        variant: "destructive",
      });
    },
  });

  const handleAddMemory = () => {
    if (!addMemoryText.trim()) return;
    addMemoryMutation.mutate(addMemoryText);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'creator':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'contributor':
        return <Edit3 className="w-4 h-4 text-blue-500" />;
      case 'viewer':
        return <Shield className="w-4 h-4 text-gray-500" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const canAddMemories = brainDetails?.userMembership?.role === 'creator' || 
                         brainDetails?.userMembership?.role === 'contributor';

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black text-white border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            {brainDetails?.inviteBrain?.name || 'Loading...'}
            {brainDetails?.userMembership && (
              <Badge variant="outline" className="text-xs">
                {getRoleIcon(brainDetails.userMembership.role)}
                <span className="ml-1">{brainDetails.userMembership.role}</span>
              </Badge>
            )}
          </DialogTitle>
          {brainDetails?.inviteBrain?.description && (
            <DialogDescription className="text-gray-400">
              {brainDetails.inviteBrain.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-gray-900 border-gray-700">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-black">
                Overview
              </TabsTrigger>
              <TabsTrigger value="memories" className="data-[state=active]:bg-white data-[state=active]:text-black">
                Memories ({memories?.count || 0})
              </TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-white data-[state=active]:text-black">
                Members ({brainDetails?.members?.length || 0})
              </TabsTrigger>
              {brainDetails?.userMembership?.role === 'creator' && (
                <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-black">
                  Analytics
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Brain Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <Badge variant="outline">
                        {brainDetails?.inviteBrain?.brainType?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Access:</span>
                      <Badge variant="secondary">
                        {brainDetails?.inviteBrain?.accessModel?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Members:</span>
                      <span className="text-white">
                        {brainDetails?.members?.length || 0}
                        {brainDetails?.inviteBrain?.memberLimit && 
                          ` / ${brainDetails.inviteBrain.memberLimit}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <Badge variant={brainDetails?.inviteBrain?.isActive ? "default" : "outline"}>
                        {brainDetails?.inviteBrain?.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Memory Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Memories:</span>
                      <span className="text-white">{memories?.count || 0}</span>
                    </div>
                    {brainDetails?.memoryStats && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Contributors:</span>
                          <span className="text-white">{brainDetails.memoryStats.uniqueContributors || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Categories:</span>
                          <span className="text-white">{brainDetails.memoryStats.categoriesUsed || 0}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="memories" className="space-y-4">
              {canAddMemories && (
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Add Memory
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder="Share something important for this brain to remember..."
                      value={addMemoryText}
                      onChange={(e) => setAddMemoryText(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                      rows={3}
                    />
                    <Button 
                      onClick={handleAddMemory}
                      disabled={!addMemoryText.trim() || addMemoryMutation.isPending}
                      className="bg-white text-black hover:bg-gray-200"
                    >
                      {addMemoryMutation.isPending ? "Adding..." : "Add Memory"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                {memories?.memories?.length === 0 ? (
                  <Card className="bg-gray-900 border-gray-700">
                    <CardContent className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">No Memories Yet</h3>
                      <p className="text-gray-400">
                        {canAddMemories 
                          ? "Add the first memory to start building this brain's knowledge"
                          : "No memories have been added to this brain yet"
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  memories?.memories?.map((memory: any) => (
                    <Card key={memory.id} className="bg-gray-900 border-gray-700">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {memory.memoryCategory?.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(memory.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-white mb-2">{memory.memoryValue}</p>
                        {memory.originalStatement && (
                          <p className="text-sm text-gray-400 italic">
                            "{memory.originalStatement}"
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-700">
                          <span className="text-xs text-gray-500">
                            Contributed by {memory.contributorHandle || 'Unknown'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
              <div className="space-y-3">
                {brainDetails?.members?.map((member: any) => (
                  <Card key={member.id} className="bg-gray-900 border-gray-700">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getRoleIcon(member.role)}
                          <div>
                            <p className="text-white font-medium">
                              {member.userHandle || `User ${member.userId}`}
                            </p>
                            <p className="text-xs text-gray-400">
                              {member.role} • Joined {new Date(member.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={member.status === 'active' ? "default" : "outline"}
                          className="text-xs"
                        >
                          {member.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {brainDetails?.userMembership?.role === 'creator' && (
              <TabsContent value="analytics" className="space-y-4">
                {analytics ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="bg-gray-900 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Member Analytics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Members:</span>
                          <span className="text-white">{analytics.totalMembers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Active Members:</span>
                          <span className="text-white">{analytics.activeMembers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">New This Week:</span>
                          <span className="text-white">{analytics.recentActivity?.newMembersThisWeek || 0}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          Memory Analytics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Memories:</span>
                          <span className="text-white">{analytics.totalMemories}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Added This Week:</span>
                          <span className="text-white">{analytics.recentActivity?.newMemoriesThisWeek || 0}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="bg-gray-900 border-gray-700">
                    <CardContent className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">Analytics Unavailable</h3>
                      <p className="text-gray-400">
                        Analytics are only available to brain creators
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}