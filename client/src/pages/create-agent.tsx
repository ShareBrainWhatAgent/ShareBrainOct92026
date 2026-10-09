import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { insertAgentSchema } from "@shared/schema";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, useParams, Link } from "wouter";
import { Sparkles, User, Bot, BookOpen, Code, Briefcase, Heart, Utensils, Upload, Brain, Database, Edit3, Settings } from "lucide-react";
import { LanguageTeacherCreator } from "@/components/LanguageTeacherCreator";
import { ScriptEditingInterface } from "@/components/ScriptEditingInterface";

const createAgentSchema = insertAgentSchema.extend({
  name: z.string().min(1, "Agent name is required"),
  description: z.string().min(1, "Description is required"),
  systemPrompt: z.string().optional(),
  sampleUser: z.string().optional(),
  sampleAgent: z.string().optional(),
  voiceEnabled: z.boolean().optional(),
  voiceType: z.string().optional(),
  voiceModel: z.string().optional(),
  imageEnabled: z.boolean().optional(),
  imageModel: z.string().optional(),
  imageQuality: z.string().optional(),
  triggerKeywords: z.string().optional(),
  isPersonal: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  isCommunityAgent: z.boolean().optional(),
  hasSharedMemory: z.boolean().optional(),
});

type CreateAgentForm = z.infer<typeof createAgentSchema>;

// System prompt templates
const PROMPT_TEMPLATES = [
  {
    id: "minimal-agent",
    name: "Minimal Agent",
    icon: Bot,
    category: "Direct Model Access",
    description: "Clean slate agent for direct model conversations without behavioral constraints",
    systemPrompt: "",
    sampleUser: "Hello! What can you help me with?",
    sampleAgent: "Hello! I'm here to help with any questions or tasks you have. Feel free to ask me anything!"
  },
  {
    id: "customer-support",
    name: "Customer Support Agent",
    icon: User,
    category: "Customer Support",
    description: "Helpful customer service representative",
    systemPrompt: "You are a friendly and professional customer support agent with memory capabilities. Always be polite, empathetic, and solution-focused. Remember customer preferences, past issues, and communication styles to provide personalized service. Listen carefully to customer concerns, ask clarifying questions when needed, and provide clear, actionable solutions. If you can't resolve an issue immediately, explain the next steps and set proper expectations.",
    sampleUser: "My order hasn't arrived yet and I'm getting worried.",
    sampleAgent: "I understand your concern about your delayed order - that's definitely frustrating! Let me help you track down what's happening. Can you please provide me with your order number so I can look into the shipping details and give you an update?"
  },
  {
    id: "language-teacher",
    name: "Language Teacher",
    icon: BookOpen,
    category: "Research Helper",
    description: "Structured language teacher with complete 4-week curriculum and level progression",
    systemPrompt: `You are an enthusiastic LANGUAGE_NAME language teacher following a structured 500-word curriculum divided into 50 lessons of 10 words each.

UNIVERSAL CURRICULUM SYSTEM:
- ALL languages follow the EXACT same 500-word progression
- Each lesson contains exactly 10 words in the same order for every language
- This ensures consistent learning across all languages worldwide

LESSON NAVIGATION SYSTEM:
- When a user first opens this agent, assume they are a beginner and start with Lesson 1
- IMPORTANT: Always recognize and respond to lesson navigation commands:
  * "start with lesson 10" → Jump directly to lesson 10
  * "jump to lesson 5" → Begin at lesson 5
  * "begin at lesson 15" → Start with lesson 15
  * "go to lesson 1" → Return to lesson 1
  * "what lesson are we on?" → Tell them the current lesson number
  * "go back to lesson 8" → Return to lesson 8
  * "skip to lesson 20" → Jump to lesson 20
  * "start from the beginning" → Go to lesson 1

LESSON STRUCTURE SYSTEM:
- Default behavior: Start with Lesson 1 unless user specifies otherwise
- When user requests a specific lesson: "Starting with Lesson X (Words Y-Z):"
- Present exactly 10 words and 10 sentences for the requested lesson
- Universal Lesson 1 Words (translate to LANGUAGE_NAME):
  1. Hello/Hi, 2. Water, 3. Food, 4. House, 5. Friend, 6. Book, 7. Good, 8. Yes, 9. No, 10. Thank you

COMPLETE CURRICULUM OVERVIEW:
You have access to all 50 lessons (500 words total). Here's the complete curriculum:

Lesson 1 (Words 1-10): Hello/Hi, Water, Food, House, Friend, Book, Good, Yes, No, Thank you
Lesson 2 (Words 11-20): Please, Sorry, Help, Time, Money, Work, Home, Family, Love, Happy
Lesson 3 (Words 21-30): What, Where, When, How, Why, Who, Big, Small, Hot, Cold
Lesson 4 (Words 31-40): One, Two, Three, Four, Five, Many, Few, All, Some, None
Lesson 5 (Words 41-50): Go, Come, Stop, Walk, Run, Sit, Stand, Sleep, Wake, Eat

[Continue with all 50 lessons following the same pattern through Words 491-500]

PROGRESSION SYSTEM:
- After presenting any lesson, ask: "Are you ready for the next lesson?" or "Which lesson would you like next?"
- For any lesson: Create sentences that incorporate words from previous lessons where possible
- Always use spaced repetition - new sentences should include previous vocabulary
- If user requests a specific lesson number, jump directly to that lesson

SENTENCE CONSTRUCTION RULES:
- Lessons 1-10: Use only words 1-10
- Lessons 11-20: Use words 1-20, prioritizing review of words 1-10
- Lessons 21-30: Use words 1-30, prioritizing review of earlier words
- Pattern continues: Each new lesson incorporates previous vocabulary for reinforcement

IMPORTANT TEXT-TO-SPEECH FORMATTING RULES:
- When presenting words, NEVER use numbers (1., 2., 3.)
- Use natural speech patterns: "Here are the first 10 words: [word1], [word2], [word3]..."
- For sentences, present them naturally without numbering
- Always consider that your response will be read aloud by text-to-speech technology

INTERACTIVE LESSON ENHANCEMENT:
- After presenting any 10-word lesson, students may activate the "Interactive Lesson: Words + Voice + Images" feature
- This feature provides synchronized word-by-word pronunciation with visual learning through auto-generated images
- When students use this feature, they'll experience multimedia learning with progress tracking and pause/resume controls
- Continue to provide your standard lesson content - the interactive enhancement supplements your teaching
- Encourage students to try the interactive mode for enhanced vocabulary retention and pronunciation practice

FOCUSED LANGUAGE LEARNING:
- Provide clean, TTS-optimized lesson content focused on vocabulary and pronunciation
- Keep responses focused on words, sentences, and cultural explanations
- Concentrate on audio-based learning through text-to-speech pronunciation practice
- The interactive lesson feature integrates seamlessly with your standard teaching approach

CULTURAL CONTEXT:
- Provide cultural insights and context for words and phrases
- Correct mistakes gently and encouragingly
- Adapt to the student's level while maintaining the structured progression

LESSON TRACKING AND NAVIGATION:
- Always remember which lesson number you're currently teaching (1-50)
- Respond to navigation commands by jumping to the requested lesson
- When jumping to a specific lesson, confirm: "Starting with Lesson X (Words Y-Z):"
- Example: "Starting with Lesson 10 (Words 91-100): Essential Daily Life"
- Build each lesson on previous vocabulary through spaced repetition
- Allow users to move freely between lessons 1-50 as requested

Focus on creating a structured, consistent learning experience that builds vocabulary systematically while using TTS-optimized formatting.

Replace LANGUAGE_NAME with your target language when creating the agent.`,
    sampleUser: "Teach me my first Spanish lesson",
    sampleAgent: "¡Hola! Welcome to your Spanish lessons! Let's start with Week 1: Basic Greetings & Introductions. Here are your essential greetings: Hola (hello), adiós (goodbye), por favor (please), gracias (thank you), disculpe (excuse me). Let's practice: 'Hola, me llamo [your name]' (Hello, my name is [your name]). Try saying that! Are you ready to continue with more greetings?"
  },
  {
    id: "coding-mentor",
    name: "Coding Mentor",
    icon: Code,
    category: "Research Helper",
    description: "Patient programming instructor and code reviewer",
    systemPrompt: "You are an experienced programming mentor who loves teaching with memory capabilities. Remember the student's programming experience, preferred languages, and past topics covered. Break down complex concepts into simple steps, provide code examples, explain the 'why' behind solutions, and encourage best practices. Always be patient with beginners and offer multiple approaches when possible. Help debug issues by asking good questions.",
    sampleUser: "I'm getting an error in my JavaScript code and I don't understand why.",
    sampleAgent: "I'd be happy to help you debug that! Errors are a normal part of programming and great learning opportunities. Can you share the error message you're seeing and the code that's causing it? Also, what were you trying to accomplish when the error occurred?"
  },
  {
    id: "business-advisor",
    name: "Business Advisor",
    icon: Briefcase,
    category: "Content Creation",
    description: "Strategic business consultant and advisor",
    systemPrompt: "You are a knowledgeable business advisor with expertise across industries. Provide strategic insights, ask probing questions to understand context, offer practical solutions, and consider both short-term and long-term implications. Be direct but supportive, and always consider the resources and constraints of the business.",
    sampleUser: "Our startup is struggling with customer acquisition. What should we focus on?",
    sampleAgent: "Customer acquisition challenges are common for startups. Let's dig deeper: What's your current customer acquisition cost versus lifetime value? Which channels have you tried so far, and what were the results? Understanding your target customer and which channels they use most will help us prioritize the right strategies for your specific situation."
  },
  {
    id: "wellness-coach",
    name: "Wellness Coach",
    icon: Heart,
    category: "Customer Support",
    description: "Supportive health and wellness guide",
    systemPrompt: "You are a compassionate wellness coach focused on holistic health. Provide encouragement, practical tips for physical and mental wellbeing, and help users build sustainable healthy habits. Always remind users to consult healthcare professionals for medical concerns. Be supportive and non-judgmental.",
    sampleUser: "I'm feeling stressed and overwhelmed lately. Any advice?",
    sampleAgent: "I hear you - feeling overwhelmed is really tough. Let's start with some immediate relief: try taking 5 deep breaths right now, breathing in for 4 counts and out for 6. For ongoing stress management, what does your current sleep and exercise routine look like? Small changes in these areas can make a big difference."
  },
  {
    id: "creative-writer",
    name: "Creative Writing Assistant",
    icon: Sparkles,
    category: "Content Creation",
    description: "Imaginative writing helper and storyteller",
    systemPrompt: "You are a creative writing assistant who loves storytelling in all forms. Help users brainstorm ideas, develop characters, craft compelling plots, and refine their writing style. Offer specific suggestions, ask thought-provoking questions, and encourage experimentation. Celebrate creativity while providing constructive feedback.",
    sampleUser: "I want to write a short story but I'm stuck on the opening.",
    sampleAgent: "Writer's block at the beginning is so common! Let's get your creativity flowing. What genre or mood are you going for? Sometimes starting in the middle of action works better than setting the scene. What if your main character is in the middle of doing something unexpected when we first meet them? What would surprise your readers?"
  },
  {
    id: "recipe-chef",
    name: "Recipe Chef",
    icon: Utensils,
    category: "Content Creation",
    description: "Culinary expert and cooking instructor",
    systemPrompt: "You are an experienced chef who loves sharing culinary knowledge. Help users with recipes, cooking techniques, ingredient substitutions, and meal planning. Provide clear step-by-step instructions, explain cooking principles, and adapt recipes based on dietary restrictions or available ingredients. Make cooking approachable and fun.",
    sampleUser: "I want to make dinner but only have chicken, rice, and some vegetables. Any ideas?",
    sampleAgent: "Perfect! You have the foundation for a delicious meal. What vegetables do you have? A simple chicken stir-fry over rice is always great - cook the chicken first, then the harder vegetables, add softer ones last. Do you have any soy sauce, garlic, or ginger? Even just salt, pepper, and a bit of oil can make something tasty!"
  },
  {
    id: "personal-assistant",
    name: "Personal Assistant",
    icon: Bot,
    category: "Customer Support",
    description: "Organized helper for daily tasks and planning",
    systemPrompt: "You are an efficient and organized personal assistant. Help users manage their time, plan tasks, set priorities, and stay organized. Provide practical solutions, break down complex projects into manageable steps, and offer productivity tips. Be proactive in suggesting improvements and always respect the user's preferences and constraints.",
    sampleUser: "I have so many things to do this week and don't know where to start.",
    sampleAgent: "Let's get you organized! First, let's do a brain dump - tell me everything you need to accomplish this week, don't worry about order yet. Then we'll prioritize by importance and deadlines. What are the most time-sensitive items, and which ones would have the biggest impact if completed first?"
  },
  {
    id: "personal-agent",
    name: "Personal Agent",
    icon: Heart,
    category: "Personal",
    description: "AI companion that remembers your preferences and personal information across conversations",
    systemPrompt: "You are a thoughtful personal AI companion designed to remember and learn about the user's preferences, habits, and important information. When users share personal details like their favorite foods, hobbies, work, family, or preferences, remember this information and reference it in future conversations to provide personalized responses. Always be warm, supportive, and show genuine interest in the user's life. Ask follow-up questions about things they've shared previously to show you care and remember.",
    sampleUser: "Remember that my favorite restaurant is Tony's Italian Bistro downtown",
    sampleAgent: "I'll remember that Tony's Italian Bistro downtown is your favorite restaurant! I'd love to know more about what makes it special to you - is it a particular dish you love there, the atmosphere, or maybe it holds special memories? I'll make sure to suggest it when you're looking for dining recommendations."
  },
  {
    id: "tacos-agent",
    name: "Tacos",
    icon: Heart,
    category: "Food & Dining",
    description: "Personal taco enthusiast who remembers your taco preferences and helps you discover amazing taco spots",
    systemPrompt: "You are Tacos, a passionate personal taco enthusiast and guide! You have extensive knowledge about taco restaurants, authentic Mexican cuisine, and the best taco spots across different cities. You remember users' taco preferences, dietary restrictions, spice tolerance, and favorite taco styles. Help users discover new taco places, recommend dishes based on their tastes, and share interesting facts about tacos and Mexican cuisine. You're enthusiastic, knowledgeable, and always excited to talk about tacos! When users share their taco experiences or preferences, remember them for future recommendations.",
    sampleUser: "I love street tacos but I can't handle spicy food. What would you recommend?",
    sampleAgent: "Perfect! I'll remember that you love street tacos but prefer mild flavors. For authentic street tacos without the heat, I'd recommend carnitas (slow-cooked pork), carne asada (grilled beef), or al pastor (marinated pork) - just ask for them without salsa or with salsa verde on the side. These are traditional, flavorful options that won't overwhelm your taste buds. Have you tried any specific taco places before, or are you looking for recommendations in your area?"
  }
];

export default function CreateAgent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const params = useParams();
  const [temperatureValue, setTemperatureValue] = useState([0.7]);
  const [activeTab, setActiveTab] = useState("basic-info");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [websiteAnalysis, setWebsiteAnalysis] = useState<any>(null);
  const [analyzingWebsite, setAnalyzingWebsite] = useState(false);
  const [showWebsiteStep, setShowWebsiteStep] = useState(false);
  
  const isEditing = Boolean(params.id);
  const agentId = params.id ? parseInt(params.id) : null;

  // Function to apply a template
  const applyTemplate = (templateId: string) => {
    const template = PROMPT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      form.setValue("name", template.name);
      form.setValue("description", template.description);
      form.setValue("category", template.category as any);
      form.setValue("systemPrompt", template.systemPrompt);
      form.setValue("sampleUser", template.sampleUser);
      form.setValue("sampleAgent", template.sampleAgent);
      // Set isPersonal to true for Personal Agent and Tacos Agent templates
      form.setValue("isPersonal", templateId === "personal-agent" || templateId === "tacos-agent");
      // Set isPrivate to true for Personal Agent and Tacos Agent templates
      form.setValue("isPrivate", templateId === "personal-agent" || templateId === "tacos-agent");
      setSelectedTemplate(templateId);
    }
  };

  // Function to analyze website
  const analyzeWebsite = async () => {
    if (!websiteUrl) {
      toast({
        title: "URL Required",
        description: "Please enter a website URL to analyze",
        variant: "destructive",
      });
      return;
    }

    setAnalyzingWebsite(true);
    try {
      const response = await apiRequest("POST", "/api/analyze-website", { url: websiteUrl });
      const analysis = await response.json();
      
      setWebsiteAnalysis(analysis);
      
      // Auto-populate form fields from analysis
      if (analysis.suggested_agent_name) {
        form.setValue("name", analysis.suggested_agent_name);
      }
      if (analysis.suggested_description) {
        form.setValue("description", analysis.suggested_description);
      }
      
      // Generate system prompt with Q&A pairs
      if (analysis.questions_and_answers && analysis.questions_and_answers.length > 0) {
        const qaText = analysis.questions_and_answers
          .map((qa: any) => `Q: ${qa.question}\nA: ${qa.answer}`)
          .join('\n\n');
        
        const systemPrompt = `You are an AI assistant representing this business. Use the following information to answer questions accurately:

${analysis.business_summary}

Key Information:
${qaText}

Always respond in a helpful, professional manner and stay focused on information related to this business.`;
        
        form.setValue("systemPrompt", systemPrompt);
      }
      
      toast({
        title: "Website Analyzed",
        description: `Generated ${analysis.questions_and_answers?.length || 0} Q&A pairs from your website`,
      });
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze website",
        variant: "destructive",
      });
    } finally {
      setAnalyzingWebsite(false);
    }
  };

  // Function to apply website analysis to form
  const applyWebsiteAnalysis = () => {
    if (!websiteAnalysis) return;
    
    const qaText = websiteAnalysis.questions_and_answers
      .map((qa: any) => `Q: ${qa.question}\nA: ${qa.answer}`)
      .join('\n\n');
    
    const systemPrompt = `You are an AI assistant representing this business. Use the following information to answer questions accurately:

${websiteAnalysis.business_summary}

Key Information:
${qaText}

Always respond in a helpful, professional manner and stay focused on information related to this business.`;
    
    form.setValue("systemPrompt", systemPrompt);
    
    // Set sample conversation
    if (websiteAnalysis.questions_and_answers.length > 0) {
      const firstQA = websiteAnalysis.questions_and_answers[0];
      form.setValue("sampleUser", firstQA.question);
      form.setValue("sampleAgent", firstQA.answer);
    }
  };

  // Fetch existing agent data if editing
  const { data: existingAgent, isLoading: isLoadingAgent } = useQuery({
    queryKey: [`/api/agents/${agentId}`],
    enabled: isEditing && Boolean(agentId),
  });

  const form = useForm<CreateAgentForm>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "Customer Support",
      model: "gpt-4o",
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: "",
      sampleUser: "",
      sampleAgent: "",
      status: "draft",
      isTemplate: false,
      voiceEnabled: false,
      voiceType: "alloy",
      voiceModel: "tts-1",
      imageEnabled: false,
      imageModel: "dall-e-3",
      imageQuality: "standard",
      triggerKeywords: "",
      isPersonal: false,
      isPrivate: false,
      isCommunityAgent: false,
      documentSearchMode: "documents_memory_and_general",
    },
  });

  // Watch for model selection changes
  const selectedModel = form.watch("model");
  const isLlamaModel = selectedModel?.includes("Llama");

  // Load existing agent data into form when editing
  useEffect(() => {
    if (existingAgent && isEditing && typeof existingAgent === 'object' && 'name' in existingAgent) {
      console.log('Loading existing agent data:', existingAgent);
      console.log('System prompt:', (existingAgent as any).systemPrompt);
      
      const agent = existingAgent as any;
      
      // Use reset to properly update the form with all values
      form.reset({
        name: agent.name,
        description: agent.description,
        category: agent.category,
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        systemPrompt: agent.systemPrompt || "",
        sampleUser: agent.sampleUser || "",
        sampleAgent: agent.sampleAgent || "",
        voiceEnabled: agent.voiceEnabled || false,
        voiceType: agent.voiceType || "alloy", 
        voiceModel: agent.voiceModel || "tts-1",
        triggerKeywords: agent.triggerKeywords || "",
        status: agent.status,
        isTemplate: agent.isTemplate || false,
        isPrivate: agent.isPrivate || false,
        hasSharedMemory: agent.hasSharedMemory || false,
        isCommunityAgent: agent.isCommunityAgent || false,
        documentSearchMode: agent.documentSearchMode || "documents_memory_and_general",
      });
      
      // Also update the temperature slider state
      setTemperatureValue([agent.temperature]);
    }
  }, [existingAgent, isEditing, form]);

  const createAgentMutation = useMutation({
    mutationFn: async (data: CreateAgentForm) => {
      const url = isEditing ? `/api/agents/${agentId}` : "/api/agents";
      const method = isEditing ? "PUT" : "POST";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      if (agentId) {
        queryClient.invalidateQueries({ queryKey: [`/api/agents/${agentId}`] });
      }
      toast({
        title: isEditing ? "Agent updated successfully" : "Agent created successfully",
        description: isEditing ? "Your agent has been updated and saved." : "Your new AI agent has been created and saved.",
      });
      setLocation("/agents");
    },
    onError: (error: any) => {
      console.error("Agent creation error:", error);
      toast({
        title: isEditing ? "Error updating agent" : "Error creating agent",
        description: error.message || `Failed to ${isEditing ? 'update' : 'create'} agent. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateAgentForm) => {
    console.log("Submitting agent data:", data);
    createAgentMutation.mutate(data);
  };

  const saveAsDraft = () => {
    const data = form.getValues();
    createAgentMutation.mutate({ ...data, status: "draft" });
  };

  const testAgent = () => {
    const data = form.getValues();
    createAgentMutation.mutate({ ...data, status: "testing" });
  };

  const createAndActivate = () => {
    const data = form.getValues();
    createAgentMutation.mutate({ ...data, status: "active" });
  };

  const getTemperatureLabel = (value: number) => {
    if (value <= 0.3) return "Conservative";
    if (value <= 0.7) return "Balanced";
    return "Creative";
  };

  return (
    <>
      {/* Header */}
      <header className="bg-black border-b border-slate-200 px-6 py-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{isEditing ? 'Edit Agent' : 'Create Agent'}</h2>
          <p className="text-white mt-1">{isEditing ? 'Update your AI agent configuration' : 'Build a new AI agent with custom configuration'}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl">
          <Card>
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-white">{isEditing ? 'Edit Agent' : 'Create New Agent'}</h3>
              <p className="text-white mt-1">{isEditing ? 'Update your agent configuration and prompts' : 'Configure your AI agent with custom parameters and prompts'}</p>
            </div>
            
            <CardContent className="p-6">
              {/* Tabs for editing mode only */}
              {isEditing ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic-info" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Basic Info
                    </TabsTrigger>
                    <TabsTrigger value="script-editor" className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4" />
                      Script Editor
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic-info">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Website Analysis Section - Only show when creating new agents */}
                  {!isEditing && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium text-white">Website Analysis (Optional)</Label>
                        <p className="text-sm text-white mt-1">Enter your website URL to automatically generate training content for your agent</p>
                      </div>
                      
                      <div className="flex gap-3">
                        <Input
                          placeholder="yourwebsite.com or https://yourwebsite.com"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          className="flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
                        />
                        <Button
                          type="button"
                          onClick={analyzeWebsite}
                          disabled={analyzingWebsite || !websiteUrl}
                          className="px-6"
                        >
                          {analyzingWebsite ? (
                            <>
                              <Brain className="h-4 w-4 mr-2 animate-pulse" />
                              Analyzing...
                            </>
                          ) : (
                            "Analyze Website"
                          )}
                        </Button>
                      </div>
                      
                      {websiteAnalysis && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-1 bg-green-100 rounded">
                              <Brain className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-green-900">Website Analysis Complete</h4>
                              <p className="text-sm text-green-700 mt-1">
                                Generated {websiteAnalysis.questions_and_answers?.length || 0} Q&A pairs from your website
                              </p>
                              <p className="text-sm text-green-600 mt-1">
                                {websiteAnalysis.business_summary}
                              </p>
                              
                              <div className="mt-3 space-y-2">
                                <p className="text-sm font-medium text-green-900">Sample Questions:</p>
                                {websiteAnalysis.questions_and_answers?.slice(0, 3).map((qa: any, index: number) => (
                                  <p key={index} className="text-xs text-green-700">• {qa.question}</p>
                                ))}
                              </div>
                              
                              <Button
                                type="button"
                                onClick={applyWebsiteAnalysis}
                                size="sm"
                                className="mt-3"
                              >
                                Apply to Agent
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Language Teacher Creator - Special Enhanced Interface */}
                  {!isEditing && (
                    <LanguageTeacherCreator
                      onApplyTemplate={(templateData) => {
                        Object.keys(templateData).forEach((key) => {
                          form.setValue(key as any, templateData[key]);
                        });
                        setSelectedTemplate("language-teacher");
                        
                        // Automatically submit the form after applying template
                        setTimeout(() => {
                          const formData = form.getValues();
                          createAgentMutation.mutate({ ...formData, status: "active" });
                        }, 100);
                      }}
                    />
                  )}

                  {/* Template Selection - Only show when creating new agents */}
                  {!isEditing && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium text-white">Choose a Template (Optional)</Label>
                        <p className="text-sm text-white mt-1">Select a pre-built template to get started quickly, or create from scratch</p>
                      </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {PROMPT_TEMPLATES.map((template) => {
                        const IconComponent = template.icon;
                        return (
                          <Card 
                            key={template.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              selectedTemplate === template.id 
                                ? 'ring-2 ring-blue-500 bg-blue-50' 
                                : 'hover:bg-slate-50'
                            }`}
                            onClick={() => applyTemplate(template.id)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg">
                                  <IconComponent className="h-5 w-5 text-slate-600" />
                                </div>
                                <div>
                                  <CardTitle className="text-sm font-medium text-white">{template.name}</CardTitle>
                                  <p className="text-xs text-white">{template.category}</p>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-xs text-white leading-relaxed">{template.description}</p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    
                      {selectedTemplate && (
                        <div className="flex items-center gap-2 text-sm text-white">
                          <Sparkles className="h-4 w-4" />
                          Template applied! You can customize the fields below.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agent Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Customer Support Bot" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Direct Model Access">Direct Model Access</SelectItem>
                              <SelectItem value="Customer Support">Customer Support</SelectItem>
                              <SelectItem value="Content Creation">Content Creation</SelectItem>
                              <SelectItem value="Data Analysis">Data Analysis</SelectItem>
                              <SelectItem value="Sales Assistant">Sales Assistant</SelectItem>
                              <SelectItem value="Research Helper">Research Helper</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what your agent does and its primary purpose" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="triggerKeywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trigger Keywords (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., happy hour, cocktails, drinks (comma-separated)" 
                            {...field} 
                          />
                        </FormControl>
                        <p className="text-xs text-white mt-1">
                          Keywords that will trigger this agent in Master Agent conversations. Separate multiple keywords with commas.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Model Configuration */}
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="text-md font-semibold text-white mb-4">Model Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>AI Model</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                <SelectItem value="Llama 3.1 405B">Llama 3.1 405B (Supports document upload)</SelectItem>
                                <SelectItem value="Llama 3.1 70B">Llama 3.1 70B (Supports document upload)</SelectItem>
                                <SelectItem value="Llama 3.1 8B">Llama 3.1 8B (Supports document upload)</SelectItem>
                                <SelectItem value="Claude-3 Opus">Claude-3 Opus</SelectItem>
                                <SelectItem value="Claude-3 Sonnet">Claude-3 Sonnet</SelectItem>
                                <SelectItem value="Gemini Pro">Gemini Pro</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="temperature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Temperature: {getTemperatureLabel(temperatureValue[0])}</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Slider
                                  value={temperatureValue}
                                  onValueChange={(value) => {
                                    setTemperatureValue(value);
                                    field.onChange(value[0]);
                                  }}
                                  max={1}
                                  min={0}
                                  step={0.1}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-white">
                                  <span>Conservative</span>
                                  <span>Balanced</span>
                                  <span>Creative</span>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="maxTokens"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Tokens</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Voice Settings */}
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="text-md font-semibold text-white mb-4">Voice Settings</h4>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="voiceEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-3">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value || false}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                                className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
                              />
                            </FormControl>
                            <div>
                              <FormLabel className="text-sm font-medium">Enable Text-to-Speech</FormLabel>
                              <p className="text-xs text-white">Allow this agent to speak responses using OpenAI's voice synthesis</p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      {form.watch("voiceEnabled") && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="voiceType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Voice Type</FormLabel>
                                <FormControl>
                                  <Select onValueChange={field.onChange} value={field.value || "alloy"}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select voice type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                                      <SelectItem value="echo">Echo (Masculine)</SelectItem>
                                      <SelectItem value="fable">Fable (British)</SelectItem>
                                      <SelectItem value="onyx">Onyx (Deep)</SelectItem>
                                      <SelectItem value="nova">Nova (Feminine)</SelectItem>
                                      <SelectItem value="shimmer">Shimmer (Soft)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="voiceModel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Voice Quality</FormLabel>
                                <FormControl>
                                  <Select onValueChange={field.onChange} value={field.value || "tts-1"}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select voice quality" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="tts-1">Standard (Faster)</SelectItem>
                                      <SelectItem value="tts-1-hd">HD (Higher Quality)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image Generation Settings */}
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="text-md font-semibold text-slate-900 mb-4">Image Generation Settings</h4>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="imageEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-3">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value || false}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                                className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
                              />
                            </FormControl>
                            <div>
                              <FormLabel className="text-sm font-medium">Enable Image Generation</FormLabel>
                              <p className="text-xs text-white">Allow this agent to generate images using DALL-E 3</p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      {form.watch("imageEnabled") && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="imageModel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Image Model</FormLabel>
                                <FormControl>
                                  <Select onValueChange={field.onChange} value={field.value || "dall-e-3"}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select image model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="dall-e-3">DALL-E 3 (Latest)</SelectItem>
                                      <SelectItem value="dall-e-2">DALL-E 2 (Faster)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="imageQuality"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Image Quality</FormLabel>
                                <FormControl>
                                  <Select onValueChange={field.onChange} value={field.value || "standard"}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select image quality" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="standard">Standard (Faster)</SelectItem>
                                      <SelectItem value="hd">HD (Higher Quality)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Upload - Only for Llama Models */}
                  {isLlamaModel && (
                    <div className="border-t border-slate-200 pt-6">
                      <h4 className="text-md font-semibold text-slate-900 mb-4 flex items-center">
                        <Upload className="h-5 w-5 mr-2" />
                        Document Upload Available
                      </h4>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <Upload className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <h5 className="font-medium text-blue-900 mb-1">Enhanced Knowledge Base</h5>
                            <p className="text-sm text-blue-700 mb-3">
                              Llama models support document upload for enhanced knowledge. Upload PDFs, text files, JSON, and more to create a specialized knowledge base for your agent.
                            </p>
                            <p className="text-xs text-blue-600">
                              After creating your agent, use the "Documents" link to upload files and build your agent's knowledge base.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Prompt Engineering */}
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="text-md font-semibold text-slate-900 mb-4">Prompt Engineering</h4>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="systemPrompt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>System Prompt <span className="text-slate-400 font-normal">(Optional)</span></FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Leave empty for direct model access, or define specific behavior (e.g., 'You are a helpful assistant specialized in...')"
                                rows={6}
                                className="font-mono text-sm"
                                {...field} 
                              />
                            </FormControl>
                            <p className="text-xs text-white mt-1">Optional: Define the agent's role, behavior, and expertise. Leave empty for minimal prompting.</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">Sample Conversation</Label>
                        <div className="space-y-3">
                          <FormField
                            control={form.control}
                            name="sampleUser"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex space-x-3">
                                  <span className="text-sm font-medium text-white w-12 mt-2">User:</span>
                                  <FormControl>
                                    <Input 
                                      placeholder="Example user input"
                                      className="flex-1 text-sm"
                                      value={field.value || ""}
                                      onChange={field.onChange}
                                      onBlur={field.onBlur}
                                      name={field.name}
                                      ref={field.ref}
                                    />
                                  </FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="sampleAgent"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex space-x-3">
                                  <span className="text-sm font-medium text-white w-12 mt-2">Agent:</span>
                                  <FormControl>
                                    <Input 
                                      placeholder="Expected agent response"
                                      className="flex-1 text-sm"
                                      value={field.value || ""}
                                      onChange={field.onChange}
                                      onBlur={field.onBlur}
                                      name={field.name}
                                      ref={field.ref}
                                    />
                                  </FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <p className="text-xs text-white mt-1">Provide examples to guide the agent's response style</p>
                      </div>
                    </div>
                  </div>

                  {/* Knowledge & Memory Configuration */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Knowledge & Memory Configuration</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Configure how your agent uses uploaded documents and personal memories</p>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="documentSearchMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Search Mode</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select search mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="documents_memory_and_general">
                                <div className="flex items-center space-x-2">
                                  <Database className="h-4 w-4" />
                                  <div>
                                    <p className="font-medium">Documents, Memory & General Knowledge</p>
                                    <p className="text-sm text-gray-500">Use all available sources (recommended)</p>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="documents_and_memory_only">
                                <div className="flex items-center space-x-2">
                                  <BookOpen className="h-4 w-4" />
                                  <div>
                                    <p className="font-medium">Documents & Memory Only</p>
                                    <p className="text-sm text-gray-500">Focus on uploaded documents and personal memories</p>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="memory_only">
                                <div className="flex items-center space-x-2">
                                  <Brain className="h-4 w-4" />
                                  <div>
                                    <p className="font-medium">Memory Only</p>
                                    <p className="text-sm text-gray-500">Use only personal memories</p>
                                  </div>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100">Knowledge Base Features</h4>
                          <ul className="text-sm text-blue-800 dark:text-blue-200 mt-1 space-y-1">
                            <li>• Upload documents (PDF, TXT, MD, DOCX, JSON) to create a custom knowledge base</li>
                            <li>• Personal memories are automatically captured and stored from conversations</li>
                            <li>• AI semantic search finds relevant information from your documents</li>
                            <li>• Choose how your agent balances different information sources</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="text-md font-semibold text-slate-900 mb-4">Privacy Settings</h4>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="isPrivate"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-3">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value || false}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                                className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
                              />
                            </FormControl>
                            <div>
                              <FormLabel className="text-sm font-medium">Private Agent</FormLabel>
                              <p className="text-xs text-slate-600">Private agents are only visible to you and cannot be accessed via the external API</p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="hasSharedMemory"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-3">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value || false}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                                className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
                              />
                            </FormControl>
                            <div>
                              <FormLabel className="text-sm font-medium">Shared Memory Agent</FormLabel>
                              <p className="text-xs text-slate-600">Enable collective learning - this agent will remember information from all users and share knowledge across everyone</p>
                            </div>
                          </FormItem>
                        )}
                      />


                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-slate-200 pt-6 flex justify-end space-x-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={saveAsDraft}
                      disabled={createAgentMutation.isPending}
                    >
                      Save as Draft
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary"
                      onClick={testAgent}
                      disabled={createAgentMutation.isPending}
                    >
                      Test Agent
                    </Button>
                    <Button 
                      type="button"
                      onClick={createAndActivate}
                      disabled={createAgentMutation.isPending}
                      className="bg-primary hover:bg-blue-700 text-white"
                    >
                      {createAgentMutation.isPending ? "Creating..." : "Create Agent"}
                    </Button>
                        </div>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  <TabsContent value="script-editor">
                    <div className="mt-6">
                      {existingAgent && typeof existingAgent === 'object' && 'id' in existingAgent ? (
                        <ScriptEditingInterface
                          agentId={(existingAgent as any).id}
                          isOpen={true}
                          onClose={() => {}}
                          onScriptUpdated={() => {
                            // Refresh the agent data
                            queryClient.invalidateQueries({ queryKey: [`/api/agents/${(existingAgent as any).id}`] });
                            toast({
                              title: "Script Updated",
                              description: "Agent script has been successfully updated.",
                            });
                          }}
                        />
                      ) : (
                        <div className="text-white text-center py-8">
                          Script editing is only available for existing agents.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Website Analysis Section - Only show when creating new agents */}
                    {!isEditing && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-base font-medium text-white">Website Analysis (Optional)</Label>
                          <p className="text-sm text-white mt-1">Enter your website URL to automatically generate training content for your agent</p>
                        </div>
                        
                        <div className="flex gap-3">
                          <Input
                            placeholder="yourwebsite.com or https://yourwebsite.com"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            className="flex-1"
                            onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
                          />
                          <Button
                            type="button"
                            onClick={analyzeWebsite}
                            disabled={analyzingWebsite || !websiteUrl}
                            className="px-6"
                          >
                            {analyzingWebsite ? (
                              <>
                                <Brain className="h-4 w-4 mr-2 animate-pulse" />
                                Analyzing...
                              </>
                            ) : (
                              "Analyze Website"
                            )}
                          </Button>
                        </div>
                        
                        {websiteAnalysis && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-1 bg-green-100 rounded">
                                <Brain className="h-4 w-4 text-green-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-green-900">Website Analysis Complete</h4>
                                <p className="text-sm text-green-700 mt-1">
                                  Generated {websiteAnalysis.questions_and_answers?.length || 0} Q&A pairs from your website
                                </p>
                                <p className="text-sm text-green-600 mt-1">
                                  {websiteAnalysis.business_summary}
                                </p>
                                
                                <div className="mt-3 space-y-2">
                                  <p className="text-sm font-medium text-green-900">Sample Questions:</p>
                                  {websiteAnalysis.questions_and_answers?.slice(0, 3).map((qa: any, index: number) => (
                                    <p key={index} className="text-xs text-green-700">• {qa.question}</p>
                                  ))}
                                </div>
                                
                                <Button
                                  type="button"
                                  onClick={applyWebsiteAnalysis}
                                  size="sm"
                                  className="mt-3"
                                >
                                  Apply to Agent
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Language Teacher Creator - Special Enhanced Interface */}
                    {!isEditing && (
                      <LanguageTeacherCreator
                        onApplyTemplate={(templateData) => {
                          Object.keys(templateData).forEach((key) => {
                            form.setValue(key as any, templateData[key]);
                          });
                          setSelectedTemplate("language-teacher");
                          
                          // Don't auto-submit - let user choose action
                          // Removed automatic form submission to prevent duplicate agents
                        }}
                      />
                    )}

                    {/* Template Selection - Only show when creating new agents */}
                    {!isEditing && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-base font-medium text-white">Choose a Template (Optional)</Label>
                          <p className="text-sm text-white mt-1">Select a pre-built template to get started quickly, or create from scratch</p>
                        </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {PROMPT_TEMPLATES.map((template) => {
                          const IconComponent = template.icon;
                          return (
                            <Card 
                              key={template.id}
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                selectedTemplate === template.id 
                                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                                  : 'hover:bg-slate-50'
                              }`}
                              onClick={() => applyTemplate(template.id)}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-slate-100 rounded-lg">
                                    <IconComponent className="h-5 w-5 text-slate-600" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-sm font-medium text-white">{template.name}</CardTitle>
                                    <p className="text-xs text-white">{template.category}</p>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <p className="text-xs text-white leading-relaxed">{template.description}</p>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                      
                        {selectedTemplate && (
                          <div className="flex items-center gap-2 text-sm text-white">
                            <Sparkles className="h-4 w-4" />
                            Template applied! You can customize the fields below.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agent Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Customer Support Bot" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Direct Model Access">Direct Model Access</SelectItem>
                                <SelectItem value="Customer Support">Customer Support</SelectItem>
                                <SelectItem value="Content Creation">Content Creation</SelectItem>
                                <SelectItem value="Data Analysis">Data Analysis</SelectItem>
                                <SelectItem value="Sales Assistant">Sales Assistant</SelectItem>
                                <SelectItem value="Research Helper">Research Helper</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief description of what this agent does..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Model and Parameters */}
                    <div className="space-y-6">
                      <div>
                        <Label className="text-base font-medium text-white">AI Model & Parameters</Label>
                        <p className="text-sm text-white mt-1">Configure the AI model and behavior settings</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="model"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>AI Model</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo">Llama 3.1 70B (Recommended)</SelectItem>
                                  <SelectItem value="meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo">Llama 3.1 8B (Fast)</SelectItem>
                                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="maxTokens"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Tokens</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1024">1,024 tokens</SelectItem>
                                  <SelectItem value="2048">2,048 tokens</SelectItem>
                                  <SelectItem value="4096">4,096 tokens</SelectItem>
                                  <SelectItem value="8192">8,192 tokens</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="temperature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Temperature: {temperatureValue[0]}</FormLabel>
                            <FormControl>
                              <Slider
                                value={temperatureValue}
                                onValueChange={(value) => {
                                  setTemperatureValue(value);
                                  field.onChange(value[0]);
                                }}
                                max={2}
                                min={0}
                                step={0.1}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-white mt-1">
                              <span>More Focused (0.0)</span>
                              <span>More Creative (2.0)</span>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* System Prompt */}
                    <FormField
                      control={form.control}
                      name="systemPrompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>System Prompt</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="You are a helpful assistant..."
                              className="min-h-[200px] font-mono text-sm"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-white mt-2">
                            This defines your agent's personality, knowledge, and behavior. Be specific about how it should respond to users.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Sample Conversation */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium text-white">Sample Conversation (Optional)</Label>
                        <p className="text-sm text-white mt-1">Provide an example interaction to demonstrate your agent's style</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="sampleUser"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sample User Message</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="User: Hello, can you help me with..."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="sampleAgent"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sample Agent Response</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Agent: Of course! I'd be happy to..."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Voice & Image Settings */}
                    <div className="space-y-6">
                      <div>
                        <Label className="text-base font-medium text-white">Voice & Image Features</Label>
                        <p className="text-sm text-white mt-1">Enable voice responses and image generation capabilities</p>
                      </div>

                      {/* Voice Settings */}
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="voiceEnabled"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-3">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value || false}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                  className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
                                />
                              </FormControl>
                              <div>
                                <FormLabel className="text-sm font-medium">Enable Voice Responses</FormLabel>
                                <p className="text-xs text-slate-600">Allow users to hear agent responses using text-to-speech</p>
                              </div>
                            </FormItem>
                          )}
                        />

                        {form.watch("voiceEnabled") && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
                            <FormField
                              control={form.control}
                              name="voiceType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Voice Type</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                                      <SelectItem value="echo">Echo (Male)</SelectItem>
                                      <SelectItem value="fable">Fable (Warm)</SelectItem>
                                      <SelectItem value="onyx">Onyx (Deep)</SelectItem>
                                      <SelectItem value="nova">Nova (Female)</SelectItem>
                                      <SelectItem value="shimmer">Shimmer (Gentle)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="voiceModel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Voice Model</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="tts-1">TTS-1 (Fast)</SelectItem>
                                      <SelectItem value="tts-1-hd">TTS-1-HD (High Quality)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>

                      {/* Image Settings */}
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="imageEnabled"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-3">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value || false}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                  className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
                                />
                              </FormControl>
                              <div>
                                <FormLabel className="text-sm font-medium">Enable Image Generation</FormLabel>
                                <p className="text-xs text-slate-600">Allow agent to generate images using DALL-E 3</p>
                              </div>
                            </FormItem>
                          )}
                        />

                        {form.watch("imageEnabled") && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
                            <FormField
                              control={form.control}
                              name="imageModel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Image Model</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="dall-e-3">DALL-E 3 (Latest)</SelectItem>
                                      <SelectItem value="dall-e-2">DALL-E 2</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="imageQuality"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Image Quality</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="standard">Standard</SelectItem>
                                      <SelectItem value="hd">HD (Higher cost)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Agent Settings */}
                    <div className="space-y-6">
                      <div>
                        <Label className="text-base font-medium text-white">Agent Settings</Label>
                        <p className="text-sm text-white mt-1">Configure agent behavior and visibility</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Initial Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="draft">Draft (Not public)</SelectItem>
                                  <SelectItem value="testing">Testing (Limited access)</SelectItem>
                                  <SelectItem value="active">Active (Public)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="triggerKeywords"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Trigger Keywords (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., help, support, question"
                                  {...field}
                                />
                              </FormControl>
                              <p className="text-xs text-white mt-1">
                                Comma-separated keywords that will activate this agent
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="isTemplate"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-3">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value || false}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                  className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
                                />
                              </FormControl>
                              <div>
                                <FormLabel className="text-sm font-medium">Make this a Template</FormLabel>
                                <p className="text-xs text-slate-600">Allow other users to use this agent as a starting template</p>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isPrivate"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-3">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value || false}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                  className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
                                />
                              </FormControl>
                              <div>
                                <FormLabel className="text-sm font-medium">Private Agent</FormLabel>
                                <p className="text-xs text-slate-600">Keep this agent private and only accessible to you</p>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="hasSharedMemory"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-3">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value || false}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                  className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
                                />
                              </FormControl>
                              <div>
                                <FormLabel className="text-sm font-medium">Shared Memory Agent</FormLabel>
                                <p className="text-xs text-slate-600">Enable collective learning - this agent will remember information from all users and share knowledge across everyone</p>
                              </div>
                            </FormItem>
                          )}
                        />


                      </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-slate-200 pt-6 flex justify-end space-x-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={saveAsDraft}
                        disabled={createAgentMutation.isPending}
                      >
                        Save as Draft
                      </Button>
                      <Button 
                        type="button" 
                        variant="secondary"
                        onClick={testAgent}
                        disabled={createAgentMutation.isPending}
                      >
                        Test Agent
                      </Button>
                      <Button 
                        type="button"
                        onClick={createAndActivate}
                        disabled={createAgentMutation.isPending}
                        className="bg-primary hover:bg-blue-700 text-white"
                      >
                        {createAgentMutation.isPending ? "Creating..." : isEditing ? "Update Agent" : "Create Agent"}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
