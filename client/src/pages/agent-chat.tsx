import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Bot, Sparkles, Volume2, Send, UserPlus, Users, ExternalLink, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ChatInterface from "@/components/chat-interface";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScriptEditingInterface } from "@/components/ScriptEditingInterface";
import type { Agent, Message } from "@shared/schema";

export default function AgentChat() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<(Message & { metadata?: any })[]>([]);
  const [showFriendDialog, setShowFriendDialog] = useState(false);
  const [conversationParticipants, setConversationParticipants] = useState<any[]>([]);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [showScriptEditor, setShowScriptEditor] = useState(false);

  const { data: agent, isLoading: agentLoading, error } = useQuery({
    queryKey: ["/api/agents", id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/agents/${id}`);
      return response.json();
    },
    enabled: !!id,
  });

  // Check if user owns this agent (for script editing)
  const { data: ownership } = useQuery({
    queryKey: ["/api/agents", id, "ownership"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/agents/${id}/ownership`);
      return response.json();
    },
    enabled: !!id,
  });

  // Get agent website information from agent_workspaces
  const { data: agentWebsite } = useQuery({
    queryKey: ["/api/agent-website", id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/agent-website/${id}`);
      return response.json();
    },
    enabled: !!id,
  });

  // Get user's friends for inviting to chat
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/contacts");
      return response.json();
    },
  });

  // Filter contacts to only show user friends (not agents)
  // Support both old and new contact formats
  const friends = contacts?.filter((contact: any) => 
    contact.contactType === "user" || contact.type === "friend"
  ) || [];

  // Debug log to see what contacts are being returned
  console.log("Contacts from API:", contacts);
  console.log("Filtered friends:", friends);
  
  // Log the actual structure of friends
  if (friends && friends.length > 0) {
    console.log("First friend structure:", friends[0]);
    console.log("Friend keys:", Object.keys(friends[0]));
  }

  // Create or get existing conversation when agent loads
  useEffect(() => {
    if (agent && !currentConversationId) {
      const getOrCreateConversation = async () => {
        try {
          const response = await apiRequest("POST", "/api/agent-chat/start", {
            agentId: agent.id
          });
          const data = await response.json();
          if (data.conversation) {
            setCurrentConversationId(data.conversation.id);
          }
        } catch (error) {
          console.error("Error getting/creating conversation:", error);
        }
      };
      getOrCreateConversation();
    }
  }, [agent, currentConversationId]);

  const chatMutation = useMutation({
    mutationFn: async ({ agentId, message, conversationId }: { 
      agentId: number; 
      message: string; 
      conversationId?: number;
    }) => {
      // Use unified chat endpoint for group chats, standard for personal chats
      const endpoint = isGroupChat ? "/api/unified-chat/messages" : "/api/chat";
      const requestBody = isGroupChat 
        ? {
            conversationId: conversationId || currentConversationId,
            content: message,
            senderType: "user"
          }
        : {
            agentId: agentId,
            message: message,
            conversationId: conversationId || currentConversationId,
          };
      
      const response = await apiRequest("POST", endpoint, requestBody);
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, data]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const inviteFriendMutation = useMutation({
    mutationFn: async ({ conversationId, friendId }: { conversationId: number; friendId: string }) => {
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/participants`, {
        userId: friendId,
        participantType: "user"
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Friend invited",
        description: "Your friend has been added to the conversation.",
      });
      setShowFriendDialog(false);
      setIsGroupChat(true);
      
      // If backend created a new unified conversation, switch to it
      if (data.groupConversationId) {
        setCurrentConversationId(data.groupConversationId);
        // Messages will be loaded automatically via useEffect when conversationId changes
      } else {
        // Refresh conversation participants and messages for existing conversation
        loadConversationParticipants();
        loadMessages();
      }
    },
    onError: (error: any) => {
      console.error("🚨 Friend Invitation Error:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        response: error.response
      });
      
      toast({
        title: "Error",
        description: error.message || "Failed to invite friend. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (inputMessage: string) => {
    if (!inputMessage.trim() || !agent || chatMutation.isPending) return;

    // Check for script editing commands first (only if user owns the agent)
    if (ownership && typeof ownership === 'object' && 'canEdit' in ownership && (ownership as any).canEdit && inputMessage.trim().toLowerCase().startsWith('/')) {
      const commandResponse = processScriptCommand(inputMessage);
      if (commandResponse) {
        // Add command and response to chat
        setMessages(prev => [
          ...prev,
          { 
            id: Date.now(), 
            role: 'user', 
            content: inputMessage, 
            conversationId: currentConversationId || 0, 
            createdAt: new Date(), 
            metadata: {} 
          },
          { 
            id: Date.now() + 1, 
            role: 'assistant', 
            content: commandResponse, 
            conversationId: currentConversationId || 0, 
            createdAt: new Date(), 
            metadata: {} 
          }
        ]);
        return;
      }
    }

    // Use agent.id directly - it should already be a number from the API
    const agentId = agent.id;
    
    chatMutation.mutate({
      agentId: agentId,
      message: inputMessage,
      conversationId: currentConversationId || undefined,
    });
  };

  // Process script editing commands
  const processScriptCommand = (message: string): string | null => {
    if (!ownership || typeof ownership !== 'object' || !('canEdit' in ownership) || !(ownership as any).canEdit || !agent) return null;

    const trimmedMsg = message.trim().toLowerCase();

    // /show-script command
    if (trimmedMsg === '/show-script' || trimmedMsg === '/script') {
      return `**Current System Prompt** (Version ${agent.scriptVersion || 1})

\`\`\`
${agent.systemPrompt || 'No system prompt set'}
\`\`\`

**Agent Information:**
- Name: ${agent.name}
- Last Modified: ${agent.lastModified ? new Date(agent.lastModified).toLocaleString() : 'Never'}
- Version: ${agent.scriptVersion || 1}

**Available Commands:**
- \`/show-script\` - Display current script
- \`/copy-script\` - Copy script to clipboard  
- \`/edit-script\` - Open script editor interface
- \`/help-script\` - Show command help

Type \`/edit-script\` to open the visual script editor.`;
    }

    // /copy-script command
    if (trimmedMsg === '/copy-script') {
      if (agent.systemPrompt) {
        navigator.clipboard.writeText(agent.systemPrompt).then(() => {
          toast({
            title: "Script Copied",
            description: "System prompt copied to clipboard.",
          });
        }).catch(() => {
          toast({
            title: "Copy Failed",
            description: "Failed to copy to clipboard.",
            variant: "destructive",
          });
        });
      }

      return `**Script Copied to Clipboard**

The current system prompt (${agent.systemPrompt?.length || 0} characters) has been copied to your clipboard.

You can now:
1. Paste it into ChatGPT or Claude for improvement
2. Edit it in your preferred text editor
3. Use \`/edit-script\` to apply changes via the visual editor

Current version: ${agent.scriptVersion || 1}`;
    }

    // /edit-script command
    if (trimmedMsg === '/edit-script' || trimmedMsg === '/editor') {
      setShowScriptEditor(true);
      return `**Opening Script Editor**

The visual script editor is now open. You can:
- Edit the system prompt directly
- Preview your changes before saving
- Add a reason for the changes
- Reset to the original script

The editor provides a better experience for longer scripts and complex edits.`;
    }

    // Help command
    if (trimmedMsg === '/help-script' || trimmedMsg === '/script-help') {
      return `**Script Editing Commands**

Available commands for editing this agent:

\`/show-script\` - Display the current system prompt
\`/copy-script\` - Copy current script to clipboard
\`/edit-script\` - Open visual script editor with AI improvements
\`/help-script\` - Show this help message

**Visual Editor Features:**
- **AI Improve Button** - Get intelligent suggestions for building on your script
- **Custom Requests** - Tell the AI exactly what to add (lesson plans, examples, etc.)
- Preview changes before saving
- Version tracking with change reasons
- Copy and reset functionality

**Example Workflow:**
1. \`/show-script\` - See current prompt
2. \`/edit-script\` - Open visual editor
3. Type request: "add lesson plans" or "make it more interactive"
4. Click **"AI Improve"** - Get AI-powered enhancements
5. Review and apply suggestions
6. Save with change reason

**Tips:**
- The AI builds upon your existing script rather than replacing it
- Use specific requests like "add 5 lesson plan examples" or "include more personality"
- Always review AI suggestions before applying them
- Only you (the agent creator) can edit this script`;
    }

    return null; // Not a script command
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    toast({
      title: "Chat cleared",
      description: "Conversation history has been cleared.",
    });
  };

  // Load existing messages when conversation ID is set
  const loadMessages = async () => {
    if (!currentConversationId) return;
    
    try {
      // Use unified chat endpoint for group chats, standard for personal chats
      const endpoint = isGroupChat 
        ? `/api/unified-chat/conversations/${currentConversationId}/messages`
        : `/api/conversations/${currentConversationId}/messages`;
      
      const messagesResponse = await apiRequest("GET", endpoint);
      const existingMessages = await messagesResponse.json();
      
      // Messages from both systems should be in the correct format
      setMessages(existingMessages || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  // Load conversation participants
  const loadConversationParticipants = async () => {
    if (!currentConversationId) return;
    
    try {
      // Use unified chat endpoint for group chats, standard for personal chats
      const endpoint = isGroupChat 
        ? `/api/unified-chat/conversations/${currentConversationId}/participants`
        : `/api/conversations/${currentConversationId}/participants`;
      
      const response = await apiRequest("GET", endpoint);
      const participants = await response.json();
      setConversationParticipants(participants || []);
      // Check if this is a group chat (more than 2 participants: user + agent + friends)
      setIsGroupChat(participants.length > 2);
    } catch (error) {
      console.error("Error loading participants:", error);
    }
  };

  useEffect(() => {
    if (!currentConversationId) return;
    loadMessages();
    loadConversationParticipants();
  }, [currentConversationId, isGroupChat]);

  // Auto-refresh messages every 2 seconds when a conversation is selected
  useEffect(() => {
    if (!currentConversationId) return;

    const refreshMessages = async () => {
      try {
        // Use unified chat endpoint for group chats, standard for personal chats
        const endpoint = isGroupChat 
          ? `/api/unified-chat/conversations/${currentConversationId}/messages`
          : `/api/conversations/${currentConversationId}/messages`;
        
        const messagesResponse = await apiRequest("GET", endpoint);
        const latestMessages = await messagesResponse.json();
        
        // Messages from both systems should be in the correct format
        setMessages(latestMessages || []);
      } catch (error) {
        console.error("Error refreshing messages:", error);
      }
    };

    const interval = setInterval(refreshMessages, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [currentConversationId, isGroupChat]);

  const handleInviteFriend = (friendId: string) => {
    console.log("🔍 DEBUG - Invite Friend Attempt:");
    console.log("- friendId:", friendId);
    console.log("- currentConversationId:", currentConversationId);
    console.log("- isGroupChat:", isGroupChat);
    
    if (!currentConversationId) {
      toast({
        title: "No conversation",
        description: "Start a conversation first before inviting friends.",
        variant: "destructive",
      });
      return;
    }
    
    inviteFriendMutation.mutate({ 
      conversationId: currentConversationId, 
      friendId 
    });
  };

  // If agent not found, redirect to agents page
  useEffect(() => {
    if (error && !agentLoading) {
      toast({
        title: "Agent not found",
        description: "The agent you're looking for doesn't exist.",
        variant: "destructive",
      });
      setLocation("/agents");
    }
  }, [error, agentLoading, setLocation, toast]);

  if (agentLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Loading agent...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="bg-black border-b border-white px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/agents">
            <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4" />
              Back to Agents
            </Button>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg">
              <Bot className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {isGroupChat ? `Group Chat with ${agent.name}` : agent.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {agent.category}
                </Badge>
                {isGroupChat && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Users className="h-3 w-3" />
                    {conversationParticipants.length} participants
                  </Badge>
                )}
                {agentWebsite?.websiteSlug && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-6 px-2 gap-1 bg-white border-white text-black hover:bg-gray-100"
                    onClick={() => window.open(`https://sharebrain.me/${agentWebsite.websiteSlug}`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Website
                  </Button>
                )}
                {agent.voiceEnabled && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Volume2 className="h-3 w-3" />
                    Voice
                  </Badge>
                )}
              </div>
              {isGroupChat && conversationParticipants.length > 0 && (
                <div className="text-xs text-white mt-1">
                  Participants: {conversationParticipants.map(p => p.name || p.handle || 'Unknown').join(', ')}
                </div>
              )}
            </div>
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            {/* Script Editing Button (only for agent owners) */}
            {ownership && typeof ownership === 'object' && 'canEdit' in ownership && (ownership as any).canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-white border-white hover:bg-gray-800"
                onClick={() => setShowScriptEditor(true)}
              >
                <Edit3 className="h-4 w-4" />
                Edit Script
              </Button>
            )}
            
            <Dialog open={showFriendDialog} onOpenChange={setShowFriendDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!currentConversationId}
                  className="gap-2 text-white border-white hover:bg-gray-800"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Friends
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Add Friends to Chat
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {contactsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : friends?.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-500">No friends to invite yet.</p>
                      <p className="text-sm text-slate-400 mt-2">
                        Add friends in your profile settings to invite them to chats.
                      </p>
                      <div className="mt-4 text-xs text-slate-400">
                        <p>Debug Info:</p>
                        <p>Total contacts: {contacts?.length || 0}</p>
                        <p>Filtered friends: {friends?.length || 0}</p>
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-60">
                      <div className="space-y-2">
                        {friends?.map((friend: any) => {
                          // Handle both contact formats
                          const friendId = friend.contactUserId || friend.id;
                          const friendName = friend.displayName || friend.name;
                          
                          return (
                            <div
                              key={friendId}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">
                                    {friendName?.[0] || "?"}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{friendName}</p>
                                  <p className="text-xs text-slate-500">Friend</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleInviteFriend(friendId)}
                                disabled={inviteFriendMutation.isPending}
                              >
                                {inviteFriendMutation.isPending ? "Inviting..." : "Invite"}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            <Button
              onClick={clearChat}
              variant="outline"
              size="sm"
              disabled={messages.length === 0}
            >
              Clear Chat
            </Button>
          </div>
        </div>
        
        {agent.description && (
          <p className="text-white mt-3 text-sm max-w-2xl line-clamp-2">
            {agent.description}
          </p>
        )}
        <p className="text-slate-600 mt-2 text-sm">
          If you need instructions, please type "instructions" into the chatbox.
        </p>
      </header>

      {/* Chat Interface */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col max-w-4xl mx-auto">
            {/* Website Link Banner - prominently displayed in welcome */}
            {agent.websiteUrl && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mx-6 mt-6">
                <div className="flex items-center justify-center gap-4">
                  <ExternalLink className="h-6 w-6 text-green-600" />
                  <div className="text-center">
                    <p className="font-semibold text-green-900 mb-1">Companion Website Available</p>
                    <p className="text-sm text-green-700 mb-3">Explore this agent's comprehensive knowledge base and travel guides</p>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => window.open(agent.websiteUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Website
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Welcome content */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="p-4 bg-slate-50 rounded-full mb-4">
                <Sparkles className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Start chatting with {agent.name}
              </h3>
              <p className="text-slate-600 mb-6 max-w-md">
                This agent is specialized in {agent.category.toLowerCase()}. 
                Ask a question or say hello to get started!
              </p>
              
            </div>
            
            {/* Fixed input at bottom */}
            <div className="border-t border-white p-4 bg-black">
              <div className="flex space-x-3 max-w-2xl mx-auto">
                <input
                  type="text"
                  placeholder={`Message ${agent.name}...`}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      handleSendMessage(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                  disabled={chatMutation.isPending}
                  className="flex-1 px-3 py-2 border border-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent bg-black text-white placeholder:text-gray-400"
                  style={{ backgroundColor: '#000000', color: '#ffffff' }}
                />
                <Button 
                  onClick={() => {
                    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                    if (input?.value.trim()) {
                      handleSendMessage(input.value);
                      input.value = "";
                    }
                  }}
                  disabled={chatMutation.isPending}
                  className="bg-primary hover:bg-blue-700 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            conversationId={currentConversationId || undefined}
            isLoading={chatMutation.isPending}
            placeholder={`Message ${agent.name}...`}
            agentId={agent.id}
            voiceEnabled={agent.voiceEnabled}
            imageEnabled={agent.imageEnabled}
          />
        )}
      </main>

      {/* Script Editing Interface */}
      {agent && (
        <ScriptEditingInterface
          agentId={agent.id}
          isOpen={showScriptEditor}
          onClose={() => setShowScriptEditor(false)}
          onScriptUpdated={() => {
            // Refresh agent data after script update
            // This will trigger a re-render with updated script information
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}