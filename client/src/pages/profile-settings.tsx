import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Settings, UserPlus, Check, X, Clock } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  handle?: string;
  profileImageUrl?: string;
}

interface FriendRequest {
  id: number;
  senderId: string;
  senderHandle: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export default function ProfileSettings() {
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    handle: ""
  });
  const [friendHandle, setFriendHandle] = useState("");
  const [friendMessage, setFriendMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ['/api/user/profile'],
    refetchOnWindowFocus: false
  });

  // Fetch friend requests
  const { data: friendRequests, isLoading: requestsLoading } = useQuery<FriendRequest[]>({
    queryKey: ['/api/friends/requests'],
    refetchOnWindowFocus: false
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setProfileData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        handle: profile.handle || ""
      });
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  // Send friend request mutation
  const sendFriendRequestMutation = useMutation({
    mutationFn: async (data: { handle: string; message: string }) => {
      const response = await fetch('/api/friends/send-request', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send friend request');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Friend Request Sent",
        description: "Your friend request has been sent successfully.",
      });
      setFriendHandle("");
      setFriendMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to send friend request.",
        variant: "destructive",
      });
    },
  });

  // Respond to friend request mutation
  const respondToRequestMutation = useMutation({
    mutationFn: async (data: { requestId: number; action: string }) => {
      const response = await fetch('/api/friends/respond', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to respond to friend request');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      const action = variables.action === "accepted" ? "accepted" : "declined";
      toast({
        title: `Friend Request ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        description: `You have ${action} the friend request.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/unified-chat/contacts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Response Failed",
        description: error.message || "Failed to respond to friend request.",
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handleSendFriendRequest = (e: React.FormEvent) => {
    console.log("Friend request form submitted");
    e.preventDefault();
    
    if (!friendHandle.trim()) {
      console.log("No handle provided");
      toast({
        title: "Handle Required",
        description: "Please enter a user handle to send a friend request.",
        variant: "destructive",
      });
      return;
    }
    
    // Clean the handle - add @ if not present, or keep as is if already has @
    let cleanHandle = friendHandle.trim();
    if (!cleanHandle.startsWith('@')) {
      cleanHandle = '@' + cleanHandle;
    }
    
    console.log("Sending friend request to:", cleanHandle);
    
    sendFriendRequestMutation.mutate({
      handle: cleanHandle,
      message: friendMessage.trim()
    });
  };

  const handleRespondToRequest = (requestId: number, action: string) => {
    respondToRequestMutation.mutate({ requestId, action });
  };

  if (profileLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Profile Settings</h1>
      </div>

      {/* User Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Profile
          </CardTitle>
          <CardDescription>
            Manage your profile information and display name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.profileImageUrl} />
              <AvatarFallback className="text-lg">
                {profile?.firstName?.charAt(0) || profile?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>

            <form onSubmit={handleProfileSubmit} className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="handle">Handle (Username)</Label>
                <Input
                  id="handle"
                  value={profileData.handle}
                  onChange={(e) => setProfileData({ ...profileData, handle: e.target.value })}
                  placeholder="Choose a unique handle (e.g., @johndoe)"
                />
                <p className="text-sm text-muted-foreground">
                  This is how other users can find and add you as a friend. Include the @ symbol.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile?.email || ""} disabled />
              </div>

              <Button 
                type="submit" 
                disabled={updateProfileMutation.isPending}
                className="w-full md:w-auto"
              >
                {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Add Friends Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Friends
          </CardTitle>
          <CardDescription>
            Send friend requests using their handle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="friendHandle">Friend's Handle</Label>
              <Input
                id="friendHandle"
                value={friendHandle}
                onChange={(e) => setFriendHandle(e.target.value)}
                placeholder="Enter user handle (e.g., johndoe)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="friendMessage">Message (Optional)</Label>
              <Input
                id="friendMessage"
                value={friendMessage}
                onChange={(e) => setFriendMessage(e.target.value)}
                placeholder="Hi, let's be friends on ShareBrain!"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="button"
                disabled={sendFriendRequestMutation.isPending}
                className="w-full md:w-auto"
                onClick={() => {
                  console.log("Send Friend Request button clicked");
                  
                  if (!friendHandle.trim()) {
                    console.log("No handle provided");
                    toast({
                      title: "Handle Required",
                      description: "Please enter a user handle to send a friend request.",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  // Clean the handle - add @ if not present, or keep as is if already has @
                  let cleanHandle = friendHandle.trim();
                  if (!cleanHandle.startsWith('@')) {
                    cleanHandle = '@' + cleanHandle;
                  }
                  
                  console.log("Sending friend request to:", cleanHandle);
                  
                  sendFriendRequestMutation.mutate({
                    handle: cleanHandle,
                    message: friendMessage.trim()
                  });
                }}
              >
                {sendFriendRequestMutation.isPending ? "Sending..." : "Send Friend Request"}
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={() => {
                  console.log("Test button clicked - this should work");
                  alert("Test button works!");
                }}
              >
                Test Click
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Friend Requests Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Friend Requests
            {friendRequests && friendRequests.length > 0 && (
              <Badge variant="secondary">{friendRequests.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Respond to incoming friend requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : friendRequests && friendRequests.length > 0 ? (
            <div className="space-y-4">
              {friendRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {request.senderName?.charAt(0) || request.senderHandle?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {request.senderName || request.senderHandle}
                      </p>
                      <p className="text-sm text-muted-foreground">@{request.senderHandle}</p>
                      {request.message && (
                        <p className="text-sm mt-1">{request.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleRespondToRequest(request.id, "accepted")}
                      disabled={respondToRequestMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRespondToRequest(request.id, "declined")}
                      disabled={respondToRequestMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No pending friend requests
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}