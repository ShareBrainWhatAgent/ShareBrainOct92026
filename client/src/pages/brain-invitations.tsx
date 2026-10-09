import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, UserPlus, Check, X, Clock, Users, MessageSquare } from "lucide-react";

interface BrainInvitation {
  id: number;
  brainId: number;
  inviterId: string;
  inviteeUserId?: string;
  inviteeUsername?: string;
  inviteeEmail?: string;
  invitationType: 'direct_invite' | 'join_request';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  role: 'contributor' | 'viewer';
  message?: string;
  expiresAt?: string;
  respondedAt?: string;
  createdAt: string;
  brain?: {
    name: string;
    description?: string;
    brainType: string;
  };
  inviter?: {
    handle: string;
    displayName?: string;
  };
}

export default function BrainInvitations() {
  const { toast } = useToast();
  const [sendInviteDialogOpen, setSendInviteDialogOpen] = useState(false);
  const [selectedBrainId, setSelectedBrainId] = useState<number | null>(null);

  // Fetch pending invitations
  const { data: pendingInvitations, isLoading: isLoadingInvitations } = useQuery({
    queryKey: ['/api/invite-brains/invitations/pending'],
  });

  // Fetch user's invite brains for sending invitations
  const { data: userBrains } = useQuery({
    queryKey: ['/api/invite-brains'],
  });

  // Respond to invitation mutation
  const respondToInvitationMutation = useMutation({
    mutationFn: async ({ invitationId, response }: { invitationId: number; response: string }) => {
      const res = await fetch(`/api/invite-brains/invitations/${invitationId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      if (!res.ok) throw new Error('Failed to respond to invitation');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invite-brains/invitations/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invite-brains/memberships'] });
      toast({
        title: "Success",
        description: "Invitation response recorded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to respond to invitation",
        variant: "destructive",
      });
    },
  });

  // Send invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async (inviteData: any) => {
      const response = await fetch(`/api/invite-brains/${inviteData.brainId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteData),
      });
      if (!response.ok) throw new Error('Failed to send invitation');
      return response.json();
    },
    onSuccess: (data) => {
      setSendInviteDialogOpen(false);
      toast({
        title: "Invitations Sent",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitations",
        variant: "destructive",
      });
    },
  });

  const SendInviteDialog = () => {
    const [formData, setFormData] = useState({
      brainId: '',
      userHandles: '',
      role: 'viewer' as 'contributor' | 'viewer',
      message: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const userHandles = formData.userHandles
        .split(',')
        .map(handle => handle.trim().replace('@', ''))
        .filter(handle => handle.length > 0);

      if (userHandles.length === 0) {
        toast({
          title: "Error",
          description: "Please enter at least one username",
          variant: "destructive",
        });
        return;
      }

      const inviteData = {
        brainId: parseInt(formData.brainId),
        userHandles,
        role: formData.role,
        message: formData.message || null,
      };

      sendInvitationMutation.mutate(inviteData);
    };

    return (
      <Dialog open={sendInviteDialogOpen} onOpenChange={setSendInviteDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-black text-white hover:bg-gray-800">
            <UserPlus className="w-4 h-4 mr-2" />
            Send Invitations
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-black text-white border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle>Send Brain Invitations</DialogTitle>
            <DialogDescription className="text-gray-400">
              Invite users to join your exclusive brain
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="brain">Select Brain</Label>
              <Select value={formData.brainId} onValueChange={(value) => setFormData({...formData, brainId: value})}>
                <SelectTrigger className="bg-gray-900 border-gray-700">
                  <SelectValue placeholder="Choose a brain" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {userBrains?.inviteBrains?.map((brain: any) => (
                    <SelectItem key={brain.id} value={brain.id.toString()}>
                      {brain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="userHandles">Usernames</Label>
              <Input
                id="userHandles"
                placeholder="username1, username2, username3"
                value={formData.userHandles}
                onChange={(e) => setFormData({...formData, userHandles: e.target.value})}
                className="bg-gray-900 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Separate multiple usernames with commas
              </p>
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({...formData, role: value})}>
                <SelectTrigger className="bg-gray-900 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="contributor">Contributor</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400 mt-1">
                {formData.role === 'contributor' ? 'Can add memories and participate' : 'Can view memories and participate'}
              </p>
            </div>

            <div>
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Welcome to our exclusive brain..."
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="bg-gray-900 border-gray-700 text-white"
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-white text-black hover:bg-gray-200"
              disabled={sendInvitationMutation.isPending || !formData.brainId}
            >
              {sendInvitationMutation.isPending ? "Sending..." : "Send Invitations"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const InvitationCard = ({ invitation }: { invitation: BrainInvitation }) => {
    const getStatusIcon = () => {
      switch (invitation.status) {
        case 'pending':
          return <Clock className="w-4 h-4 text-yellow-500" />;
        case 'accepted':
          return <Check className="w-4 h-4 text-green-500" />;
        case 'declined':
          return <X className="w-4 h-4 text-red-500" />;
        default:
          return <Clock className="w-4 h-4 text-gray-500" />;
      }
    };

    const getStatusBadge = () => {
      const variants = {
        pending: "default",
        accepted: "secondary",
        declined: "destructive",
        expired: "outline"
      } as const;
      
      return (
        <Badge variant={variants[invitation.status] || "outline"} className="text-xs">
          {invitation.status}
        </Badge>
      );
    };

    const getInvitationTypeText = () => {
      if (invitation.invitationType === 'join_request') {
        return 'requested to join';
      }
      return 'invited you to';
    };

    return (
      <Card className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <CardTitle className="text-white text-lg">
                {invitation.brain?.name || `Brain #${invitation.brainId}`}
              </CardTitle>
            </div>
            {getStatusBadge()}
          </div>
          <CardDescription className="text-gray-400">
            <span className="font-medium">@{invitation.inviter?.handle || 'Unknown'}</span>{' '}
            {getInvitationTypeText()} this brain as a{' '}
            <span className="font-medium">{invitation.role}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitation.message && (
            <div className="mb-4 p-3 bg-gray-800 rounded-md">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-300">{invitation.message}</p>
              </div>
            </div>
          )}
          
          {invitation.brain?.description && (
            <p className="text-sm text-gray-400 mb-4">
              {invitation.brain.description}
            </p>
          )}

          {invitation.status === 'pending' && (
            <div className="flex gap-2">
              <Button 
                size="sm"
                onClick={() => respondToInvitationMutation.mutate({ 
                  invitationId: invitation.id, 
                  response: 'accepted' 
                })}
                disabled={respondToInvitationMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-3 h-3 mr-1" />
                Accept
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => respondToInvitationMutation.mutate({ 
                  invitationId: invitation.id, 
                  response: 'declined' 
                })}
                disabled={respondToInvitationMutation.isPending}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <X className="w-3 h-3 mr-1" />
                Decline
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-500">
              {new Date(invitation.createdAt).toLocaleDateString()}
            </div>
            {invitation.respondedAt && (
              <div className="text-xs text-gray-500">
                Responded {new Date(invitation.respondedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Mail className="w-8 h-8" />
              Brain Invitations
            </h1>
            <p className="text-gray-400 mt-1">
              Manage invitations to exclusive brain communities
            </p>
          </div>
          <SendInviteDialog />
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Invitations
              {pendingInvitations?.count > 0 && (
                <Badge className="bg-yellow-600 text-white">
                  {pendingInvitations.count}
                </Badge>
              )}
            </h2>
            
            {isLoadingInvitations ? (
              <div className="grid gap-4">
                {[...Array(2)].map((_, i) => (
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
            ) : pendingInvitations?.invitations?.length === 0 ? (
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="text-center py-12">
                  <Mail className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Pending Invitations</h3>
                  <p className="text-gray-400">
                    You have no pending brain invitations at this time
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingInvitations?.invitations?.map((invitation: BrainInvitation) => (
                  <InvitationCard key={invitation.id} invitation={invitation} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}