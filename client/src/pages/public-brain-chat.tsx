import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Send, User, Bot, Volume2, LogIn, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PublicBrain {
  id: number;
  name: string;
  description: string;
  category: string;
  voiceEnabled: boolean;
  imageEnabled: boolean;
  sampleUser: string;
  sampleAgent: string;
  availableForPublic: boolean;
  maxFreeInteractions: number;
  requiresLoginAfter: number;
  accessRestriction: string | null;
  hasSharedMemory: boolean;
  hasFriendsMemory: boolean;
  hasPersonalMemory: boolean;
  isCommunityAgent: boolean;
  isPrivate: boolean;
  slug: string;
}

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatResponse {
  response: string;
  agent: {
    name: string;
    voiceEnabled: boolean;
    imageEnabled: boolean;
  };
  usage: {
    messageCount: number;
    maxMessages: number;
    requiresLogin: boolean;
    nextRequirement: "none" | "captcha" | "login";
  };
  rateLimitInfo?: {
    messageCount: number;
    requiresCaptcha: boolean;
    isBlocked: boolean;
    showLoginPrompt: boolean;
    captcha?: {
      question: string;
      answer: number;
    };
  };
}

interface CaptchaChallenge {
  question: string;
  answer: number;
}

interface RateLimitError {
  message: string;
  rateLimitInfo: {
    isBlocked?: boolean;
    messageCount: number;
    showLoginPrompt?: boolean;
    requiresCaptcha?: boolean;
    captcha?: CaptchaChallenge;
  };
}

export default function PublicBrainChat() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [brain, setBrain] = useState<PublicBrain | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId] = useState(() => `public_${Date.now()}_${Math.random()}`);
  const [usageCount, setUsageCount] = useState(0);
  const [captchaChallenge, setCaptchaChallenge] = useState<CaptchaChallenge | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch brain info
  useEffect(() => {
    if (!slug) return;
    
    fetchBrainInfo();
  }, [slug]);

  const fetchBrainInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public-brain/${slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Brain not found");
        } else {
          setError("Failed to load brain information");
        }
        return;
      }

      const data = await response.json();
      setBrain(data);
      
      // Add sample conversation to start if available for public access
      if (data.availableForPublic && data.sampleUser && data.sampleAgent) {
        setMessages([
          {
            id: "sample-user",
            content: data.sampleUser,
            isUser: true,
            timestamp: new Date()
          },
          {
            id: "sample-agent",
            content: data.sampleAgent,
            isUser: false,
            timestamp: new Date()
          }
        ]);
      }
    } catch (err) {
      setError("Failed to connect to brain");
      console.error("Error fetching brain:", err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !brain || sending) return;

    // If blocked, show login prompt
    if (isBlocked) {
      setShowLoginPrompt(true);
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage("");
    setSending(true);

    try {
      const requestBody: any = {
        message: currentMessage,
        sessionId
      };

      // Include captcha answer if there's a challenge
      if (captchaChallenge && captchaAnswer) {
        requestBody.captchaAnswer = parseInt(captchaAnswer);
      }

      const response = await fetch(`/api/public-brain/${slug}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (response.status === 429) {
        // Rate limit error
        const errorData: RateLimitError = await response.json();
        
        if (errorData.rateLimitInfo.showLoginPrompt) {
          setIsBlocked(true);
          setShowLoginPrompt(true);
          toast({
            title: "Message limit reached",
            description: "Sign in for unlimited access to this brain.",
          });
          return;
        }
        
        if (errorData.rateLimitInfo.requiresCaptcha && errorData.rateLimitInfo.captcha) {
          setCaptchaChallenge(errorData.rateLimitInfo.captcha);
          setCaptchaAnswer("");
          toast({
            title: "Please verify you're human",
            description: "Answer the simple math question to continue.",
          });
          return;
        }
        
        toast({
          title: "Rate limit exceeded",
          description: errorData.message,
          variant: "destructive"
        });
        return;
      }

      if (response.status === 400) {
        // Captcha verification failed
        const errorData: RateLimitError = await response.json();
        if (errorData.rateLimitInfo.captcha) {
          setCaptchaChallenge(errorData.rateLimitInfo.captcha);
          toast({
            title: "Incorrect answer",
            description: "Please try again.",
            variant: "destructive"
          });
        }
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data: ChatResponse = await response.json();
      
      const agentMessage: ChatMessage = {
        id: `agent-${Date.now()}`,
        content: data.response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMessage]);
      setUsageCount(data.usage.messageCount);

      // Clear captcha after successful message
      setCaptchaChallenge(null);
      setCaptchaAnswer("");

      // Update rate limit states
      if (data.rateLimitInfo) {
        setIsBlocked(data.rateLimitInfo.isBlocked);
        setShowLoginPrompt(data.rateLimitInfo.showLoginPrompt);
        
        if (data.rateLimitInfo.requiresCaptcha) {
          // Will be handled by next message attempt
        }
      }

      // Show usage warnings
      if (data.usage.nextRequirement === "captcha") {
        toast({
          title: "You're doing great!",
          description: "You may need to answer a quick verification question soon.",
        });
      } else if (data.usage.nextRequirement === "login") {
        toast({
          title: "Almost at the limit",
          description: "Sign in to continue unlimited chatting with this brain.",
        });
      }

    } catch (err) {
      console.error("Error sending message:", err);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading brain...</p>
        </div>
      </div>
    );
  }

  if (error || !brain) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🤖</div>
          <h1 className="text-2xl font-bold mb-4">Brain Not Found</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button 
            onClick={() => window.location.href = "/"}
            className="bg-white text-black hover:bg-gray-200"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Browse Available Brains
          </Button>
        </div>
      </div>
    );
  }

  const messageCount = usageCount || 0;

  // Function to get access restriction explanation
  const getAccessRestrictionInfo = () => {
    if (!brain.accessRestriction) return null;
    
    switch (brain.accessRestriction) {
      case "private":
        return {
          title: "Private Brain",
          description: "This brain is private and only accessible to its owner.",
          reason: "Privacy Setting"
        };
      case "memory":
        return {
          title: "Memory-Enabled Brain",
          description: "This brain uses persistent memory features and requires login for security.",
          reason: brain.hasSharedMemory ? "Global Memory" : "Friends Memory"
        };
      case "community":
        return {
          title: "Community Brain",
          description: "This brain features public conversations and requires login to participate.",
          reason: "Community Features"
        };
      case "visibility":
        return {
          title: "Premium Brain",
          description: "This brain is available to registered users only.",
          reason: "Visibility Settings"
        };
      default:
        return {
          title: "Login Required",
          description: "This brain requires user authentication to access.",
          reason: "Access Control"
        };
    }
  };

  const accessInfo = getAccessRestrictionInfo();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Bot className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{brain.name}</h1>
                <p className="text-sm text-gray-400">{brain.description}</p>
                {accessInfo && (
                  <Badge variant="outline" className="mt-1 border-yellow-500 text-yellow-400">
                    {accessInfo.reason}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-gray-800 text-white">
                {brain.category}
              </Badge>
              {brain.availableForPublic ? (
                !isBlocked ? (
                  messageCount <= 10 ? (
                    <Badge variant="outline" className="border-green-500 text-green-400">
                      {10 - messageCount} free messages left
                    </Badge>
                  ) : messageCount <= 15 ? (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                      Slowdown active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-orange-500 text-orange-400">
                      Verification required
                    </Badge>
                  )
                ) : (
                  <Badge variant="destructive">
                    Sign in required
                  </Badge>
                )
              ) : (
                <Badge variant="outline" className="border-red-500 text-red-400">
                  Login Required
                </Badge>
              )}
              <div className="flex flex-col space-y-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = "/"}
                  className="border-white text-white hover:bg-white hover:text-black"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open(`/api/brain/${brain.slug}/llm.txt`, '_blank')}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  llm.txt
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-80px)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {/* Access Restriction Message */}
          {!brain.availableForPublic && accessInfo && (
            <Card className="mb-6 bg-gray-900 border-yellow-500">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-4xl mb-4">🔒</div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {accessInfo.title}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {accessInfo.description}
                  </p>
                  <div className="space-y-2 mb-4">
                    {brain.hasSharedMemory && (
                      <Badge variant="outline" className="border-blue-500 text-blue-400 mr-2">
                        Global Memory
                      </Badge>
                    )}
                    {brain.hasFriendsMemory && (
                      <Badge variant="outline" className="border-green-500 text-green-400 mr-2">
                        Friends Memory
                      </Badge>
                    )}
                    {brain.hasPersonalMemory && (
                      <Badge variant="outline" className="border-purple-500 text-purple-400 mr-2">
                        Personal Memory
                      </Badge>
                    )}
                    {brain.isCommunityAgent && (
                      <Badge variant="outline" className="border-orange-500 text-orange-400 mr-2">
                        Community Agent
                      </Badge>
                    )}
                  </div>
                  <Button 
                    onClick={() => window.location.href = "/"}
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In to Access
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex max-w-[70%] ${message.isUser ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.isUser ? "bg-white ml-2" : "bg-gray-800 mr-2"
                  }`}>
                    {message.isUser ? (
                      <User className="h-4 w-4 text-black" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${
                    message.isUser 
                      ? "bg-white text-black" 
                      : "bg-gray-800 text-white"
                  }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-800 px-4 py-4">
          {/* Captcha Challenge */}
          {captchaChallenge && (
            <Card className="mb-4 bg-gray-900 border-yellow-500">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl mb-2">🤖</div>
                  <p className="text-white mb-2">Please verify you're human</p>
                  <p className="text-lg font-mono text-yellow-400 mb-3">
                    {captchaChallenge.question}
                  </p>
                  <div className="flex space-x-2 justify-center">
                    <Input
                      type="number"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      placeholder="Your answer"
                      className="w-24 text-center bg-black border-gray-600 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Login Prompt Modal */}
          {showLoginPrompt && (
            <Card className="mb-4 bg-gray-900 border-blue-500">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-4xl mb-4">🚀</div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Ready for unlimited access?
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Sign in to continue chatting with unlimited messages and unlock memory features.
                  </p>
                  <div className="flex space-x-3 justify-center">
                    <Button 
                      onClick={() => window.location.href = "/"}
                      className="bg-white text-black hover:bg-gray-200"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setShowLoginPrompt(false);
                        setIsBlocked(false);
                        // Give one more hour of free access
                        setTimeout(() => setIsBlocked(true), 3600000);
                      }}
                      className="border-gray-600 text-gray-400 hover:bg-gray-800"
                    >
                      Continue as Guest (1hr cooldown)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {brain.availableForPublic && !isBlocked ? (
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={sending}
                className="flex-1 bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
              <Button
                onClick={sendMessage}
                disabled={sending || !inputMessage.trim()}
                className="bg-white text-black hover:bg-gray-200"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Free interactions used up!
                  </h3>
                  <p className="text-gray-400 mb-4">
                    You've used all {brain.maxFreeInteractions} free interactions with {brain.name}. 
                    Sign in to continue chatting and access all ShareBrain features.
                  </p>
                  <Button 
                    onClick={() => window.location.href = "/"}
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In to Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}