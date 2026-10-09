import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { 
  Bot, 
  Users, 
  Eye, 
  AlertTriangle, 
  Info, 
  MessageSquare, 
  TrendingUp,
  Lightbulb,
  Zap
} from "lucide-react";

const createAdvancedAgentSchema = insertAgentSchema.extend({
  name: z.string().min(1, "Agent name is required"),
  description: z.string().min(1, "Description is required"),
  systemPrompt: z.string().optional(),
  sampleUser: z.string().optional(),
  sampleAgent: z.string().optional(),
  isCommunityAgent: z.boolean().optional(),
});

type CreateAdvancedAgentForm = z.infer<typeof createAdvancedAgentSchema>;

export default function AdvancedAgents() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [temperatureValue, setTemperatureValue] = useState([0.7]);
  const [selectedAgentType, setSelectedAgentType] = useState<string | null>(null);

  const form = useForm<CreateAdvancedAgentForm>({
    resolver: zodResolver(createAdvancedAgentSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "Specialized Learning & Education",
      model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
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

  const createAgentMutation = useMutation({
    mutationFn: async (data: CreateAdvancedAgentForm) => {
      const response = await apiRequest("POST", "/api/agents", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Advanced Agent created successfully",
        description: "Your new advanced AI agent has been created and saved.",
      });
      setLocation("/agents");
    },
    onError: (error: any) => {
      console.error("Agent creation error:", error);
      toast({
        title: "Error creating agent",
        description: error.message || "Failed to create agent. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateAdvancedAgentForm) => {
    createAgentMutation.mutate({ ...data, status: "active" });
  };

  const selectCommunityAgent = () => {
    setSelectedAgentType("community");
    form.setValue("isCommunityAgent", true);
    form.setValue("category", "Specialized Learning & Education");
    form.setValue("systemPrompt", `You are a helpful Community Agent designed for transparent, public conversations. All your conversations are visible to everyone in the community, fostering open learning and knowledge sharing.

Key behaviors:
- Be helpful, educational, and engaging
- Encourage community participation and discussion
- Share knowledge that benefits everyone
- Ask thought-provoking questions that inspire further conversation
- Remember that all conversations are public and contribute to community learning

Your responses will be included in AI-generated community summaries that help highlight key insights and trending topics for all users.`);
    form.setValue("name", "Community Knowledge Hub");
    form.setValue("description", "A transparent AI agent where all conversations are publicly visible, fostering community learning and knowledge sharing through open dialogue.");
  };

  return (
    <>
      {/* Header */}
      <header className="bg-black border-b border-slate-200 px-6 py-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Advanced Agents</h2>
          <p className="text-white mt-1">Create specialized AI agents with advanced capabilities</p>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {!selectedAgentType ? (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-white mb-2">Choose Advanced Agent Type</h3>
                <p className="text-gray-400">Select the type of advanced agent you want to create</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Community Agent Card */}
                <Card 
                  className="bg-gray-900 border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={selectCommunityAgent}
                >
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-green-500/20 rounded-lg">
                        <Users className="h-8 w-8 text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Community Agent</CardTitle>
                        <p className="text-gray-400 text-sm">Transparent Public Conversations</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-300 text-sm">
                        Create agents where all conversations are publicly visible to everyone, 
                        fostering community learning and knowledge sharing.
                      </p>
                      
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                        <h4 className="font-semibold text-orange-400 mb-2 flex items-center text-sm">
                          <Eye className="h-3 w-3 mr-1" />
                          Public Visibility
                        </h4>
                        <p className="text-gray-300 text-xs">
                          All messages are visible to everyone and included in AI-generated community summaries
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-white text-sm flex items-center">
                          <Lightbulb className="h-3 w-3 mr-1" />
                          Features:
                        </h4>
                        <ul className="space-y-1 text-xs text-gray-300">
                          <li className="flex items-start">
                            <span className="text-green-400 mr-2">•</span>
                            Real-time public message feed
                          </li>
                          <li className="flex items-start">
                            <span className="text-green-400 mr-2">•</span>
                            AI-powered daily and weekly summaries
                          </li>
                          <li className="flex items-start">
                            <span className="text-green-400 mr-2">•</span>
                            Community statistics and trending topics
                          </li>
                          <li className="flex items-start">
                            <span className="text-green-400 mr-2">•</span>
                            Collaborative learning environment
                          </li>
                        </ul>
                      </div>

                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                        <Users className="h-4 w-4 mr-2" />
                        Create Community Agent
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Future Advanced Agent Types */}
                <Card className="bg-gray-900 border-gray-700 opacity-50">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gray-500/20 rounded-lg">
                        <Zap className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <CardTitle className="text-gray-400">More Advanced Types</CardTitle>
                        <p className="text-gray-500 text-sm">Coming Soon</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 text-sm">
                      Additional advanced agent types will be available here in future updates.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Create Community Agent</CardTitle>
                    <p className="text-gray-400">Configure your transparent public conversation agent</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedAgentType(null)}
                    className="text-gray-300"
                  >
                    Back to Selection
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Warning Banner */}
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <h3 className="font-semibold text-red-400 mb-2 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Public Visibility Warning
                      </h3>
                      <p className="text-gray-300 text-sm">
                        All conversations with this Community Agent will be <strong>publicly visible</strong> to everyone. 
                        Messages will be included in AI-generated community summaries and statistics.
                      </p>
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Agent Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Community Knowledge Hub" 
                                {...field} 
                                className="bg-black border-gray-700 text-white"
                              />
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
                            <FormLabel className="text-white">Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-black border-gray-700 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-900 border-gray-700">
                                <SelectItem value="Specialized Learning & Education">Specialized Learning & Education</SelectItem>
                                <SelectItem value="Community Support">Community Support</SelectItem>
                                <SelectItem value="Knowledge Sharing">Knowledge Sharing</SelectItem>
                                <SelectItem value="Collaborative Research">Collaborative Research</SelectItem>
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
                          <FormLabel className="text-white">Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe what this community agent specializes in and how it will help the community..."
                              rows={3}
                              className="bg-black border-gray-700 text-white"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* AI Configuration */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white">AI Configuration</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="model"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">AI Model</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-black border-gray-700 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-gray-900 border-gray-700">
                                  <SelectItem value="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo">Llama 3.1 70B</SelectItem>
                                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div>
                          <Label className="text-white text-sm font-medium">
                            Creativity Level: {temperatureValue[0] <= 0.3 ? "Conservative" : temperatureValue[0] <= 0.7 ? "Balanced" : "Creative"}
                          </Label>
                          <Slider
                            value={temperatureValue}
                            onValueChange={(value) => {
                              setTemperatureValue(value);
                              form.setValue("temperature", value[0]);
                            }}
                            max={1}
                            min={0}
                            step={0.1}
                            className="mt-2"
                          />
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>Conservative</span>
                            <span>Creative</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* System Prompt */}
                    <FormField
                      control={form.control}
                      name="systemPrompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">System Prompt</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Define the agent's behavior and expertise..."
                              rows={8}
                              className="font-mono text-sm bg-black border-gray-700 text-white"
                              {...field} 
                            />
                          </FormControl>
                          <p className="text-xs text-gray-400 mt-1">Define how the agent should behave in public conversations</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Sample Conversation */}
                    <div>
                      <Label className="text-sm font-medium text-white mb-2 block">Sample Public Conversation</Label>
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
                                    placeholder="Example user question for the community"
                                    className="flex-1 text-sm bg-black border-gray-700 text-white"
                                    {...field}
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
                                    placeholder="Expected public response that helps the community"
                                    className="flex-1 text-sm bg-black border-gray-700 text-white"
                                    {...field}
                                  />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Show how the agent will respond in public conversations</p>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-gray-700 pt-6 flex justify-end space-x-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setSelectedAgentType(null)}
                        disabled={createAgentMutation.isPending}
                        className="text-gray-300"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createAgentMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {createAgentMutation.isPending ? "Creating..." : "Create Community Agent"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}