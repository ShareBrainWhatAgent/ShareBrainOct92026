import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock, UserPlus, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface FriendRequest {
  id: number;
  senderId: string;
  receiverId: string;
  senderName?: string;
  senderHandle?: string;
  message?: string;
  status: string;
  createdAt: string;
}

export default function FriendRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch friend requests
  const { data: friendRequests = [], isLoading: requestsLoading } = useQuery<FriendRequest[]>({
    queryKey: ['/api/friends/requests'],
    refetchOnWindowFocus: false
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
    onSuccess: (_, variables) => {
      const action = variables.action === "accepted" ? "accepted" : "declined";
      toast({
        title: `Friend Request ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        description: `You have ${action} the friend request.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
      queryClient.invalidateQueries({ queryKey: ["/api/unified-chat/contacts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to respond to friend request.",
        variant: "destructive",
      });
    },
  });

  const handleRespondToRequest = (requestId: number, action: string) => {
    respondToRequestMutation.mutate({ requestId, action });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/unified-chat">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Friend Requests</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your incoming friend requests</p>
        </div>
      </div>

      {/* Friend Requests */}
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
            Accept or decline friend requests from other users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-20 h-8 bg-gray-200 rounded"></div>
                      <div className="w-20 h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : friendRequests && friendRequests.length > 0 ? (
            <div className="space-y-6">
              {friendRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-6 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="text-lg">
                        {request.senderName?.charAt(0) || request.senderHandle?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg">
                        {request.senderName || request.senderHandle || "Unknown User"}
                      </p>
                      {request.senderHandle && (
                        <p className="text-sm text-muted-foreground">@{request.senderHandle}</p>
                      )}
                      {request.message && (
                        <p className="text-sm mt-2 p-3 bg-white dark:bg-gray-700 rounded border italic">
                          "{request.message}"
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Sent {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      size="lg"
                      onClick={() => handleRespondToRequest(request.id, "accepted")}
                      disabled={respondToRequestMutation.isPending}
                      className="min-w-24"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => handleRespondToRequest(request.id, "declined")}
                      disabled={respondToRequestMutation.isPending}
                      className="min-w-24"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Pending Friend Requests
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                When someone sends you a friend request, it will appear here.
              </p>
              <Link href="/unified-chat">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Chat
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How Friend Requests Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • Users can send you friend requests using your handle (username)
          </p>
          <p className="text-sm text-muted-foreground">
            • Accept requests to add them to your friends list for easy chatting
          </p>
          <p className="text-sm text-muted-foreground">
            • Declined requests are removed and won't appear again
          </p>
          <p className="text-sm text-muted-foreground">
            • You can update your handle in Profile Settings if needed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}