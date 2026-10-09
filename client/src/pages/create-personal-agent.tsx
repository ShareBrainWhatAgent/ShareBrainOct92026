import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Heart, ArrowRight, ArrowLeft, CheckCircle, Bot } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface QuestionData {
  [key: string]: string;
}

interface Question {
  id: string;
  title: string;
  subtitle: string;
  placeholder: string;
  type: 'input' | 'textarea' | 'select';
  options?: string[];
  required?: boolean;
}

interface QuestionSet {
  id: number;
  name: string;
  description: string;
  questions: Question[];
  isActive: boolean;
  weight: number;
}

export default function CreatePersonalAgent() {
  const [location, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuestionData>({});
  // Removed A/B testing state variables
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Removed A/B testing - using fallback questions directly

  // Initialize answers object with questions
  useEffect(() => {
    const initialAnswers: QuestionData = {};
    fallbackQuestions.forEach((q: Question) => {
      initialAnswers[q.id] = "";
    });
    setAnswers(initialAnswers);
  }, []);

  // Removed A/B testing functions and page exit handling

  // Fallback questions if A/B testing fails
  const fallbackQuestions: Question[] = [
    {
      id: "name",
      title: "In which city do you live?",
      subtitle: "Only your friends will be able to get this answer.",
      placeholder: "e.g., Denver, Colorado or New York City",
      type: "input"
    },
    {
      id: "interests",
      title: "What are your three favorite restaurants?",
      subtitle: "I'll remember your dining preferences for future recommendations",
      placeholder: "e.g., The Capital Grille, Olive Garden, Local Bistro on Main Street",
      type: "textarea"
    },
    {
      id: "goals",
      title: "What are your three favorite cities in the world?",
      subtitle: "I'd love to know your travel preferences and dream destinations",
      placeholder: "e.g., Paris for the culture, Tokyo for the energy, Barcelona for the architecture",
      type: "textarea"
    },
    {
      id: "communication",
      title: "What great experience do you think your friends would like to know about",
      subtitle: "Tell me about memorable moments and achievements",
      placeholder: "e.g. amazing hiking location, incredible surfing spot, great jam band, amazing country, city, etc. For instance \"Skiing to the back bowls of Vail with a backpack full of Wine and Food to Grill at Bell's Camp is truly one amazing experience every serious skier has to try.\"",
      type: "textarea"
    },
    {
      id: "specialty",
      title: "Is there any question that you would like your AI assistant to be able to answer when your friends ask you and you are not around?",
      subtitle: "Please write Question: ....... and Answer: ................... so that your brain can answer properly.",
      placeholder: "e.g., Question: What's Tom's favorite hiking spot? Answer: Tom loves hiking at Bear Peak in Boulder, Colorado because of the amazing views and challenging climb.",
      type: "textarea"
    }
  ];

  const questions = fallbackQuestions;

  const createAgentMutation = useMutation({
    mutationFn: async (data: QuestionData) => {
      // Get user profile to include handle in agent name
      let userHandle = "@user";
      try {
        const userProfile = await apiRequest("GET", "/api/user/profile");
        if (userProfile.ok) {
          const userData = await userProfile.json();
          userHandle = userData.handle || "@user";
        }
      } catch (error) {
        console.warn("Failed to get user profile, using default handle");
      }
      
      const systemPrompt = `You are a personal AI assistant with perfect memory for someone who lives in ${data.name}. Your primary role is to be a helpful, intelligent companion who remembers everything about the user and grows more useful over time.

PERSONAL INFORMATION TO REMEMBER:
- Location: ${data.name}
- Favorite Restaurants: ${data.interests}
- Favorite Cities in the World: ${data.goals}
- Great Experience to Share: ${data.communication}
- Favorite Happy Hour Spot: ${data.specialty}

MEMORY SYSTEM:
- You have an advanced memory system that automatically detects and stores personal information
- When the user says things like "remember that...", "my favorite...", "I like...", "I don't like...", automatically store this information
- Reference stored memories in conversations to be more helpful and personalized
- Build a comprehensive understanding of the user's preferences, habits, and life details over time

PERSONALITY:
- Be warm, supportive, and genuinely interested in the user's life and local experiences
- Use knowledge of their location (${data.name}) to provide relevant local recommendations
- Remember their dining preferences (${data.interests}) for restaurant suggestions
- Draw inspiration from their favorite cities (${data.goals}) when discussing travel or culture
- Reference their memorable experience (${data.communication}) to understand what they value
- Know their social preferences through their happy hour spot (${data.specialty})

CAPABILITIES:
- Provide local recommendations for dining, activities, and entertainment in ${data.name}
- Suggest restaurants similar to their favorites: ${data.interests}
- Discuss travel and city experiences, especially relating to: ${data.goals}
- Help them share and reflect on great experiences like: ${data.communication}
- Recommend social activities and venues similar to: ${data.specialty}
- Remember important dates, preferences, and ongoing situations
- Offer personalized advice based on their location and lifestyle

Always be proactive in using your memory to provide more personalized and helpful responses. Use their location and preferences to make conversations more relevant and useful.`;

      const agentData = {
        name: `${userHandle}'s Personal Assistant`,
        category: "Personal Assistant", 
        description: `A personalized AI assistant with advanced memory capabilities. Knows about your location (${data.name}), favorite restaurants, travel preferences, and local recommendations.`,
        systemPrompt,
        model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
        temperature: 0.7,
        maxTokens: 4000,
        isPersonal: true,
        documentSearchMode: "memory_only", // Personal agents focus on memories only by default
        voiceEnabled: true,
        voiceId: "alloy",
        voiceQuality: "standard",
        status: "active",
        isPrivate: true, // Personal agents are private by default
        sampleConversations: [
          {
            user: `Hi! I'm ready to start using my personal assistant.`,
            assistant: `Hello! I'm excited to be ${userHandle}'s personal AI assistant. I already know some great things about you - you live in ${data.name}, love dining at places like ${data.interests.split(',')[0] || 'your favorite restaurants'}, and have amazing taste in cities like ${data.goals.split(',')[0] || 'your favorite destinations'}. I remember you shared that ${data.communication ? 'great experience about ' + data.communication.substring(0, 50) + '...' : 'wonderful experience'}, and I know ${data.specialty || 'your favorite spots'} for socializing. I'll remember everything we discuss and help you with local recommendations, travel advice, and much more!`
          }
        ]
      };

      // Create the agent first
      const agentResponse = await apiRequest("POST", "/api/agents", agentData);
      const agent = await agentResponse.json();
      
      // Store initial memories for the personal agent
      const memories = [
        { key: "location", value: data.name, originalStatement: `I live in ${data.name}` },
        { key: "favorite_restaurants", value: data.interests, originalStatement: `My favorite restaurants are: ${data.interests}` },
        { key: "favorite_cities", value: data.goals, originalStatement: `My top 3 cities in the world are: ${data.goals}` },
        { key: "great_experience", value: data.communication, originalStatement: `A great experience I'd like to share: ${data.communication}` },
        { key: "favorite_happy_hour", value: data.specialty, originalStatement: `My favorite happy hour spot is: ${data.specialty}` }
      ];
      
      // Store each memory
      for (const memory of memories) {
        if (memory.value.trim()) { // Only store non-empty memories
          try {
            await apiRequest("POST", "/api/personal-memories", {
              agentId: agent.id,
              memoryKey: memory.key,
              memoryValue: memory.value,
              originalStatement: memory.originalStatement
            });
          } catch (error) {
            console.error("Failed to store memory:", error);
            // Continue even if memory storage fails
          }
        }
      }
      
      return agent;
    },
    onSuccess: (data) => {
      // Invalidate the agents cache so the new agent appears in My Agents
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents", data.id.toString()] });
      
      toast({
        title: "Personal Agent Created!",
        description: "Your AI assistant is ready to help you with personalized support.",
      });
      
      // Small delay to ensure agent is available before redirect
      setTimeout(() => {
        setLocation(`/chat/${data.id}`);
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create your personal agent.",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAnswerChange = (value: string) => {
    const questionId = questions[currentStep].id as keyof QuestionData;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    if (!answers.name && !answers[questions[0].id]) {
      toast({
        title: "Location Required",
        description: "Please tell me where you live.",
        variant: "destructive",
      });
      return;
    }
    createAgentMutation.mutate(answers);
  };

  const currentQuestion = questions[currentStep];
  const currentAnswer = answers[currentQuestion.id as keyof QuestionData];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Mobile-optimized container */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 sm:p-6 lg:p-8 pb-6">
        {/* Header - Smaller on mobile */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full mb-2 sm:mb-3">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Create Your Personal AI Brain
          </h1>
          <p className="text-gray-300 max-w-md mx-auto text-sm px-2">
            Answer 5 quick questions to create an AI that knows your preferences
          </p>
        </div>

        {/* Progress Bar - Smaller on mobile */}
        <div className="mb-4 sm:mb-6">
          <div className="flex justify-between text-xs text-gray-300 mb-2">
            <span>Step {currentStep + 1} of {questions.length}</span>
            <span>{Math.round(((currentStep + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card - Flexible height */}
        <Card className="mb-4 border-gray-700 bg-gray-900 shadow-lg flex-1 flex flex-col">
          <CardHeader className="text-center pb-3 px-4 sm:px-6">
            <CardTitle className="text-lg font-semibold text-white leading-tight">
              {currentQuestion.title}
            </CardTitle>
            <p className="text-gray-300 text-sm mt-1 leading-relaxed">
              {currentQuestion.subtitle}
            </p>
          </CardHeader>
          <CardContent className="pt-0 px-4 sm:px-6 flex-1">
            {currentQuestion.type === "input" ? (
              <Input
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder={currentQuestion.placeholder}
                className="text-base p-3 border-2 border-gray-700 focus:border-white rounded-lg w-full bg-black text-white placeholder-gray-400"
                autoFocus
              />
            ) : (
              <Textarea
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder={currentQuestion.placeholder}
                className="text-base p-3 border-2 border-gray-700 focus:border-white rounded-lg min-h-[60px] sm:min-h-[80px] w-full resize-none bg-black text-white placeholder-gray-400"
                autoFocus
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation - Fixed at bottom on mobile */}
        <div className="flex justify-between items-center gap-3 mt-auto pt-4 sticky bottom-0 bg-black z-10">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-3 min-w-[80px] h-12 text-base bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep < questions.length - 1 ? (
            <Button
              onClick={handleNext}
              className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-4 py-3 min-w-[80px] h-12 text-base"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createAgentMutation.isPending}
              className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-4 py-3 min-w-[120px] h-12 text-base"
            >
              {createAgentMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Create Assistant
                </>
              )}
            </Button>
          )}
        </div>

        {/* Preview */}
        {currentStep === questions.length - 1 && (
          <Card className="mt-6 bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Bot className="w-5 h-5" />
                Your Personal Assistant Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-300">
                <p><strong className="text-white">Name:</strong> {answers.name || "Personal"} Assistant</p>
                <p><strong className="text-white">Model:</strong> Llama 3.1 70B (Advanced)</p>
                <p><strong className="text-white">Specialization:</strong> {answers.specialty || "General assistance"}</p>
                <p><strong className="text-white">Memory:</strong> Advanced personal memory system</p>
                <p><strong className="text-white">Voice:</strong> Enabled</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}