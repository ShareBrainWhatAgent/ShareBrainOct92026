import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function MemoryTest() {
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [memories, setMemories] = useState<any>({});
  const { toast } = useToast();

  const analyzeMessage = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/memories/analyze", { message });
      setAnalysis(response);
      
      if (response.isMemoryRequest) {
        toast({
          title: "Memory Request Detected",
          description: `Category: ${response.classification?.category}`,
        });
      }
    } catch (error) {
      console.error("Error analyzing message:", error);
      toast({
        title: "Error",
        description: "Failed to analyze message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiRequest("GET", "/api/memories/categories");
      setCategories(response);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadMemories = async (agentId: number) => {
    try {
      const response = await apiRequest("GET", `/api/memories/${agentId}`);
      setMemories(response);
    } catch (error) {
      console.error("Error loading memories:", error);
    }
  };

  const storeMemory = async () => {
    if (!analysis?.classification) return;
    
    const agentId = 1; // Test with agent ID 1
    try {
      await apiRequest("POST", "/api/memories/store", {
        agentId,
        category: analysis.classification.category,
        key: analysis.classification.key,
        value: analysis.classification.value,
        originalStatement: analysis.originalStatement
      });
      
      toast({
        title: "Memory Stored",
        description: `Stored: ${analysis.classification.value}`,
      });
      
      // Reload memories
      loadMemories(agentId);
    } catch (error) {
      console.error("Error storing memory:", error);
      toast({
        title: "Error",
        description: "Failed to store memory",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Intelligent Memory System Test</CardTitle>
          <CardDescription>Test the new AI-powered memory classification system using Llama 3.1 70B</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter a message to analyze for memory content..."
              className="flex-1"
            />
            <Button onClick={analyzeMessage} disabled={loading}>
              {loading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
          
          {analysis && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Analysis Result</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={analysis.isMemoryRequest ? "default" : "secondary"}>
                      {analysis.isMemoryRequest ? "Memory Request" : "No Memory"}
                    </Badge>
                  </div>
                  
                  {analysis.isMemoryRequest && analysis.classification && (
                    <>
                      <div><strong>Category:</strong> {analysis.classification.category}</div>
                      <div><strong>Key:</strong> {analysis.classification.key}</div>
                      <div><strong>Value:</strong> {analysis.classification.value}</div>
                      <div><strong>Confidence:</strong> {(analysis.classification.confidence * 100).toFixed(1)}%</div>
                      <div><strong>Should Confirm:</strong> {analysis.classification.shouldConfirm ? "Yes" : "No"}</div>
                      
                      <Button onClick={storeMemory} className="mt-2">
                        Store Memory
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Memory Categories</CardTitle>
          <CardDescription>Available memory categories for classification</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadCategories} className="mb-4">
            Load Categories
          </Button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="p-3 border rounded-lg">
                <h4 className="font-semibold">{category.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                <div className="text-xs text-gray-500">
                  Examples: {category.examples.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stored Memories</CardTitle>
          <CardDescription>Memories stored for Agent ID 1</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => loadMemories(1)} className="mb-4">
            Load Memories
          </Button>
          {Object.keys(memories).length > 0 && (
            <div className="space-y-4">
              {Object.entries(memories).map(([category, categoryMemories]) => (
                <div key={category} className="space-y-2">
                  <h4 className="font-semibold capitalize">{category.replace('_', ' ')}</h4>
                  <div className="space-y-1">
                    {(categoryMemories as any[]).map((memory) => (
                      <div key={memory.id} className="p-2 bg-gray-50 rounded text-sm">
                        <strong>{memory.memoryKey.split('.')[1]}:</strong> {memory.memoryValue}
                      </div>
                    ))}
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}