import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Sparkles, User, Users, Globe, ArrowRight, Eye, EyeOff } from "lucide-react";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";

function EasyAgentsContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [agentName, setAgentName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerWords, setTriggerWords] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isPubliclyVisible, setIsPubliclyVisible] = useState(false);

  // Auto-set public visibility for Global Brains
  const handleTypeSelection = (type: string) => {
    setSelectedType(type);
    if (type === "global") {
      setIsPubliclyVisible(true); // Global brains should be public by default
    } else {
      setIsPubliclyVisible(false); // Personal brains private by default
    }
  };

  const createAgentMutation = useMutation({
    mutationFn: async (agentData: any) => {
      const response = await apiRequest("POST", "/api/agents", agentData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: "Agent Created!",
        description: `${data.name} has been created successfully and is ready to chat!`,
      });
      setLocation(`/chat/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create agent",
        variant: "destructive",
      });
    },
  });

  const createAgent = () => {
    if (!agentName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your agent",
        variant: "destructive",
      });
      return;
    }

    if (!selectedType) {
      toast({
        title: "Brain Type Required",
        description: "Please select either Personal Brain or Global Brain",
        variant: "destructive",
      });
      return;
    }

    const categoryMap: Record<string, string> = {
      personal: "Personal",
      global: "Global Brain",
      friends: "Friends Brain",
    };

    const agentData = {
      name: agentName,
      description: description || "A helpful AI assistant",
      category: categoryMap[selectedType] || "General",
      model: "meta-llama/llama-3.1-70b-instruct", // Using Llama 3.1 70B but not showing to user
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: instructions ||
        "You are a helpful AI assistant. Be friendly, informative, and assist users with their questions and tasks.",
      sampleUser: "Hello! How can you help me?",
      sampleAgent: "Hello! I'm here to help you with anything you need. What can I assist you with today?",
      triggerKeywords: triggerWords,
      status: "active",
      voiceEnabled: true, // Automatically enabled
      voiceType: "alloy",
      imageEnabled: false, // Image generation disabled for Easy Agents
      imageModel: "",
      isPersonal: selectedType === "personal",
      isPrivate: selectedType === "personal", // Personal agents are private, others are public
      isPubliclyVisible: isPubliclyVisible, // User chooses visibility
      hasSharedMemory: selectedType === "global", // Only global agents use shared memory
      hasFriendsMemory: selectedType === "friends", // Only friends agents use friends memory
    };

    createAgentMutation.mutate(agentData);
  };

  return (
    <>
      {/* Header */}
      <header className="bg-black text-white px-8 py-8">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Easy Brains</h1>
          </div>
          <p className="text-white text-lg">
            Create your AI assistant in just a few steps. Choose your memory type and customize your brain.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl">
          {/* Step 1: Choose Agent Type */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Step 1: Choose Memory Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Agent */}
              <Card 
                className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                  selectedType === "personal" ? "border-purple-500 bg-purple-50" : "border-slate-200 hover:border-purple-200"
                }`}
                onClick={() => handleTypeSelection("personal")}
              >
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className={`text-lg font-semibold ${selectedType === "personal" ? "text-black" : "text-white"}`}>Personal Brain</h3>
                  </div>
                  <p className={`text-sm mb-4 ${selectedType === "personal" ? "text-black" : "text-white"}`}>
                    Only you can ask this Personal brain to remember things. Your friends can ask questions to your personal brain and if there is a relevant answer from you, your brain will respond.
                  </p>
                </CardContent>
              </Card>

              {/* Global Agent */}
              <Card 
                className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                  selectedType === "global" ? "border-purple-500 bg-purple-50" : "border-slate-200 hover:border-purple-200"
                }`}
                onClick={() => handleTypeSelection("global")}
              >
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className={`text-lg font-semibold ${selectedType === "global" ? "text-black" : "text-white"}`}>Global Brain</h3>
                  </div>
                  <p className={`text-sm mb-4 ${selectedType === "global" ? "text-black" : "text-white"}`}>
                    Anyone can add information to the brain and anyone can query the brain. Knowledge is shared with everyone. For example, The ShareBrain Restaurant Community is an implementation of Global Brain.
                  </p>
                  <div className={`flex items-center text-sm font-medium ${selectedType === "global" ? "text-black" : "text-white"}`}>
                    <span>Public to everyone</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Step 2: Agent Configuration */}
          {selectedType && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Step 2: Configure Your Brain</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="agentName" className="text-base font-medium">Brain Name</Label>
                      <Input
                        id="agentName"
                        placeholder="My Personal Assistant"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description" className="text-base font-medium">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe what your agent will help you with..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-2"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="triggerWords" className="text-base font-medium">Trigger Words (Optional)</Label>
                      <Input
                        id="triggerWords"
                        placeholder="assistant, help, support"
                        value={triggerWords}
                        onChange={(e) => setTriggerWords(e.target.value)}
                        className="mt-2"
                      />
                      <p className="text-sm text-white mt-1">Keywords that will help activate your brain</p>
                    </div>

                    <div>
                      <Label htmlFor="instructions" className="text-base font-medium">Instructions</Label>
                      <Textarea
                        id="instructions"
                        placeholder="Tell your brain how to behave and what to focus on..."
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        className="mt-2"
                        rows={4}
                      />
                      <p className="text-sm text-white mt-1">How should your brain respond and what should it focus on?</p>
                    </div>

                    {/* Visibility Toggle */}
                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Brain Visibility</Label>
                          <p className="text-sm text-white">
                            {selectedType === "global" 
                              ? "Global Brains are always public and appear in the Brain Directory for community sharing"
                              : isPubliclyVisible 
                                ? "Your brain will appear in the public Brain Directory" 
                                : "Your brain will be private and only visible to you"
                            }
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <EyeOff className="h-4 w-4 text-white" />
                          <Switch
                            checked={isPubliclyVisible}
                            onCheckedChange={selectedType === "global" ? undefined : setIsPubliclyVisible}
                            disabled={selectedType === "global"}
                            className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white border border-gray-400"
                          />
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        {selectedType === "global" ? (
                          <span className="text-green-600">✓ Public - Global Brains are automatically shared with the community</span>
                        ) : isPubliclyVisible ? (
                          <span className="text-green-600">✓ Public - Others can discover and interact with your brain</span>
                        ) : (
                          <span className="text-blue-600">✓ Private - Only you can access this brain</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Create Agent */}
          {selectedType && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Step 3: Create Your Brain</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="bg-black border border-white rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Included Features</h3>
                    <ul className="space-y-2 text-sm text-white">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Text-to-Speech enabled automatically
                      </li>

                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {selectedType === "personal" ? "Personal memory system" : 
                         selectedType === "friends" ? "Friends-only memory system" : 
                         "Global shared memory system"}
                      </li>
                    </ul>
                  </div>
                  
                  <Button
                    onClick={createAgent}
                    disabled={createAgentMutation.isPending || !agentName.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg py-3"
                  >
                    {createAgentMutation.isPending ? "Creating Brain..." : (
                      <div className="flex items-center gap-2">
                        <span>Create Brain</span>
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}


        </div>
      </main>
    </>
  );
}

export default function EasyAgents() {
  return <EasyAgentsContent />;
}