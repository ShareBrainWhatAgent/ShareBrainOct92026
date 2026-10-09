import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ThumbsUp, Flag, MessageSquare, Sparkles, Clock, User } from "lucide-react";
import type { AiSaysResponse, AiSaysInteraction } from "@shared/schema";

export default function AiSays() {
  const [query, setQuery] = useState("");
  const [currentResponse, setCurrentResponse] = useState<AiSaysResponse | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate AI response mutation
  const generateResponseMutation = useMutation({
    mutationFn: async (queryText: string) => {
      setIsGenerating(true);
      const response = await apiRequest("POST", "/api/aisays/query", {
        query: queryText
      });
      return (await response.json()) as AiSaysResponse;
    },
    onSuccess: (response) => {
      setCurrentResponse(response);
      setQuery("");
      toast({
        title: "Response Generated",
        description: "AI has provided an answer. Please review and provide feedback.",
      });
    },
    onError: (error) => {
      console.error("Generation failed:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI response. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsGenerating(false);
    }
  });

  // Interaction mutation (agree/flag)
  const interactionMutation = useMutation({
    mutationFn: async ({ responseId, interactionType, reasoning }: {
      responseId: number;
      interactionType: 'agree' | 'flag' | 'edit';
      reasoning?: string;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/aisays/responses/${responseId}/interaction`,
        {
          interactionType,
          reasoning,
        },
      );
      return response.json();
    },
    onSuccess: (_, variables) => {
      if (variables.interactionType === 'agree') {
        toast({
          title: "Thank You!",
          description: "Your feedback helps improve the knowledge base.",
        });
      } else if (variables.interactionType === 'flag') {
        toast({
          title: "Flagged",
          description: "Response has been flagged for review. Thank you for the feedback.",
        });
      }
      setCurrentResponse(null);
      setShowFlagDialog(false);
      setFlagReason("");
    },
    onError: (error) => {
      console.error("Interaction failed:", error);
      toast({
        title: "Interaction Failed",
        description: "Failed to record your feedback. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a question to get an AI response.",
        variant: "destructive",
      });
      return;
    }
    generateResponseMutation.mutate(query.trim());
  };

  const handleAgree = () => {
    if (currentResponse) {
      interactionMutation.mutate({
        responseId: currentResponse.id,
        interactionType: 'agree'
      });
    }
  };

  const handleFlag = () => {
    if (currentResponse) {
      if (flagReason.trim()) {
        interactionMutation.mutate({
          responseId: currentResponse.id,
          interactionType: 'flag',
          reasoning: flagReason.trim()
        });
      } else {
        setShowFlagDialog(true);
      }
    }
  };

  const submitFlag = () => {
    if (currentResponse && flagReason.trim()) {
      interactionMutation.mutate({
        responseId: currentResponse.id,
        interactionType: 'flag',
        reasoning: flagReason.trim()
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mr-4">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">AiSays</h1>
              <p className="text-xl opacity-90">Interactive AI Knowledge Curation</p>
            </div>
          </div>
          <p className="text-lg opacity-80 max-w-2xl mx-auto">
            Ask questions, get AI answers, and help curate knowledge through community feedback. 
            Your input makes AI responses better for everyone.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Query Input */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-6 w-6 mr-2" />
              Ask AiSays Anything
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="What are the best taco places in Denver?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isGenerating}
                  className="text-lg py-3"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isGenerating || !query.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <div className="flex items-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Generating Response...
                  </div>
                ) : (
                  "Get AI Response"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Current Response */}
        {currentResponse && (
          <Card className="mb-8 border-2 border-blue-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">
                    {currentResponse.query}
                  </CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {currentResponse.aiProvider}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {currentResponse.createdAt
                        ? new Date(currentResponse.createdAt).toLocaleString()
                        : "Unknown"}
                    </div>
                    <Badge variant="secondary">
                      Confidence: {Math.round(((currentResponse.confidenceScore ?? 0) * 100))}%
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {currentResponse.aiAnswer}
                </p>
              </div>

              {!showFlagDialog ? (
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={handleAgree}
                    variant="default"
                    className="flex items-center"
                    disabled={interactionMutation.isPending}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Agree
                  </Button>
                  <Button
                    onClick={handleFlag}
                    variant="outline"
                    className="flex items-center"
                    disabled={interactionMutation.isPending}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Flag Issue
                  </Button>
                  <p className="text-sm text-gray-500">
                    Does this answer look accurate and helpful?
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Why are you flagging this response?
                    </label>
                    <Textarea
                      placeholder="Please explain what's wrong (e.g., incorrect information, outdated, biased, incomplete)"
                      value={flagReason}
                      onChange={(e) => setFlagReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={submitFlag}
                      variant="destructive"
                      disabled={!flagReason.trim() || interactionMutation.isPending}
                    >
                      Submit Flag
                    </Button>
                    <Button
                      onClick={() => setShowFlagDialog(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        {!currentResponse && (
          <Card>
            <CardHeader>
              <CardTitle>How AiSays Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">1. Ask a Question</h3>
                  <p className="text-sm text-gray-600">
                    Type your question and get an AI-generated response instantly.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ThumbsUp className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">2. Provide Feedback</h3>
                  <p className="text-sm text-gray-600">
                    Agree with accurate answers or flag problematic responses.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">3. Improve Knowledge</h3>
                  <p className="text-sm text-gray-600">
                    Your feedback helps curate better AI responses for everyone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}