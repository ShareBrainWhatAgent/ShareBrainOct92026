import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Send, 
  Hash, 
  Users, 
  Bot, 
  UserPlus, 
  Search, 
  Settings, 
  Phone, 
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  Bell,
  Clock
} from "lucide-react";

// Types for the unified chat system
interface ChatContact {
  id: number;
  contactType: "user" | "agent";
  displayName: string;
  isOnline: boolean;
  lastSeen?: string;
  avatar?: string;
  status?: string;
}

interface ChatMessage {
  id: number;
  senderId?: string;
  senderAgentId?: number;
  senderType: "user" | "agent";
  content: string;
  createdAt: string;
  senderName: string;
  senderAvatar?: string;
}

interface ConversationParticipant {
  id: string;
  contactType: "user" | "agent";
  displayName: string;
  isOnline: boolean;
  avatar?: string;
}

interface ChatConversation {
  id: number;
  title?: string;
  type: "direct" | "group" | "agent";
  lastActivity: string;
  lastMessage?: string;
  unreadCount?: number;
  participants: ConversationParticipant[];
}

export default function UnifiedChat() {
  const [location, navigate] = useLocation();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("friends");
  const [friendHandle, setFriendHandle] = useState("");
  const [addFriendDialogOpen, setAddFriendDialogOpen] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const lastMessageCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<ChatConversation[]>({
    queryKey: ["/api/unified-chat/conversations"],
  });

  // Fetch contacts/friends
  const { data: contacts = [], isLoading: contactsLoading } = useQuery<ChatContact[]>({
    queryKey: ["/api/unified-chat/contacts"],
  });

  // Fetch friend requests
  const { data: friendRequests = [], isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: ["/api/friends/requests"],
    refetchOnWindowFocus: false
  });

  // Fetch agents for adding as contacts
  const { data: agents = [], isLoading: agentsLoading } = useQuery<any[]>({
    queryKey: ["/api/agents"],
  });

  // Fetch messages for selected conversation with automatic polling
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/unified-chat/messages", selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const response = await fetch(`/api/unified-chat/messages/${selectedConversation}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return response.json();
    },
    enabled: !!selectedConversation,
    refetchInterval: 2000, // Poll every 2 seconds for new messages
    refetchIntervalInBackground: true, // Continue polling when tab is in background
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
      setAddFriendDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/unified-chat/contacts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to send friend request.",
        variant: "destructive",
      });
    },
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (data: { contactId: number; contactType: string; agentId?: number }) => {
      const response = await fetch('/api/unified-chat/conversations', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create conversation');
      }
      return response.json();
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/unified-chat/conversations"] });
      setSelectedConversation(conversation.id);
      setActiveTab("chats");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Start Chat",
        description: error.message || "Failed to create conversation.",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: number; content: string }) => {
      const response = await fetch('/api/unified-chat/messages', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/unified-chat/messages", selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ["/api/unified-chat/conversations"] });
      setNewMessage("");
      
      // Activate fast polling after a brief delay to catch agent responses
      setTimeout(() => setFastPolling(true), 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Message",
        description: error.message || "Failed to send message.",
        variant: "destructive",
      });
    },
  });

  // Add participant mutation
  const addParticipantMutation = useMutation({
    mutationFn: async (data: { 
      conversationId: number; 
      agentId?: number; 
      contactId?: number;
      participantType: 'agent' | 'user';
    }) => {
      const payload = data.participantType === 'agent' 
        ? { agentId: data.agentId }
        : { contactId: data.contactId };
        
      const response = await fetch(`/api/unified-chat/conversations/${data.conversationId}/participants`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add participant');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/unified-chat/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/unified-chat/messages", selectedConversation] });
      
      const participantType = variables.participantType === 'agent' ? 'Agent' : 'Friend';
      toast({
        title: `${participantType} Added`,
        description: data.message || `${participantType} added to conversation`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Participant",
        description: error.message || "Failed to add participant to conversation.",
        variant: "destructive",
      });
    },
  });

  // Handle scroll events to track user scrolling behavior
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      setShowScrollTop(scrollTop > 200);
      
      // Track if user has manually scrolled up (more than 50px from bottom)
      setUserHasScrolledUp(distanceFromBottom > 50);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Smart scrolling logic for unified chat
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || messages.length === 0) return;

    // Always scroll to bottom on initial chat load or conversation change
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      setTimeout(() => {
        container.scrollTo({ 
          top: container.scrollHeight, 
          behavior: 'smooth' 
        });
      }, 100);
      return;
    }

    // Check if we have new messages
    const hasNewMessages = messages.length > lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;

    if (!hasNewMessages) return;

    // Get the latest message
    const latestMessage = messages[messages.length - 1];
    
    // If user sent a message, scroll to show their question at the top of viewport
    if (latestMessage.senderType === 'user') {
      // Find user's message element and scroll to it
      setTimeout(() => {
        const messageElements = container.querySelectorAll('[data-message-id]');
        const userMessageElement = Array.from(messageElements).find(el => 
          el.getAttribute('data-message-id') === latestMessage.id?.toString()
        );
        
        if (userMessageElement) {
          const containerRect = container.getBoundingClientRect();
          const messageRect = userMessageElement.getBoundingClientRect();
          const relativeTop = messageRect.top - containerRect.top;
          
          container.scrollTo({ 
            top: container.scrollTop + relativeTop - 20, // 20px padding from top
            behavior: 'smooth' 
          });
        }
      }, 50);
    }
    
    // If AI/agent responded and user hasn't manually scrolled up, ensure the response is visible
    else if (latestMessage.senderType === 'agent' && !userHasScrolledUp) {
      setTimeout(() => {
        container.scrollTo({ 
          top: container.scrollHeight, 
          behavior: 'smooth' 
        });
      }, 100);
    }
    
    // Reset user scroll state when new message arrives and they're near bottom
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 100) {
      setUserHasScrolledUp(false);
    }
    
  }, [messages, selectedConversation, userHasScrolledUp]);

  // Reset scroll state when conversation changes
  useEffect(() => {
    setUserHasScrolledUp(false);
    isInitialLoadRef.current = true;
    lastMessageCountRef.current = 0;
  }, [selectedConversation]);

  // Set up polling for real-time message updates
  useEffect(() => {
    if (!selectedConversation) return;

    const pollMessages = () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/unified-chat/messages", selectedConversation] 
      });
    };

    // Poll every 3 seconds when a conversation is selected (reduced frequency)
    const interval = setInterval(pollMessages, 3000);
    
    return () => clearInterval(interval);
  }, [selectedConversation, queryClient]);

  // Enhanced polling after sending a message (to catch agent responses faster)
  const [fastPolling, setFastPolling] = useState(false);
  
  useEffect(() => {
    if (!fastPolling || !selectedConversation) return;

    const pollMessages = () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/unified-chat/messages", selectedConversation] 
      });
    };

    // Fast polling every 1.5 seconds for 20 seconds after sending a message
    const interval = setInterval(pollMessages, 1500);
    const timeout = setTimeout(() => setFastPolling(false), 20000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [fastPolling, selectedConversation, queryClient]);

  // Get selected conversation data
  const selectedConversationData = conversations.find(conv => conv.id === selectedConversation);
  
  // Get chat header information
  const getChatHeaderInfo = () => {
    if (!selectedConversationData) return { title: "Chat", subtitle: "Select a conversation", avatar: null };
    
    // For direct messages, show the other participant's name
    if (selectedConversationData.type === "direct" && selectedConversationData.participants.length >= 2) {
      const otherParticipant = selectedConversationData.participants.find(p => p.id !== "demo-user");
      if (otherParticipant) {
        return {
          title: otherParticipant.displayName,
          subtitle: otherParticipant.isOnline ? "Online" : "Offline",
          avatar: otherParticipant.avatar
        };
      }
    }
    
    // For agent chats or group chats, use the conversation title
    return {
      title: selectedConversationData.title || "Chat",
      subtitle: selectedConversationData.type === "agent" ? "AI Agent" : "Group Chat",
      avatar: null
    };
  };

  const chatHeaderInfo = getChatHeaderInfo();

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: newMessage.trim(),
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getContactInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Contacts and Conversations */}
      <div className={`
        w-full sm:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col
        ${showMobileSidebar ? 'block' : 'hidden'} sm:block
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">ShareBrain Chat</h2>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Friend Requests Alert */}
        {friendRequests.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 p-3 m-2 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  {friendRequests.length} Friend Request{friendRequests.length !== 1 ? 's' : ''}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                onClick={() => window.open('/friend-requests', '_blank')}
              >
                View
              </Button>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Click "View" to manage your friend requests
            </p>
          </div>
        )}

        {/* Tabs for Friends, Agents, Conversations */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 m-2">
            <TabsTrigger value="friends" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              Friends
              {friendRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs h-4 px-1">
                  {friendRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="agents" className="text-xs">
              <Bot className="w-3 h-3 mr-1" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="chats" className="text-xs">
              <Hash className="w-3 h-3 mr-1" />
              Chats
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="friends" className="mt-0">
              <div className="p-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Friends</span>
                  <Dialog open={addFriendDialogOpen} onOpenChange={setAddFriendDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Friend</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input 
                          placeholder="Enter user handle (e.g., @username)" 
                          value={friendHandle}
                          onChange={(e) => setFriendHandle(e.target.value)}
                        />
                        <Button 
                          className="w-full" 
                          onClick={() => {
                            console.log("Send Friend Request clicked in dialog");
                            if (!friendHandle.trim()) {
                              toast({
                                title: "Handle Required",
                                description: "Please enter a user handle to send a friend request.",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            // Clean the handle - add @ if not present
                            let cleanHandle = friendHandle.trim();
                            if (!cleanHandle.startsWith('@')) {
                              cleanHandle = '@' + cleanHandle;
                            }
                            
                            console.log("Sending friend request to:", cleanHandle);
                            sendFriendRequestMutation.mutate({
                              handle: cleanHandle,
                              message: "Let's be friends on ShareBrain!"
                            });
                          }}
                          disabled={sendFriendRequestMutation.isPending}
                        >
                          {sendFriendRequestMutation.isPending ? "Sending..." : "Send Friend Request"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {contacts.filter((c: ChatContact) => c.contactType === "user").map((contact: ChatContact) => (
                  <div
                    key={contact.id}
                    className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer mb-1"
                    onClick={() => {
                      console.log("Starting chat with friend:", contact.displayName);
                      createConversationMutation.mutate({
                        contactId: contact.id,
                        contactType: "user"
                      });
                      // Hide sidebar on mobile when starting conversation
                      if (window.innerWidth < 640) {
                        setShowMobileSidebar(false);
                      }
                    }}
                  >
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback className="text-xs">
                          {getContactInitials(contact.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      {contact.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {contact.displayName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {contact.isOnline ? "Online" : `Last seen ${contact.lastSeen}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="agents" className="mt-0">
              <div className="p-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">AI Agents</span>
                  <span className="text-xs text-gray-400">{agents.length}</span>
                </div>
                
                {agents.slice(0, 20).map((agent: any) => (
                  <div
                    key={agent.id}
                    className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer mb-1"
                    onClick={() => {
                      console.log("Starting chat with agent:", agent.name);
                      createConversationMutation.mutate({
                        contactId: agent.id,
                        contactType: "agent",
                        agentId: agent.id
                      });
                      // Hide sidebar on mobile when starting conversation
                      if (window.innerWidth < 640) {
                        setShowMobileSidebar(false);
                      }
                    }}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-blue-500 text-white">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {agent.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {agent.category} • {agent.model}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      AI
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="chats" className="mt-0">
              <div className="p-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Recent Chats</span>
                </div>
                
                {conversationsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No conversations yet</p>
                    <p className="text-xs text-gray-400">Start a chat with friends or AI agents</p>
                  </div>
                ) : (
                  conversations.map((conversation: ChatConversation) => (
                    <div
                      key={conversation.id}
                      className={`flex items-center p-2 rounded-lg cursor-pointer mb-1 ${
                        selectedConversation === conversation.id
                          ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => {
                        setSelectedConversation(conversation.id);
                        // Hide sidebar on mobile when conversation is selected
                        if (window.innerWidth < 640) {
                          setShowMobileSidebar(false);
                        }
                      }}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {conversation.type === "agent" ? (
                            <Bot className="w-4 h-4" />
                          ) : conversation.type === "group" ? (
                            <Users className="w-4 h-4" />
                          ) : (
                            getContactInitials(conversation.title || "Chat")
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {conversation.title || "Direct Message"}
                          </p>
                          <span className="text-xs text-gray-400">
                            {formatTime(conversation.lastActivity)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {conversation.lastMessage || "No messages yet"}
                        </p>
                      </div>
                      {conversation.unreadCount && conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs min-w-[20px] h-5">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Main Chat Area */}
      <div className={`
        flex-1 flex flex-col
        ${!showMobileSidebar ? 'block' : 'hidden'} sm:block
      `}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
              {/* Mobile back button */}
              <Button
                variant="ghost"
                size="sm"
                className="sm:hidden mr-2"
                onClick={() => setShowMobileSidebar(true)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              <div className="flex items-center">
                <Avatar className="w-8 h-8">
                  {chatHeaderInfo.avatar ? (
                    <AvatarImage src={chatHeaderInfo.avatar} alt={chatHeaderInfo.title} />
                  ) : (
                    <AvatarFallback className="text-xs">
                      {selectedConversationData?.type === "agent" ? (
                        <Bot className="w-4 h-4" />
                      ) : selectedConversationData?.type === "group" ? (
                        <Users className="w-4 h-4" />
                      ) : (
                        getContactInitials(chatHeaderInfo.title)
                      )}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{chatHeaderInfo.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{chatHeaderInfo.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" title="Add participant">
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Participant to Chat</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Add Friends Section */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Add Friends</h4>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {contacts.filter((c: ChatContact) => c.contactType === "user").map((friend: ChatContact) => (
                            <div
                              key={friend.id}
                              className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                              onClick={() => {
                                if (selectedConversation) {
                                  addParticipantMutation.mutate({
                                    conversationId: selectedConversation,
                                    contactId: friend.id,
                                    participantType: 'user'
                                  });
                                }
                              }}
                            >
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={friend.avatar} />
                                <AvatarFallback className="text-xs bg-green-500 text-white">
                                  {getContactInitials(friend.displayName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="ml-2 flex-1">
                                <p className="text-sm font-medium">{friend.displayName}</p>
                                <p className="text-xs text-gray-500">Friend</p>
                              </div>
                            </div>
                          ))}
                          {contacts.filter((c: ChatContact) => c.contactType === "user").length === 0 && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              No friends to add. Add friends in Contacts first.
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Add AI Agent Section */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Add AI Agent</h4>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {agents.slice(0, 10).map((agent: any) => (
                            <div
                              key={agent.id}
                              className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                              onClick={() => {
                                if (selectedConversation) {
                                  addParticipantMutation.mutate({
                                    conversationId: selectedConversation,
                                    agentId: agent.id,
                                    participantType: 'agent'
                                  });
                                }
                              }}
                            >
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-blue-500 text-white">
                                  <Bot className="w-3 h-3" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="ml-2 flex-1">
                                <p className="text-sm font-medium">{agent.name}</p>
                                <p className="text-xs text-gray-500">{agent.category}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="sm">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollContainerRef} className="flex-1 p-4" style={{ overflowY: 'scroll', minHeight: 0 }}>
              <div className="space-y-4">
                {messages.map((message: ChatMessage) => (
                  <div
                    key={message.id}
                    data-message-id={message.id}
                    className={`flex ${message.senderType === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex max-w-[70%] ${message.senderType === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <Avatar className="w-8 h-8 mt-1">
                        <AvatarImage src={message.senderAvatar} />
                        <AvatarFallback className="text-xs">
                          {message.senderType === "agent" ? (
                            <Bot className="w-4 h-4" />
                          ) : (
                            getContactInitials(message.senderName)
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`mx-2 ${message.senderType === "user" ? "text-right" : "text-left"}`}>
                        <div className="flex items-center mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {message.senderName}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            message.senderType === "user"
                              ? "bg-black text-white border border-white"
                              : "bg-black text-white border border-white"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Scroll to top button */}
              {showScrollTop && (
                <button
                  onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="fixed bottom-20 right-6 z-10 p-3 bg-black text-white rounded-full shadow-lg border border-white hover:bg-gray-800 transition-colors"
                  aria-label="Scroll to top"
                >
                  ↑
                </button>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" type="button">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sendMessageMutation.isPending}
                    className="border-0 bg-gray-100 dark:bg-gray-700 focus-visible:ring-1"
                  />
                </div>
                <Button variant="ghost" size="sm" type="button">
                  <Smile className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" type="button">
                  <Mic className="w-4 h-4" />
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Hash className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to ShareBrain Chat
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Select a conversation to start chatting with friends or AI agents
              </p>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setAddFriendDialogOpen(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Friends
                </Button>
                <Button variant="outline" className="w-full">
                  <Bot className="w-4 h-4 mr-2" />
                  Chat with AI Agents
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}