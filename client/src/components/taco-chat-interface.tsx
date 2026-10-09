import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MapPin, Star, Globe } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface TacoPlace {
  name: string;
  neighborhood: string;
  address: string;
  website?: string;
  city: string;
  distance?: number;
}

interface TacoChatInterfaceProps {
  agentId: number;
  agentName: string;
}

// Sample taco data inspired by TacoBrain
const sampleTacoPlaces: TacoPlace[] = [
  {
    name: "El Farolito",
    neighborhood: "Mission",
    address: "2779 Mission St., San Francisco, CA, 94110",
    website: "www.elfarolitosf.com",
    city: "San Francisco"
  },
  {
    name: "Tacos El Patron",
    neighborhood: "Mission",
    address: "1500 S. Van Ness Ave., San Francisco, CA, 94110",
    city: "San Francisco"
  },
  {
    name: "Sacred Taco",
    neighborhood: "Marina/Cow Hollow",
    address: "1875 Union St., San Francisco, CA, 94123",
    website: "https://www.sacredtacosf.com",
    city: "San Francisco"
  }
];

export function TacoChatInterface({ agentId, agentName }: TacoChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [showTacoPlaces, setShowTacoPlaces] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversation messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const response = await apiRequest('GET', `/api/conversations/${conversationId}/messages`);
      return response.json();
    },
    enabled: !!conversationId
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      const response = await apiRequest('POST', '/api/chat', {
        message: messageContent,
        agentId,
        conversationId
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }
      
      // Check if the message mentions tacos or restaurants to show recommendations
      if (message.toLowerCase().includes('taco') || 
          message.toLowerCase().includes('restaurant') ||
          message.toLowerCase().includes('recommend')) {
        setShowTacoPlaces(true);
      }
      
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversationId] });
      setMessage('');
    },
    onError: (error: any) => {
      toast({
        title: "Error sending message",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const TacoPlaceCard = ({ place }: { place: TacoPlace }) => (
    <Card className="mb-3 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              {place.name}
              <span className="text-sm font-normal text-amber-600">• {place.neighborhood}</span>
            </h3>
            <p className="text-gray-700 flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4 text-amber-600" />
              {place.address}
            </p>
            {place.website && (
              <p className="text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1 mt-2">
                <Globe className="h-4 w-4" />
                {place.website}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Header with TacoBrain styling */}
      <div className="bg-black text-white p-4 border-b border-gray-700">
        <div className="flex items-center justify-center">
          <div className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
            🌮
          </div>
          <h2 className="ml-3 text-xl font-bold">Tacos Assistant</h2>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-gray-900">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center text-gray-400">Loading conversation...</div>
          ) : !messages || messages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-4">🌮</div>
              <p>¡Hola! I'm your personal taco guide.</p>
              <p className="text-sm mt-2">Ask me about taco recommendations, restaurants, or share your preferences!</p>
            </div>
          ) : (
            messages.map((msg: Message) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-black text-white border border-white' 
                    : 'bg-white text-gray-900'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          
          {/* Show taco recommendations when relevant */}
          {showTacoPlaces && (
            <div className="bg-white rounded-lg p-4 mt-4">
              <h3 className="font-bold text-lg mb-3 text-gray-900 flex items-center gap-2">
                🌮 Recommended Taco Spots
              </h3>
              {sampleTacoPlaces.map((place, index) => (
                <TacoPlaceCard key={index} place={place} />
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowTacoPlaces(false)}
                className="mt-2"
              >
                Hide Recommendations
              </Button>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-black border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about tacos, share your preferences..."
            className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            disabled={sendMessageMutation.isPending}
          />
          <Button 
            type="submit" 
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        
        {/* TacoBrain-inspired action buttons */}
        <div className="flex gap-2 mt-3 justify-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setMessage("What are the best taco places near me?");
              setShowTacoPlaces(true);
            }}
            className="bg-blue-600 text-white border-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            Find Taco Places
          </Button>
        </div>
      </div>
    </div>
  );
}