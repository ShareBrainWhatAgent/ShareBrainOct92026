import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { MessageCircle, Users, Bot, Clock, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

export default function Conversations() {
  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ["/api/unified-chat/conversations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/unified-chat/conversations");
      const data = await response.json();
      console.log("Conversations API response:", data);
      return data;
    },
  });

  console.log("Conversations state:", { conversations, isLoading, error });

  // Get all individual chat conversations (flatten the structure)
  const allChats = conversations ? conversations.flatMap((conversation: any) => {
    // For each conversation, create individual chat entries
    const participants = conversation.participants || [];
    const currentUserId = conversation.currentUserId;
    
    console.log("Processing conversation:", conversation.id, "participants:", participants, "currentUserId:", currentUserId);
    
    // Filter out current user from participants
    const otherParticipants = participants.filter((p: any) => p.id !== currentUserId);
    
    console.log("Other participants:", otherParticipants);
    
    // Create individual chats for each participant
    return otherParticipants.map((participant: any) => ({
      id: conversation.id,
      participantId: participant.userId || participant.agentId,
      participantName: participant.displayName || participant.name || "Unknown",
      participantType: participant.agentId ? 'agent' : 'user',
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount: conversation.unreadCount || 0,
      isAgent: !!participant.agentId,
      conversationId: conversation.id
    }));
  }) : [];

  console.log("All chats:", allChats);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Conversations</h1>
            <p className="text-slate-600 mt-1">View and manage all your conversations</p>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                    <div>
                      <div className="w-32 h-4 bg-slate-200 rounded mb-1"></div>
                      <div className="w-24 h-3 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  <div className="w-16 h-3 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!conversations || conversations.length === 0 || allChats.length === 0) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Chats</h1>
            <p className="text-slate-600 mt-1">Your recent conversations</p>
          </div>
          
          <div className="text-center py-12">
            <MessageCircle className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">No chats yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              Start chatting with friends or agents to see chats here.
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <Link href="/contacts">
                <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
                  View Contacts
                </button>
              </Link>
              <Link href="/agents">
                <button className="bg-white text-slate-700 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50">
                  View Agents
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Chats</h1>
          <p className="text-slate-600 mt-1">Your recent conversations</p>
        </div>
        
        <div className="space-y-3">
          {allChats.map((chat: any) => {
            return (
              <Link key={`${chat.conversationId}-${chat.participantId}`} href={`/unified-chat/${chat.conversationId}`}>
                <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          chat.isAgent ? 'bg-primary' : 'bg-slate-100'
                        }`}>
                          {chat.isAgent ? (
                            <Bot className="h-5 w-5 text-white" />
                          ) : (
                            <MessageCircle className="h-5 w-5 text-slate-600" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-slate-900 truncate">
                            {chat.participantName}
                          </h3>
                          {chat.isAgent && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              Agent
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span className="text-sm text-slate-500">
                            {chat.lastMessageAt 
                              ? formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true })
                              : 'No messages yet'
                            }
                          </span>
                        </div>
                        
                        {chat.lastMessage && (
                          <p className="text-sm text-slate-600 mt-1 truncate">
                            {chat.lastMessage}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {chat.unreadCount > 0 && (
                        <span className="bg-primary text-white text-xs font-medium px-2 py-1 rounded-full">
                          {chat.unreadCount}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}