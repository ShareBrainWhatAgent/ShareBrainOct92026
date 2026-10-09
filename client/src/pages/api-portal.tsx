import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Key, Code2, Globe, Shield, Zap, CheckCircle, Trash2, Plus, Eye, EyeOff, Book, BarChart3, Network, Settings, Heart, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import AgentManagementDashboard from "@/components/AgentManagementDashboard";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const createKeySchema = z.object({
  name: z.string().min(1, "Please enter a name for your API key"),
});

type LoginForm = z.infer<typeof loginSchema>;
type CreateKeyForm = z.infer<typeof createKeySchema>;

export default function APIPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  // Use real authentication if available, otherwise fall back to demo login
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoggedIn(true);
    }
  }, [isAuthenticated]);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const createKeyForm = useForm<CreateKeyForm>({
    resolver: zodResolver(createKeySchema),
    defaultValues: {
      name: "",
    },
  });

  // Query for user's API keys
  const { data: apiKeys = [], isLoading: isLoadingKeys } = useQuery({
    queryKey: ["/api/api-keys"],
    enabled: isLoggedIn && isAuthenticated,
  });

  // Create API key mutation
  const createApiKeyMutation = useMutation({
    mutationFn: async (data: CreateKeyForm) => {
      console.log("Creating API key with data:", data);
      const response = await apiRequest("POST", "/api/api-keys", data);
      console.log("API key response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API key creation failed:", errorText);
        throw new Error(`Failed to create API key: ${response.status} ${errorText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log("API key created successfully:", data);
      setNewApiKey(data.key);
      setShowNewKey(true);
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      createKeyForm.reset();
      toast({
        title: "API Key Created",
        description: "Your new API key has been generated. Make sure to copy it now!",
      });
    },
    onError: (error) => {
      console.error("API key creation error:", error);
      toast({
        title: "Error",
        description: `Failed to create API key: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete API key mutation
  const deleteApiKeyMutation = useMutation({
    mutationFn: async (keyId: number) => {
      await apiRequest("DELETE", `/api/api-keys/${keyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({
        title: "API Key Deleted",
        description: "The API key has been permanently deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete API key. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: LoginForm) => {
    // Simulate login
    if (data.email === "developer@example.com" && data.password === "demo123") {
      setIsLoggedIn(true);
      toast({
        title: "Login successful",
        description: "Welcome to the AgentForge API Portal",
      });
    } else {
      toast({
        title: "Login failed",
        description: "Invalid credentials. Use developer@example.com / demo123",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Code example copied successfully",
    });
  };

  const onCreateKey = (data: CreateKeyForm) => {
    createApiKeyMutation.mutate(data);
  };

  const handleDeleteKey = (keyId: number) => {
    if (confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      deleteApiKeyMutation.mutate(keyId);
    }
  };

  if (!isLoggedIn) {
    return (
      <>
        <header className="bg-white border-b border-slate-200 px-6 py-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Developer Portal</h2>
            <p className="text-slate-600 mt-1">Access AgentForge APIs and documentation</p>
          </div>
        </header>

        <main className="flex-1 p-8 bg-slate-50">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>Developer Login</CardTitle>
                <p className="text-slate-600 text-sm">Sign in to access API documentation and keys</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onLogin)} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="developer@example.com"
                      {...form.register("email")}
                    />
                    {form.formState.errors.email && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      {...form.register("password")}
                    />
                    {form.formState.errors.password && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.password.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full">
                    Sign In
                  </Button>
                </form>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-sm text-blue-700">
                    <strong>Demo Credentials:</strong><br />
                    Email: developer@example.com<br />
                    Password: demo123
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">API Portal</h2>
            <p className="text-slate-600 mt-1">Integrate ShareBrain into your applications</p>
          </div>
          <Button variant="outline" onClick={() => setIsLoggedIn(false)}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="authentication">Authentication</TabsTrigger>
              <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
              <TabsTrigger value="examples">Code Examples</TabsTrigger>
              <TabsTrigger value="llm-txt">LLM.txt</TabsTrigger>
              <TabsTrigger value="agent-management">Agent Management</TabsTrigger>
              <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Globe className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">RESTful API</h3>
                        <p className="text-sm text-slate-600">OpenAI-compatible endpoints</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">
                      Standard HTTP methods with JSON responses. Follows OpenAI API patterns for easy integration.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Zap className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Real-time Responses</h3>
                        <p className="text-sm text-slate-600">Fast agent completions</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">
                      Get instant responses from AI agents with context awareness and conversation history.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Shield className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Secure & Reliable</h3>
                        <p className="text-sm text-slate-600">API key authentication</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">
                      Rate-limited API with proper authentication and error handling for production use.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Base URL</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <code className="text-sm font-mono">https://e7c6e448-66c3-4bda-9bc5-828881f0c8ab-00-2k3x8pwqi53k3.riker.replit.dev/api/v1</code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard("https://e7c6e448-66c3-4bda-9bc5-828881f0c8ab-00-2k3x8pwqi53k3.riker.replit.dev/api/v1")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="authentication" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Key className="h-5 w-5" />
                    <span>Your API Key</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
              {/* Create New API Key */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Create New API Key</h4>
                </div>
                <form onSubmit={createKeyForm.handleSubmit(onCreateKey)} className="space-y-3">
                  <div>
                    <Label htmlFor="keyName">Key Name</Label>
                    <Input
                      id="keyName"
                      placeholder="e.g., Discord Bot, Website Integration"
                      {...createKeyForm.register("name")}
                    />
                    {createKeyForm.formState.errors.name && (
                      <p className="text-sm text-red-500 mt-1">
                        {createKeyForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    disabled={createApiKeyMutation.isPending}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {createApiKeyMutation.isPending ? "Creating..." : "Create API Key"}
                  </Button>
                </form>
              </div>

              {/* Show newly created key */}
              {newApiKey && showNewKey && (
                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-green-800">New API Key Created</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewKey(false)}
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <code className="text-sm font-mono text-green-700">{newApiKey}</code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(newApiKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    ⚠️ This is the only time you'll see this key. Make sure to copy and store it securely!
                  </p>
                </div>
              )}

              {/* Existing API Keys */}
              <div>
                <h4 className="font-medium mb-3">Your API Keys</h4>
                {isLoadingKeys ? (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                  </div>
                ) : apiKeys.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No API keys created yet</p>
                    <p className="text-sm">Create your first API key above to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {apiKeys.map((key: any) => (
                      <div key={key.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Key className="h-4 w-4 text-slate-600" />
                          <div>
                            <p className="font-medium text-sm">{key.name}</p>
                            <code className="text-xs font-mono text-slate-600">{key.keyPrefix}</code>
                            <div className="flex items-center space-x-4 mt-1">
                              <p className="text-xs text-slate-500">
                                Created: {new Date(key.createdAt).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-slate-500">
                                Used: {key.usageCount} times
                              </p>
                              {key.lastUsed && (
                                <p className="text-xs text-slate-500">
                                  Last used: {new Date(key.lastUsed).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteKey(key.id)}
                          disabled={deleteApiKeyMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rate Limits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">100</div>
                      <div className="text-sm text-slate-600">Requests per hour</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">Unlimited</div>
                      <div className="text-sm text-slate-600">Agent completions</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="endpoints" className="space-y-6">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">List Agents</CardTitle>
                      <Badge variant="outline">GET</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-100 rounded-lg p-3 font-mono text-sm mb-3">
                      GET /v1/agents
                    </div>
                    <p className="text-sm text-slate-600">Retrieve all available AI agents with their configurations and status.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Get Agent Details</CardTitle>
                      <Badge variant="outline">GET</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-100 rounded-lg p-3 font-mono text-sm mb-3">
                      GET /v1/agents/{`{agent_id}`}
                    </div>
                    <p className="text-sm text-slate-600">Get detailed information about a specific agent including system prompts and settings.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Agent Completion</CardTitle>
                      <Badge className="bg-green-100 text-green-800">POST</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-100 rounded-lg p-3 font-mono text-sm mb-3">
                      POST /v1/agents/{`{agent_id}`}/completions
                    </div>
                    <p className="text-sm text-slate-600 mb-3">
                      Send a message to an AI agent and get a response. This is the main endpoint for chat functionality.
                    </p>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Most important endpoint for integration</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Usage Statistics</CardTitle>
                      <Badge variant="outline">GET</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-100 rounded-lg p-3 font-mono text-sm mb-3">
                      GET /v1/usage
                    </div>
                    <p className="text-sm text-slate-600">Check your API usage, rate limits, and remaining quota.</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="examples" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>JavaScript / Node.js</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(jsExample)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
                      {jsExample}
                    </pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Python</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(pythonExample)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
                      {pythonExample}
                    </pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>cURL</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(curlExample)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
                      {curlExample}
                    </pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>PHP</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(phpExample)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
                      {phpExample}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="llm-txt" className="space-y-6">
              <div className="space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">LLM.txt Agent Communication Protocol</h3>
                  <p className="text-slate-600 max-w-2xl mx-auto">
                    Enable your agents to communicate with other AI systems using standardized protocols with fee-based access controls.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Network className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Agent-to-Agent Communication</h3>
                          <p className="text-sm text-slate-600">Standardized interaction protocol</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        Define how other AI systems can interact with your agents using LLM.txt files.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Shield className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Access Control</h3>
                          <p className="text-sm text-slate-600">Public, authenticated, and paid access</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        Control who can access your agents with API keys and pricing models.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Revenue Generation</h3>
                          <p className="text-sm text-slate-600">Monetize your AI agents</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        Set pricing for agent interactions and track usage analytics.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>What is LLM.txt?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 mb-4">
                      LLM.txt is a standardized format for AI agents to communicate how other AI systems should interact with them. 
                      Similar to how robots.txt provides instructions for web crawlers, LLM.txt provides guidelines for AI interactions.
                    </p>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Key Features:</h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Standardized interaction instructions</li>
                        <li>• Citation formats for proper attribution</li>
                        <li>• API key management and rate limiting</li>
                        <li>• Fee-based access with usage tracking</li>
                        <li>• Custom rules and guidelines</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Example LLM.txt File</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
{`# LLM.txt for Customer Support Agent

## Agent Information
- Name: Customer Support Agent
- Category: Customer Service
- Model: gpt-4o
- Voice Enabled: Yes

## AI Interaction Instructions
Please interact professionally and maintain a helpful tone.
Always cite sources when providing factual information.

## Citation Format
Source: Customer Support Agent via ShareBrain

## API Access
- Access Level: paid
- Rate Limit: 100 requests/hour
- Price per Request: $0.001

## Available Endpoints
- GET /api/agents/123/llm.txt - This file
- POST /api/agents/123/interact - Chat with agent
- GET /api/agents/123/info - Agent information

## Authentication
Requires paid API key. Contact agent owner for access.`}
                    </pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Access Your Agent's LLM.txt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 mb-4">
                      Each agent automatically gets an LLM.txt file that other AI systems can read:
                    </p>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <code className="text-sm">GET /api/agents/[agent_id]/llm.txt</code>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">
                      Configure your agent's LLM.txt settings in the Agent Management dashboard.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Models</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Public Access</h4>
                        <p className="text-sm text-slate-600">Free interaction with basic rate limits</p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Authenticated</h4>
                        <p className="text-sm text-slate-600">API key required, enhanced features</p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Paid Access</h4>
                        <p className="text-sm text-slate-600">Revenue per request, premium features</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>API Endpoints</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Get LLM.txt Configuration</h4>
                          <Badge variant="outline">GET</Badge>
                        </div>
                        <code className="text-sm bg-slate-100 p-2 rounded block">
                          GET /api/agents/[agent_id]/llm-config
                        </code>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Update LLM.txt Configuration</h4>
                          <Badge className="bg-green-100 text-green-800">POST</Badge>
                        </div>
                        <code className="text-sm bg-slate-100 p-2 rounded block">
                          POST /api/agents/[agent_id]/llm-config
                        </code>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Generate API Key</h4>
                          <Badge className="bg-green-100 text-green-800">POST</Badge>
                        </div>
                        <code className="text-sm bg-slate-100 p-2 rounded block">
                          POST /api/agents/[agent_id]/api-keys
                        </code>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Agent Interaction</h4>
                          <Badge className="bg-green-100 text-green-800">POST</Badge>
                        </div>
                        <code className="text-sm bg-slate-100 p-2 rounded block">
                          POST /api/agents/[agent_id]/interact
                        </code>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Getting Started</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-blue-600">1</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Configure Your Agent</h4>
                          <p className="text-sm text-slate-600">Set up LLM.txt configuration in Agent Management dashboard</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-blue-600">2</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Generate API Keys</h4>
                          <p className="text-sm text-slate-600">Create API keys for different access levels and integrations</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-blue-600">3</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Set Pricing</h4>
                          <p className="text-sm text-slate-600">Define access levels and pricing for agent interactions</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-blue-600">4</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Monitor Usage</h4>
                          <p className="text-sm text-slate-600">Track API usage, revenue, and analytics in real-time</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="agent-management" className="space-y-6">
              <div className="space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Agent Management Dashboard</h3>
                  <p className="text-slate-600 max-w-2xl mx-auto">
                    Comprehensive management and analytics for all your AI agents, including A/B testing capabilities.
                  </p>
                </div>

                <AgentManagementDashboard />
              </div>
            </TabsContent>

            <TabsContent value="tutorials" className="space-y-6">
              <div className="space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Developer Tools & Tutorials</h3>
                  <p className="text-slate-600 max-w-2xl mx-auto">
                    Access professional development tools and learn agent optimization with real-world examples and best practices.
                  </p>
                </div>

                {/* Developer Guide Card */}
                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                        <Book className="h-5 w-5 text-white" />
                      </div>
                      <span>Brain Architecture Guide - Design Decisions Framework</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">🧠 Brain Types & Memory Systems</h4>
                        <ul className="space-y-1 text-slate-600 text-sm">
                          <li>• Personal Brain: Private, individual memory</li>
                          <li>• Global Brain: Open community knowledge</li>
                          <li>• Private Invite Brain: Exclusive communities</li>
                          <li>• Public Invite Brain: Discoverable communities</li>
                          <li>• Role-based access: Creator/Contributor/Viewer</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">🎯 Design Decision Framework</h4>
                        <ul className="space-y-1 text-slate-600 text-sm">
                          <li>• Memory isolation vs. shared knowledge</li>
                          <li>• Access control strategies</li>
                          <li>• Monetization models (planned)</li>
                          <li>• Community management features</li>
                          <li>• Invitation vs. open access</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-slate-900 mb-2">🏗️ Architecture Planning Guide</h4>
                      <p className="text-slate-600 text-sm mb-3">
                        Comprehensive documentation for choosing the right brain architecture for your use case, including memory isolation, role management, and community features.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <h5 className="font-medium text-purple-800 text-xs mb-1">PRIVATE COMMUNITIES</h5>
                          <p className="text-purple-700 text-xs">Teams, exclusive groups, invite-only knowledge bases</p>
                        </div>
                        <div className="bg-pink-50 p-3 rounded-lg">
                          <h5 className="font-medium text-pink-800 text-xs mb-1">PUBLIC COMMUNITIES</h5>
                          <p className="text-pink-700 text-xs">Educational groups, professional networks, discoverable communities</p>
                        </div>
                        <div className="bg-indigo-50 p-3 rounded-lg">
                          <h5 className="font-medium text-indigo-800 text-xs mb-1">PAID ACCESS</h5>
                          <p className="text-indigo-700 text-xs">Premium knowledge, specialized expertise, monetized communities</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="outline" className="text-purple-600 border-purple-600">
                          Architecture Guide
                        </Badge>
                        <Badge variant="outline" className="text-pink-600 border-pink-600">
                          Design Patterns
                        </Badge>
                        <Badge variant="outline" className="text-indigo-600 border-indigo-600">
                          Coming Soon: Paid Features
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Invite Brain System Card */}
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                        <Heart className="h-5 w-5 text-white" />
                      </div>
                      <span>Invite Brain System - Exclusive AI Communities</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        Production Ready
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">🎯 System Features</h4>
                        <ul className="space-y-1 text-slate-600 text-sm">
                          <li>• Create exclusive member-only AI brains</li>
                          <li>• Role-based access control (Creator/Contributor/Viewer)</li>
                          <li>• Isolated memory systems with AI categorization</li>
                          <li>• Invitation management and bulk invites</li>
                          <li>• Analytics dashboard for brain creators</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">🏗️ Brain Types & Access Models</h4>
                        <ul className="space-y-1 text-slate-600 text-sm">
                          <li>• Private Invite: Invitation-only exclusivity</li>
                          <li>• Public Invite: Discoverable communities</li>
                          <li>• Request to Join: Semi-public access</li>
                          <li>• Paid Access: Monetized communities (ready)</li>
                          <li>• Complete memory isolation from other brain types</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-slate-900 mb-2">📋 Complete Implementation</h4>
                      <p className="text-slate-600 text-sm mb-3">
                        Full end-to-end invite brain system with database schema, 16 API endpoints, React frontend components, and comprehensive documentation.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                        <div className="bg-green-50 p-3 rounded-lg">
                          <h5 className="font-medium text-green-800 text-xs mb-1">DATABASE</h5>
                          <p className="text-green-700 text-xs">5 tables with complete schema and relationships</p>
                        </div>
                        <div className="bg-emerald-50 p-3 rounded-lg">
                          <h5 className="font-medium text-emerald-800 text-xs mb-1">API ENDPOINTS</h5>
                          <p className="text-emerald-700 text-xs">16 authenticated endpoints with role validation</p>
                        </div>
                        <div className="bg-teal-50 p-3 rounded-lg">
                          <h5 className="font-medium text-teal-800 text-xs mb-1">FRONTEND UI</h5>
                          <p className="text-teal-700 text-xs">Complete React components with professional design</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link to="/invite-brains">
                          <Button className="bg-green-600 hover:bg-green-700">
                            <Heart className="h-4 w-4 mr-2" />
                            Access Invite Brains
                          </Button>
                        </Link>
                        <Link to="/brain-invitations">
                          <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                            <User className="h-4 w-4 mr-2" />
                            Manage Invitations
                          </Button>
                        </Link>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Zero-Breakage Implementation
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Agent Builder Card */}
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Code2 className="h-5 w-5 text-white" />
                      </div>
                      <span>Agent Builder - Professional Development Platform</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">🚀 Agent Builder Features</h4>
                        <ul className="space-y-1 text-slate-600 text-sm">
                          <li>• JavaScript code editor with syntax highlighting</li>
                          <li>• System prompt optimization tools</li>
                          <li>• Test & debug environment</li>
                          <li>• Memory system integration</li>
                          <li>• One-click deployment</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">📊 GitHub Integration (Phase 2)</h4>
                        <ul className="space-y-1 text-slate-600 text-sm">
                          <li>• OAuth authentication with GitHub</li>
                          <li>• Automatic repository creation</li>
                          <li>• Push/pull synchronization</li>
                          <li>• Commit history tracking</li>
                          <li>• Real-time change detection</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-slate-900 mb-2">Access Agent Builder</h4>
                      <p className="text-slate-600 text-sm mb-3">
                        Professional development environment with GitHub integration for custom agent creation and collaboration.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Link to="/agent-builder">
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            <Code2 className="h-4 w-4 mr-2" />
                            Open Agent Builder
                          </Button>
                        </Link>
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          GitHub Integration Ready
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Zap className="h-4 w-4 text-blue-600" />
                        </div>
                        <span>TTS-Optimized Language Learning</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 mb-4">
                        How we transformed language tutors for better text-to-speech integration and visual learning.
                      </p>
                      <Badge variant="secondary">Real Implementation</Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <span>Memory System Enhancement</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 mb-4">
                        Implementing three-tier memory systems for personalized agent experiences.
                      </p>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Book className="h-4 w-4 text-purple-600" />
                        </div>
                        <span>Agent Creation Manual</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 mb-4">
                        Standardized templates for creating comprehensive agent websites through Q&A generation.
                      </p>
                      <a href="/agent-creation-manual" className="inline-block">
                        <Badge variant="outline">View Manual</Badge>
                      </a>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-4 w-4 text-blue-600" />
                        </div>
                        <span>A/B Testing System</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 mb-4">
                        Optimize user engagement by testing different question sets when users first interact with agents.
                      </p>
                      <div className="bg-blue-50 p-3 rounded-lg mb-4">
                        <p className="text-sm text-slate-700">
                          <strong>New Feature:</strong> Require users to sign up before using your agent, giving you access to their information for lead generation and personalization.
                        </p>
                      </div>
                      <a href="/ab-testing-dashboard" className="inline-block">
                        <Badge variant="outline">View Dashboard</Badge>
                      </a>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Case Study: Language Teacher TTS & Visual Learning Enhancement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">🎯 The Problem</h4>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-slate-700">
                          <strong>User Issue:</strong> Language tutors were using numbered lists (1. casa 2. gat 3. aigua) which made text-to-speech say "one, two, three" 
                          interrupting pronunciation practice.
                        </p>
                        <p className="text-slate-700 mt-2">
                          <strong>Additional Request:</strong> Users wanted vocabulary lists with accompanying images for visual learning combined with TTS.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">🔧 The Solution</h4>
                      <div className="bg-green-50 p-4 rounded-lg space-y-3">
                        <div>
                          <h5 className="font-medium text-green-800">Phase 1: TTS Optimization</h5>
                          <p className="text-slate-700">
                            Updated all 95+ language tutors to avoid numbered lists completely. Added specific TTS formatting rules 
                            to use natural speech patterns like: "Here are basic words: casa, gat, aigua, menjar, amic"
                          </p>
                        </div>
                        <div>
                          <h5 className="font-medium text-green-800">Phase 2: Visual Learning Integration</h5>
                          <p className="text-slate-700">
                            Enhanced system prompts to provide both TTS-friendly word lists AND specific image descriptions. 
                            Perfect integration with existing DALL-E 3 image generation system.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">📝 Implementation Details</h4>
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <pre className="text-sm text-slate-700 whitespace-pre-wrap">
{`// System Prompt Enhancement
IMPORTANT TEXT-TO-SPEECH FORMATTING RULES:
- When listing words, NEVER use numbers (1., 2., 3.)
- Use natural speech patterns: "Here are basic words: apple, book, water"
- For "words only" requests, provide ONLY target language words

VISUAL VOCABULARY LEARNING WITH IMAGES:
- Provide TTS-friendly word lists + image descriptions
- Format: "WORD - [simple, clear image description]"
- Example: "casa - a colorful house with a red roof and green door"`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">🎯 Results</h4>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <ul className="space-y-2 text-slate-700">
                          <li className="flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            <span><strong>TTS-Friendly:</strong> Eliminated numbered lists across all language tutors</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            <span><strong>Visual Learning:</strong> Added image descriptions for vocabulary words</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            <span><strong>Dual-Modal:</strong> Perfect combination of audio pronunciation + visual learning</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            <span><strong>Scalable:</strong> Works across all 95+ languages and vocabulary levels</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">🚀 Key Learnings</h4>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <ul className="space-y-2 text-slate-700">
                          <li><strong>User-Centered Design:</strong> Listen to specific user pain points about TTS integration</li>
                          <li><strong>Systematic Updates:</strong> Bulk update all related agents for consistency</li>
                          <li><strong>Multi-Modal Integration:</strong> Combine existing features (TTS + Image Generation) for enhanced experiences</li>
                          <li><strong>Format Specification:</strong> Provide clear formatting rules in system prompts</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Best Practices for Agent Enhancement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3">System Prompt Optimization</h4>
                        <ul className="space-y-2 text-slate-600">
                          <li>• Be specific about output formatting requirements</li>
                          <li>• Consider downstream usage (TTS, APIs, etc.)</li>
                          <li>• Test with real user scenarios</li>
                          <li>• Update related agents consistently</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3">Integration Strategies</h4>
                        <ul className="space-y-2 text-slate-600">
                          <li>• Leverage existing platform capabilities</li>
                          <li>• Design for multi-modal experiences</li>
                          <li>• Provide clear user instructions</li>
                          <li>• Document implementation for others</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}

const jsExample = `// Send message to agent
const response = await fetch('https://e7c6e448-66c3-4bda-9bc5-828881f0c8ab-00-2k3x8pwqi53k3.riker.replit.dev/api/v1/agents/17/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ak-demo123456789',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    input: "Hello, how can you help me?",
    context: {
      user_id: "user123",
      session: "session456"
    },
    temperature: 0.7,
    max_tokens: 1000
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);`;

const pythonExample = `import requests

# Send message to agent
response = requests.post(
    'https://e7c6e448-66c3-4bda-9bc5-828881f0c8ab-00-2k3x8pwqi53k3.riker.replit.dev/api/v1/agents/17/completions',
    headers={
        'Authorization': 'Bearer ak-demo123456789',
        'Content-Type': 'application/json'
    },
    json={
        'input': 'Hello, how can you help me?',
        'context': {
            'user_id': 'user123',
            'session': 'session456'
        },
        'temperature': 0.7,
        'max_tokens': 1000
    }
)

data = response.json()
print(data['choices'][0]['message']['content'])`;

const curlExample = `curl -X POST https://e7c6e448-66c3-4bda-9bc5-828881f0c8ab-00-2k3x8pwqi53k3.riker.replit.dev/api/v1/agents/17/completions \\
  -H "Authorization: Bearer ak-demo123456789" \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": "Hello, how can you help me?",
    "context": {
      "user_id": "user123",
      "session": "session456"
    },
    "temperature": 0.7,
    "max_tokens": 1000
  }'`;

const phpExample = `<?php
$url = 'https://e7c6e448-66c3-4bda-9bc5-828881f0c8ab-00-2k3x8pwqi53k3.riker.replit.dev/api/v1/agents/17/completions';
$data = [
    'input' => 'Hello, how can you help me?',
    'context' => [
        'user_id' => 'user123',
        'session' => 'session456'
    ],
    'temperature' => 0.7,
    'max_tokens' => 1000
];

$options = [
    'http' => [
        'header' => [
            'Authorization: Bearer ak-demo123456789',
            'Content-Type: application/json'
        ],
        'method' => 'POST',
        'content' => json_encode($data)
    ]
];

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);
$response = json_decode($result, true);

echo $response['choices'][0]['message']['content'];
?>`;