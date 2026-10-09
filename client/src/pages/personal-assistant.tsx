import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import ChatInterface from '@/components/chat-interface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Brain, MessageCircle, Settings, Sparkles, Send } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Agent {
  id: number;
  name: string;
  description: string;
  category: string;
  isPersonal: boolean;
  userId: string;
}

export default function PersonalAssistant() {
  const [personalAgent, setPersonalAgent] = useState<Agent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all user agents to find personal assistant
  const { data: agents = [], isLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/agents');
      return response.json();
    }
  });

  // Find the user's personal assistant agent
  useEffect(() => {
    const existingPersonalAgent = agents.find(agent => agent.isPersonal);
    
    if (existingPersonalAgent) {
      setPersonalAgent(existingPersonalAgent);
    }
  }, [agents]);

  // Create personal assistant mutation
  const createPersonalAssistantMutation = useMutation({
    mutationFn: async () => {
      const personalAssistantData = {
        name: "My Personal Assistant",
        description: "Your dedicated AI companion that remembers your preferences and helps with daily tasks",
        category: "Personal",
        model: "GPT-4",
        temperature: 0.7,
        maxTokens: 2048,
        systemPrompt: "You are a thoughtful personal AI companion designed to remember and learn about the user's preferences, habits, and important information. When users share personal details like their favorite foods, hobbies, work, family, or preferences, remember this information and reference it in future conversations to provide personalized responses. Always be warm, supportive, and show genuine interest in the user's life. Ask follow-up questions about things they've shared previously to show you care and remember. You are here to assist with daily tasks, provide reminders, offer suggestions, and be a helpful companion.",
        sampleUser: "Remember that I prefer working in the mornings and my favorite coffee is a cappuccino",
        sampleAgent: "I'll remember that you're most productive in the mornings and that cappuccino is your favorite coffee! This helps me understand your routine better. Would you like me to suggest some morning productivity tips, or perhaps remind you about your coffee preferences when we discuss your daily schedule?",
        status: "active",
        isPersonal: true,
        isPrivate: true, // Personal assistants are private by default
        voiceEnabled: true,
        voiceType: "alloy"
      };

      const response = await apiRequest('POST', '/api/agents', personalAssistantData);
      return response.json();
    },
    onSuccess: (newAgent) => {
      setPersonalAgent(newAgent);
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({
        title: "Personal Assistant Created",
        description: "Your personal AI companion is ready to help and remember your preferences!",
      });
    },
    onError: (error: any) => {
      setIsCreating(false);
      toast({
        title: "Error creating Personal Assistant",
        description: error.message || "Failed to create your personal assistant",
        variant: "destructive",
      });
    },
  });

  const handleCreatePersonalAssistant = () => {
    setIsCreating(true);
    createPersonalAssistantMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Heart className="h-12 w-12 text-pink-500 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600">Loading your Personal Assistant...</p>
        </div>
      </div>
    );
  }

  if (!personalAgent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Personal Assistant</h1>
            <p className="text-xl text-gray-600">Your dedicated AI companion with permanent memory</p>
          </div>

          {/* Setup Card */}
          <Card className="max-w-2xl mx-auto bg-white shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-gray-900 flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-500" />
                Set Up Your Personal Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  Create your personal AI companion that will remember your preferences, 
                  help with daily tasks, and learn about you over time.
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <Brain className="h-8 w-8 text-pink-500 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900">Permanent Memory</h3>
                  <p className="text-sm text-gray-600">Remembers your preferences across all conversations</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <MessageCircle className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900">Personal Chat</h3>
                  <p className="text-sm text-gray-600">Dedicated space for your personal AI companion</p>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <Settings className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900">Customizable</h3>
                  <p className="text-sm text-gray-600">Adapts to your communication style and needs</p>
                </div>
              </div>

              {/* Create Button */}
              <div className="text-center">
                <Button 
                  onClick={handleCreatePersonalAssistant}
                  disabled={isCreating}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 text-lg font-medium rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Heart className="h-5 w-5 mr-2" />
                      Create My Personal Assistant
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 w-10 h-10 rounded-full flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{personalAgent.name}</h1>
              <p className="text-sm text-gray-600">Your personal AI companion with memory</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Brain className="h-4 w-4" />
            <span>Memory Enabled</span>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto h-full">
          <Card className="h-full bg-white shadow-lg border-0">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900">Chat with {personalAgent.name}</h3>
                <p className="text-sm text-gray-600">Your AI companion remembers everything you tell it</p>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="text-center text-gray-500 py-8">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-pink-400" />
                  <p className="text-lg mb-2">Start chatting with your Personal Assistant!</p>
                  <p className="text-sm mb-4">Try saying: "Remember that my favorite coffee is cappuccino"</p>
                  <div className="text-left bg-pink-50 rounded-lg p-4 max-w-md mx-auto">
                    <h4 className="font-medium text-pink-800 mb-2">Memory Examples:</h4>
                    <ul className="text-sm text-pink-700 space-y-1">
                      <li>• "Remember that I prefer working in the mornings"</li>
                      <li>• "My favorite restaurant is Pizza Palace"</li>
                      <li>• "I live in Denver, Colorado"</li>
                      <li>• "My birthday is March 15th"</li>
                      <li>• "I work at TechCorp as a developer"</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Type your message..." 
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && personalAgent?.id) {
                        window.location.href = `/chat/${personalAgent.id}`;
                      }
                    }}
                  />
                  <Button 
                    className="bg-pink-500 hover:bg-pink-600 text-white"
                    onClick={() => {
                      if (personalAgent?.id) {
                        window.location.href = `/chat/${personalAgent.id}`;
                      } else {
                        toast({
                          title: "Error",
                          description: "Personal Assistant not found. Please create one first.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-500">
                    Click send or press Enter to start chatting
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}