import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Play, Trash2, BarChart3, Image, Clock, AlertCircle } from "lucide-react";

interface CacheStats {
  totalCachedWords: number;
  pendingGeneration: number;
  failedGeneration: number;
  cacheHitRate: number;
}

export default function VocabularyCacheAdmin() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/vocabulary-cache/stats");
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        toast({
          title: "Error",
          description: "Failed to load cache statistics",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load cache statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const prePopulateCurriculum = async () => {
    try {
      setProcessing(true);
      const response = await fetch("/api/vocabulary-cache/prepopulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Universal curriculum added to generation queue",
        });
        await loadStats();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to pre-populate curriculum",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pre-populate curriculum",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const processQueue = async () => {
    try {
      setProcessing(true);
      const response = await fetch("/api/vocabulary-cache/process-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: 10 }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Processing batch from generation queue",
        });
        await loadStats();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to process queue",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process queue",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const clearCache = async () => {
    if (!confirm("Are you sure you want to clear the entire vocabulary cache? This cannot be undone.")) {
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch("/api/vocabulary-cache/clear", {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Vocabulary cache cleared",
        });
        await loadStats();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to clear cache",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const totalWords = 500; // Universal curriculum has 500 words
  const progressPercentage = stats ? (stats.totalCachedWords / totalWords) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Vocabulary Cache Administration</h1>
          <p className="text-gray-400 mt-2">
            Manage the universal vocabulary image cache for interactive language lessons
          </p>
        </div>
        <Button
          onClick={loadStats}
          disabled={loading}
          variant="outline"
          className="bg-white text-black hover:bg-gray-100"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Cache Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Cached Words</CardTitle>
            <Image className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats?.totalCachedWords || 0}
            </div>
            <p className="text-xs text-gray-400">
              of {totalWords} total words
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Cache Hit Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats?.cacheHitRate || 0}%
            </div>
            <p className="text-xs text-gray-400">
              efficiency rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats?.pendingGeneration || 0}
            </div>
            <p className="text-xs text-gray-400">
              in generation queue
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats?.failedGeneration || 0}
            </div>
            <p className="text-xs text-gray-400">
              generation failures
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Cache Progress</CardTitle>
          <CardDescription className="text-gray-400">
            Universal curriculum vocabulary coverage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progressPercentage} className="w-full" />
          <div className="flex justify-between text-sm text-gray-400">
            <span>{stats?.totalCachedWords || 0} / {totalWords} words cached</span>
            <span>{Math.round(progressPercentage)}% complete</span>
          </div>
          {progressPercentage === 100 && (
            <Badge className="bg-green-600 text-white">
              🎉 Universal curriculum fully cached!
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Management Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Cache Management</CardTitle>
          <CardDescription className="text-gray-400">
            Actions to manage the vocabulary image cache
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={prePopulateCurriculum}
              disabled={processing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              Pre-populate Queue
            </Button>
            
            <Button
              onClick={processQueue}
              disabled={processing || (stats?.pendingGeneration || 0) === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${processing ? "animate-spin" : ""}`} />
              Process Queue (10)
            </Button>
            
            <Button
              onClick={clearCache}
              disabled={processing}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
          </div>

          <div className="text-sm text-gray-400 space-y-2">
            <p><strong>Pre-populate Queue:</strong> Adds all 500 universal curriculum words to the generation queue</p>
            <p><strong>Process Queue:</strong> Generates images for 10 pending words from the queue</p>
            <p><strong>Clear Cache:</strong> Removes all cached images and queue items (destructive)</p>
          </div>
        </CardContent>
      </Card>

      {/* Performance Benefits */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Performance Benefits</CardTitle>
          <CardDescription className="text-gray-400">
            How the vocabulary cache improves the interactive lesson experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-gray-300">
          <div className="flex items-start space-x-3">
            <Badge variant="outline" className="text-green-400 border-green-400">⚡</Badge>
            <div>
              <h4 className="font-medium text-white">Instant Loading</h4>
              <p className="text-sm text-gray-400">Cached images load instantly instead of waiting for generation</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Badge variant="outline" className="text-blue-400 border-blue-400">💰</Badge>
            <div>
              <h4 className="font-medium text-white">Cost Reduction</h4>
              <p className="text-sm text-gray-400">Generate each word image once instead of repeatedly for every user</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Badge variant="outline" className="text-purple-400 border-purple-400">🎯</Badge>
            <div>
              <h4 className="font-medium text-white">Consistent Learning</h4>
              <p className="text-sm text-gray-400">Same visual representation of each word across all languages and users</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}