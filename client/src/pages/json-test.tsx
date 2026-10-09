import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

export default function JsonTest() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTestResult(null);
    }
  };

  const handleTest = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/test-json', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setTestResult(result);

      if (response.ok) {
        toast({
          title: "Test Successful",
          description: "JSON file parsed successfully!",
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.error || "JSON parsing failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: "Test Error",
        description: "Failed to test JSON file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">JSON File Test</h1>
      
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Test JSON File Upload</span>
          </CardTitle>
          <CardDescription>
            Debug tool to test JSON file parsing and identify issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="file"
              accept=".json,.jsonl,.geojson,application/json,text/json,*/*"
              onChange={handleFileChange}
            />
            {selectedFile && (
              <p className="text-sm text-gray-600">
                Selected: {selectedFile.name} ({selectedFile.size} bytes)
              </p>
            )}
          </div>

          <Button 
            onClick={handleTest} 
            disabled={!selectedFile || isLoading}
            className="w-full"
          >
            {isLoading ? "Testing..." : "Test JSON File"}
          </Button>

          {testResult && (
            <div className="mt-6 p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}