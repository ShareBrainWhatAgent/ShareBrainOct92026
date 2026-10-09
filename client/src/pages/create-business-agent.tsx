import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Briefcase, Brain, Globe, CheckCircle, Loader2 } from "lucide-react";

export default function CreateBusinessAgent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [websiteAnalysis, setWebsiteAnalysis] = useState<any>(null);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);

  const createBusinessAgentMutation = useMutation({
    mutationFn: async (websiteData: any) => {
      // Create agent data using website analysis
      const agentData = {
        name: websiteData.suggested_agent_name || "Business Assistant",
        description: websiteData.business_summary || "AI assistant for business inquiries",
        category: "business",
        model: "llama-3.1-70b",
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: generateBusinessSystemPrompt(websiteData),
        sampleUser: websiteData.questions_and_answers?.[0]?.question || "What services do you offer?",
        sampleAgent: websiteData.questions_and_answers?.[0]?.answer || "I'm here to help with your business inquiries.",
        status: "active",
        isPersonal: false,
        documentSearchMode: "documents_memory_and_general",
        voiceEnabled: true,
        voiceModel: "tts-1",
        voiceSpeed: 1.0,
      };

      return await apiRequest("POST", "/api/agents", agentData);
    },
    onSuccess: (response) => {
      toast({
        title: "Business Agent Created",
        description: "Your business agent has been successfully created and is ready to use!",
      });
      setLocation("/agents");
    },
    onError: (error: any) => {
      toast({
        title: "Error creating business agent",
        description: error.message || "Failed to create business agent. Please try again.",
        variant: "destructive",
      });
      setIsCreatingAgent(false);
    },
  });

  const generateBusinessSystemPrompt = (websiteData: any) => {
    let prompt = `You are a professional AI assistant representing this business. Use the following information to answer questions accurately:

${websiteData.business_summary || "Business information"}

`;

    if (websiteData.questions_and_answers && websiteData.questions_and_answers.length > 0) {
      prompt += `Key Information:\n`;
      websiteData.questions_and_answers.forEach((qa: any, index: number) => {
        prompt += `Q: ${qa.question}\nA: ${qa.answer}\n\n`;
      });
    }

    prompt += `Instructions:
- Always respond in a helpful, professional manner
- Stay focused on information related to this business
- If asked about something outside your knowledge, politely redirect to contacting the business directly
- Remember personal information shared by users to provide better service`;

    return prompt;
  };

  const handleCreateAgent = async () => {
    if (!websiteUrl) {
      toast({
        title: "Website URL Required",
        description: "Please enter your company website URL",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingAgent(true);
    
    try {
      // First analyze the website using the specific prompt
      const response = await apiRequest("POST", "/api/analyze-website", { 
        url: websiteUrl,
        prompt: "Can you please create a comprehensive Questions and Answers document for this website which will be the basis for an AI agent"
      });
      const analysis = await response.json();
      
      // Then create the agent using the analysis
      createBusinessAgentMutation.mutate(analysis);
      
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze website",
        variant: "destructive",
      });
      setIsCreatingAgent(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-6">
        <div className="max-w-4xl">
          <h2 className="text-3xl font-bold mb-2">Create Business Agent</h2>
          <p className="text-lg opacity-90">Enter your company website URL to automatically create an AI agent</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Let's Create Your Business Agent</h3>
                <p className="text-slate-600 text-lg">We'll analyze your website and create a custom AI agent with voice capabilities</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-lg font-medium text-slate-900">Company Website URL</label>
                  <p className="text-slate-600">Enter your website URL and we'll automatically create questions and answers for your AI agent</p>
                </div>

                <div className="space-y-4">
                  <Input
                    placeholder="https://yourcompany.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="text-lg py-6 px-4 text-center"
                    disabled={isCreatingAgent}
                  />

                  <Button
                    onClick={handleCreateAgent}
                    disabled={isCreatingAgent || !websiteUrl}
                    className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isCreatingAgent ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                        Creating Agent...
                      </>
                    ) : (
                      <>
                        <Brain className="h-5 w-5 mr-3" />
                        Create Agent
                      </>
                    )}
                  </Button>
                </div>

                {/* Features */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                    <Brain className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-slate-900">AI-Powered</h4>
                    <p className="text-sm text-slate-600">Uses Llama 3.1 70B model</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
                    <Globe className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-slate-900">Website Analysis</h4>
                    <p className="text-sm text-slate-600">Automatic Q&A generation</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-slate-900">Voice Enabled</h4>
                    <p className="text-sm text-slate-600">Text-to-speech ready</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}