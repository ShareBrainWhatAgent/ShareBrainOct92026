import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, UserPlus, Bot, MessageSquare } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import ChatInterface from "@/components/chat-interface";
import type { Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const addFriendSchema = z.object({
  identifier: z.string().min(1, "Please enter a handle (@username) or email address"),
  message: z.string().optional(),
});

const addAgentSchema = z.object({
  agentId: z.coerce.number().min(1, "Please enter a valid agent ID"),
});

type AddFriendForm = z.infer<typeof addFriendSchema>;
type AddAgentForm = z.infer<typeof addAgentSchema>;

export default function Contacts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [messages, setMessages] = useState<(Message & { metadata?: any })[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["/api/contacts"],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  // Fetch friend requests
  const { data: friendRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/friends/requests"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: pendingInvitations = [], isLoading: invitationsLoading } = useQuery({
    queryKey: ["/api/chat-invitations/pending"],
  });

  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitation: any) => {
      const res = await apiRequest("PATCH", `/api/chat-invitations/${invitation.id}/accept`);
      return { response: await res.json(), invitation };
    },
    onSuccess: async ({ response, invitation }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat-invitations/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat-invitations/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] }); // Refresh contacts to show new group chat
      
      // If the response includes group chat info and redirect URL, go to unified chat
      if (response.groupChat && response.redirectTo) {
        toast({ 
          title: "Invitation Accepted", 
          description: `You've joined ${response.groupChat.name}! Opening group chat...` 
        });
        
        // Redirect to unified chat after a brief delay
        setTimeout(() => {
          window.location.href = response.redirectTo;
        }, 1000);
      } else {
        toast({ title: "Invitation Accepted", description: "You've joined the group chat!" });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to accept invitation.", variant: "destructive" });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const res = await apiRequest("PATCH", `/api/chat-invitations/${invitationId}/read`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat-invitations/unread-count"] });
    },
  });

  const friendForm = useForm<AddFriendForm>({
    resolver: zodResolver(addFriendSchema),
    defaultValues: { identifier: "", message: "" },
  });

  const agentForm = useForm<AddAgentForm>({
    resolver: zodResolver(addAgentSchema),
    defaultValues: { agentId: undefined as unknown as number },
  });

  const addFriendMutation = useMutation({
    mutationFn: async (data: AddFriendForm) => {
      const identifier = data.identifier.trim();
      
      // Determine if it's an email or handle
      const isEmail = identifier.includes('@') && identifier.includes('.');
      
      const payload = isEmail 
        ? { email: identifier, message: data.message || "Let's be friends on ShareBrain!" }
        : { 
            handle: identifier.startsWith('@') ? identifier : '@' + identifier,
            message: data.message || "Let's be friends on ShareBrain!"
          };
      
      const res = await apiRequest("POST", "/api/friends/send-request", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      friendForm.reset();
      toast({ title: "Friend Request Sent", description: "Your friend request has been sent successfully." });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to send friend request";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  // Friend request response mutation
  const respondToRequestMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: number; action: 'accept' | 'decline' }) => {
      const res = await apiRequest("POST", "/api/friends/respond", { requestId, action });
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      
      if (variables.action === 'accept') {
        toast({ 
          title: "Friend Request Accepted", 
          description: "You are now friends! Check My Brains for your friendship ShareBrain." 
        });
      } else {
        toast({ title: "Friend Request Declined", description: "The friend request has been declined." });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to respond to friend request.", variant: "destructive" });
    },
  });

  const addAgentMutation = useMutation({
    mutationFn: async (data: AddAgentForm) => {
      const res = await apiRequest("POST", "/api/contacts/agents", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      agentForm.reset();
      toast({ title: "Agent Added", description: "The agent has been added to your contacts." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add agent.", variant: "destructive" });
    },
  });

  const onAddFriend = (data: AddFriendForm) => addFriendMutation.mutate(data);
  const onAddAgent = (data: AddAgentForm) => addAgentMutation.mutate(data);

  const handleSelectContact = async (contact: any) => {
    setSelectedContact(contact);
    setMessages([]);
    setConversationId(null);
    
    // Clear "New Chat" indicator when contact is selected
    if (contact.hasNewMessage) {
      try {
        await apiRequest("PATCH", `/api/contacts/${contact.id}/mark-read`);
        queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
        queryClient.invalidateQueries({ queryKey: ["/api/contacts/new-message-count"] });
      } catch (error) {
        console.error("Error marking contact as read:", error);
      }
    }
    
    // Check if conversation already exists and load history
    try {
      const createResponse = await apiRequest("POST", "/api/unified-chat/conversations", {
        contactId: contact.id,
        contactType: contact.type === 'friend' ? 'user' : 'agent',
        title: `Chat with ${contact.name}`,
      });
      const conversation = await createResponse.json();
      const conversationId = conversation.conversation ? conversation.conversation.id : conversation.id;
      setConversationId(conversationId);
      
      // Load existing messages if conversation exists
      if (conversationId) {
        const messagesResponse = await apiRequest("GET", `/api/unified-chat/messages/${conversationId}`);
        const existingMessages = await messagesResponse.json();
        setMessages(existingMessages || []);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  // Auto-refresh messages every 2 seconds when a conversation is selected
  useEffect(() => {
    if (!conversationId) return;

    const refreshMessages = async () => {
      try {
        const messagesResponse = await apiRequest("GET", `/api/unified-chat/messages/${conversationId}`);
        const latestMessages = await messagesResponse.json();
        setMessages(latestMessages || []);
      } catch (error) {
        console.error("Error refreshing messages:", error);
      }
    };

    const interval = setInterval(refreshMessages, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [conversationId]);

  const chatMutation = useMutation({
    mutationFn: async ({
      contactId,
      message,
      conversationId,
    }: {
      contactId: number;
      message: string;
      conversationId?: number;
    }) => {
      // Create conversation if it doesn't exist
      if (!conversationId) {
        const createResponse = await apiRequest("POST", "/api/unified-chat/conversations", {
          contactId: contactId,
          contactType: selectedContact?.type === 'friend' ? 'user' : 'agent',
          title: `Chat with ${selectedContact?.name || 'Contact'}`,
        });
        const conversation = await createResponse.json();
        conversationId = conversation.conversation ? conversation.conversation.id : conversation.id;
        setConversationId(conversationId);
      }

      // Send message
      const response = await apiRequest("POST", "/api/unified-chat/messages", {
        conversationId,
        content: message,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [...prev, data]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (inputMessage: string) => {
    if (!inputMessage.trim() || !selectedContact || chatMutation.isPending)
      return;

    chatMutation.mutate({
      contactId: selectedContact.id,
      message: inputMessage,
      conversationId: conversationId || undefined,
    });
  };



  return (
    <>
      <header className="bg-black border-b border-white px-6 py-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Contacts</h2>
          <p className="text-white mt-1">Manage your friends and agent contacts</p>
        </div>
      </header>

      <main className="flex-1 p-8 space-y-6">
        {/* Friend Requests Section */}
        {friendRequests.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Friend Requests ({friendRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {friendRequests.map((request: any) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <UserPlus className="text-green-600 h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-green-900">
                          {request.senderName} ({request.senderHandle})
                        </p>
                        <p className="text-sm text-green-700">{request.message}</p>
                        <p className="text-xs text-green-600">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => respondToRequestMutation.mutate({ requestId: request.id, action: 'accept' })}
                        disabled={respondToRequestMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => respondToRequestMutation.mutate({ requestId: request.id, action: 'decline' })}
                        disabled={respondToRequestMutation.isPending}
                        className="border-green-300 text-green-700 hover:bg-green-100"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Invitations Section */}
        {pendingInvitations.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat Invitations ({pendingInvitations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingInvitations.map((invitation: any) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="text-blue-600 h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {invitation.invitedByUser?.firstName} {invitation.invitedByUser?.lastName}
                          {invitation.invitedByUser?.handle && ` (@${invitation.invitedByUser.handle})`}
                        </p>
                        <p className="text-sm text-slate-600">
                          Invited you to chat{invitation.agent ? ` with ${invitation.agent.name}` : ''}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(invitation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          markAsReadMutation.mutate(invitation.id);
                        }}
                        disabled={markAsReadMutation.isPending}
                      >
                        Mark Read
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          acceptInvitationMutation.mutate(invitation);
                        }}
                        disabled={acceptInvitationMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Your Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-slate-500">Loading contacts...</p>
            ) : contacts.length === 0 ? (
              <p className="text-slate-500">No contacts yet</p>
            ) : (
              <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                <ul className="space-y-2 pr-2">
                  {contacts
                    .sort((a: any, b: any) => {
                      // First sort by new message status
                      if (a.hasNewMessage && !b.hasNewMessage) return -1;
                      if (!a.hasNewMessage && b.hasNewMessage) return 1;
                      
                      // Then sort by last activity/updated time
                      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
                      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
                      return bTime - aTime; // Most recent first
                    })
                    .map((contact: any) => (
                    <li
                      key={contact.id}
                      className={`flex items-center justify-between p-3 border rounded hover:bg-gray-900 transition-colors relative ${
                        contact.hasNewMessage 
                          ? "bg-gray-800 border-red-500 shadow-lg" 
                          : "bg-black border-white"
                      }`}
                    >
                      {/* New message indicator dot */}
                      {contact.hasNewMessage && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-pulse"></div>
                      )}
                      
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          contact.hasNewMessage ? "bg-red-100" : "bg-white"
                        }`}>
                          <Bot className={`h-4 w-4 ${
                            contact.hasNewMessage ? "text-red-600" : "text-black"
                          }`} />
                        </div>
                        <div>
                          <span className={`font-medium ${
                            contact.hasNewMessage ? "text-white font-bold" : "text-white"
                          }`}>
                            {contact.name}
                            {contact.hasNewMessage && (
                              <span className="ml-2 text-red-400 text-xs font-normal">
                                • New message
                              </span>
                            )}
                          </span>
                          <p className="text-xs text-white">{contact.type}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectContact(contact)}
                        className={`${
                          contact.hasNewMessage
                            ? "bg-red-600 border-red-600 text-white hover:bg-red-700"
                            : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        }`}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {contact.hasNewMessage ? "New Chat" : "Chat"}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {!selectedContact && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Add Friend</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={friendForm.handleSubmit(onAddFriend)} className="space-y-3">
                  <div>
                    <Label htmlFor="friendIdentifier">Friend Handle or Email</Label>
                    <Input 
                      id="friendIdentifier" 
                      placeholder="Enter @username or email address"
                      {...friendForm.register("identifier")}
                    />
                    {friendForm.formState.errors.identifier && (
                      <p className="text-sm text-red-500 mt-1">
                        {friendForm.formState.errors.identifier.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="friendMessage">Message (Optional)</Label>
                    <Input 
                      id="friendMessage" 
                      placeholder="Hi, let's be friends on ShareBrain!"
                      {...friendForm.register("message")}
                    />
                  </div>
                  <Button type="submit" disabled={addFriendMutation.isPending} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    {addFriendMutation.isPending ? "Sending..." : "Send Friend Request"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <span>Add Agent</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={agentForm.handleSubmit(onAddAgent)} className="space-y-3">
                  <div>
                    <Label htmlFor="agentId">Agent ID</Label>
                    <Input id="agentId" type="number" {...agentForm.register("agentId")}></Input>
                    {agentForm.formState.errors.agentId && (
                      <p className="text-sm text-red-500 mt-1">
                        {agentForm.formState.errors.agentId.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" disabled={addAgentMutation.isPending} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    {addAgentMutation.isPending ? "Adding..." : "Add Agent"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedContact && (
          <Card className="h-[500px] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Chat with {selectedContact.name}
              </h3>
            </div>
            <CardContent className="flex-1 p-0 flex flex-col">
              <div className="flex-1 flex flex-col">
                <ChatInterface
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  conversationId={conversationId || undefined}
                  isLoading={chatMutation.isPending}
                  disabled={!selectedContact}
                  placeholder="Type your message..."
                  agentId={selectedContact.agentId}
                  voiceEnabled={true}
                  imageEnabled={true}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
