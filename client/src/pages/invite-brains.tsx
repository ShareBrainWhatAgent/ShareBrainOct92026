import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Brain, Settings, BarChart3, Eye, Lock, Globe } from "lucide-react";
import InviteBrainDetail from "@/components/invite-brain-detail";

interface InviteBrain {
  id: number;
  agentId: number;
  creatorId: string;
  brainType: 'private_invite' | 'public_invite';
  accessModel: 'invite_only' | 'request_to_join' | 'paid_access';
  name: string;
  description?: string;
  memberLimit?: number;
  isActive: boolean;
  isPaid: boolean;
  accessFee?: number;
  currency: string;
  defaultRole: 'contributor' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

interface BrainMembership {
  id: number;
  brainId: number;
  userId: string;
  role: 'creator' | 'contributor' | 'viewer';
  status: 'active' | 'pending' | 'suspended' | 'banned';
  joinedAt: string;
}

export default function InviteBrains() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedBrain, setSelectedBrain] = useState<InviteBrain | null>(null);

  // Fetch user's invite brains
  const { data: userBrains, isLoading: isLoadingUserBrains } = useQuery({
    queryKey: ['/api/invite-brains'],
  });

  // Fetch user's memberships
  const { data: memberships, isLoading: isLoadingMemberships } = useQuery({
    queryKey: ['/api/invite-brains/memberships'],
  });

  // Fetch public invite brains
  const { data: publicBrains, isLoading: isLoadingPublicBrains } = useQuery({
    queryKey: ['/api/invite-brains/public'],
  });

  // Fetch user's agents for brain creation
  const { data: userAgents } = useQuery({
    queryKey: ['/api/agents'],
  });

  const createBrainMutation = useMutation({
    mutationFn: async (brainData: any) => {
      const response = await fetch('/api/invite-brains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brainData),
      });
      if (!response.ok) throw new Error('Failed to create invite brain');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invite-brains'] });
      setCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Invite brain created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invite brain",
        variant: "destructive",
      });
    },
  });

  const CreateBrainDialog = () => {
    const [formData, setFormData] = useState({
      agentId: '',
      brainType: 'private_invite' as 'private_invite' | 'public_invite',
      accessModel: 'invite_only' as 'invite_only' | 'request_to_join' | 'paid_access',
      description: '',
      maxMembers: '',
      price: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const brainData = {
        agentId: parseInt(formData.agentId),
        brainType: formData.brainType,
        accessModel: formData.accessModel,
        description: formData.description || null,
        maxMembers: formData.maxMembers ? parseInt(formData.maxMembers) : null,
        price: formData.price ? parseFloat(formData.price) : null,
      };

      createBrainMutation.mutate(brainData);
    };

    return (
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-black text-white hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" />
            Create Invite Brain
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-black text-white border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle>Create Invite Brain</DialogTitle>
            <DialogDescription className="text-gray-400">
              Transform one of your agents into an exclusive invite-only brain
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="agent">Select Agent</Label>
              <Select value={formData.agentId} onValueChange={(value) => setFormData({...formData, agentId: value})}>
                <SelectTrigger className="bg-gray-900 border-gray-700">
                  <SelectValue placeholder="Choose an agent" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {userAgents?.agents?.map((agent: any) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="brainType">Brain Type</Label>
              <Select value={formData.brainType} onValueChange={(value: any) => setFormData({...formData, brainType: value})}>
                <SelectTrigger className="bg-gray-900 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="private_invite">Private Invite</SelectItem>
                  <SelectItem value="public_invite">Public Invite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="accessModel">Access Model</Label>
              <Select value={formData.accessModel} onValueChange={(value: any) => setFormData({...formData, accessModel: value})}>
                <SelectTrigger className="bg-gray-900 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="invite_only">Invite Only</SelectItem>
                  <SelectItem value="request_to_join">Request to Join</SelectItem>
                  <SelectItem value="paid_access">Paid Access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your invite brain..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxMembers">Max Members</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  placeholder="50"
                  value={formData.maxMembers}
                  onChange={(e) => setFormData({...formData, maxMembers: e.target.value})}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              {formData.accessModel === 'paid_access' && (
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="9.99"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-white text-black hover:bg-gray-200"
              disabled={createBrainMutation.isPending || !formData.agentId}
            >
              {createBrainMutation.isPending ? "Creating..." : "Create Invite Brain"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const BrainCard = ({ brain, isMembership = false, membership = null }: { 
    brain: InviteBrain; 
    isMembership?: boolean;
    membership?: BrainMembership | null;
  }) => {
    const getBrainTypeIcon = () => {
      if (brain.brainType === 'private_invite') return <Lock className="w-4 h-4" />;
      return <Globe className="w-4 h-4" />;
    };

    const getAccessModelBadge = () => {
      const variants = {
        invite_only: "secondary",
        request_to_join: "outline", 
        paid_access: "default"
      } as const;
      
      return (
        <Badge variant={variants[brain.accessModel] || "secondary"} className="text-xs">
          {brain.accessModel === 'invite_only' && 'Invite Only'}
          {brain.accessModel === 'request_to_join' && 'Request to Join'}
          {brain.accessModel === 'paid_access' && `$${brain.accessFee} ${brain.currency}`}
        </Badge>
      );
    };

    return (
      <Card className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getBrainTypeIcon()}
              <CardTitle className="text-white text-lg">{brain.name}</CardTitle>
            </div>
            {getAccessModelBadge()}
          </div>
          {brain.description && (
            <CardDescription className="text-gray-400">
              {brain.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-400">
              {isMembership && membership && (
                <Badge variant="outline" className="text-xs">
                  {membership.role}
                </Badge>
              )}
              {brain.memberLimit && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>Max {brain.memberLimit}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setSelectedBrain(brain)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
              {!isMembership && (
                <Button 
                  size="sm"
                  className="bg-black text-white hover:bg-gray-800"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Manage
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="w-8 h-8" />
              Invite Brains
            </h1>
            <p className="text-gray-400 mt-1">
              Create and manage exclusive member-only AI brains
            </p>
          </div>
          <CreateBrainDialog />
        </div>

        <Tabs defaultValue="my-brains" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-700">
            <TabsTrigger value="my-brains" className="data-[state=active]:bg-white data-[state=active]:text-black">
              My Brains
            </TabsTrigger>
            <TabsTrigger value="memberships" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Memberships
            </TabsTrigger>
            <TabsTrigger value="public" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Public Directory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-brains" className="space-y-4">
            {isLoadingUserBrains ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="bg-gray-900 border-gray-700 animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-gray-700 rounded w-full"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : userBrains?.inviteBrains?.length === 0 ? (
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="text-center py-12">
                  <Brain className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Invite Brains Yet</h3>
                  <p className="text-gray-400 mb-4">
                    Create your first invite brain to start building exclusive AI communities
                  </p>
                  <CreateBrainDialog />
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {userBrains?.inviteBrains?.map((brain: InviteBrain) => (
                  <BrainCard key={brain.id} brain={brain} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="memberships" className="space-y-4">
            {isLoadingMemberships ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              </div>
            ) : memberships?.memberships?.length === 0 ? (
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Memberships</h3>
                  <p className="text-gray-400">
                    You haven't joined any invite brains yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {memberships?.memberships?.map((membership: BrainMembership) => (
                  <BrainCard 
                    key={membership.id} 
                    brain={membership.brain} 
                    isMembership={true}
                    membership={membership}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="public" className="space-y-4">
            {isLoadingPublicBrains ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              </div>
            ) : publicBrains?.inviteBrains?.length === 0 ? (
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="text-center py-12">
                  <Globe className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Public Brains</h3>
                  <p className="text-gray-400">
                    No public invite brains are currently available
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {publicBrains?.inviteBrains?.map((brain: InviteBrain) => (
                  <BrainCard key={brain.id} brain={brain} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Brain Detail Dialog */}
        {selectedBrain && (
          <InviteBrainDetail
            brainId={selectedBrain.id}
            isOpen={!!selectedBrain}
            onClose={() => setSelectedBrain(null)}
          />
        )}
      </div>
    </div>
  );
}