import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  GitBranch, 
  GitCommit, 
  Upload, 
  Play, 
  Code, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface GitStatus {
  branch: string;
  status: string;
  clean: boolean;
  deploymentTarget?: 'dev' | 'production';
}

export default function GitManager() {
  const [commitMessage, setCommitMessage] = useState('');
  const [newBranch, setNewBranch] = useState('');
  const [featureName, setFeatureName] = useState('');
  const [deploymentTarget, setDeploymentTarget] = useState<'dev' | 'production'>('dev');

  // Get Git status
  const { data: gitStatus, isLoading: statusLoading } = useQuery<GitStatus>({
    queryKey: ['/api/git/status'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Update local deployment target when Git status changes
  useEffect(() => {
    if (gitStatus?.deploymentTarget) {
      setDeploymentTarget(gitStatus.deploymentTarget);
    }
  }, [gitStatus?.deploymentTarget]);

  // Switch to development deployment target
  const switchToDevelopment = useMutation({
    mutationFn: () => apiRequest('POST', '/api/git/switch-development'),
    onSuccess: () => {
      setDeploymentTarget('dev');
      toast({
        title: "Development Mode",
        description: "Switched to development - deployments will go to https://sharebrain.me/test",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/git/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Switch Failed",
        description: error.message || "Failed to switch to development mode",
        variant: "destructive",
      });
    },
  });

  // Switch to production deployment target
  const switchToProduction = useMutation({
    mutationFn: () => apiRequest('POST', '/api/git/switch-production'),
    onSuccess: () => {
      setDeploymentTarget('production');
      toast({
        title: "Production Mode",
        description: "Switched to production - deployments will go to https://sharebrain.me",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/git/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Switch Failed",
        description: error.message || "Failed to switch to production mode",
        variant: "destructive",
      });
    },
  });

  // Switch to any branch
  const switchToBranch = useMutation({
    mutationFn: (branch: string) => apiRequest('POST', '/api/git/switch-branch', { branch }),
    onSuccess: () => {
      toast({
        title: "Branch Switched",
        description: `Successfully switched to ${newBranch} branch`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/git/status'] });
      setNewBranch('');
    },
    onError: (error: any) => {
      toast({
        title: "Switch Failed",
        description: error.message || "Failed to switch branch",
        variant: "destructive",
      });
    },
  });

  // Create feature branch
  const createFeatureBranch = useMutation({
    mutationFn: (featureName: string) => apiRequest('POST', '/api/git/create-feature', { featureName }),
    onSuccess: () => {
      toast({
        title: "Feature Branch Created",
        description: `Successfully created feature/${featureName} branch`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/git/status'] });
      setFeatureName('');
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create feature branch",
        variant: "destructive",
      });
    },
  });

  // Commit changes
  const commitChanges = useMutation({
    mutationFn: (message: string) => apiRequest('POST', '/api/git/commit', { message }),
    onSuccess: () => {
      toast({
        title: "Changes Committed",
        description: "Successfully committed changes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/git/status'] });
      setCommitMessage('');
    },
    onError: (error: any) => {
      toast({
        title: "Commit Failed",
        description: error.message || "Failed to commit changes",
        variant: "destructive",
      });
    },
  });

  // Push to remote
  const pushToRemote = useMutation({
    mutationFn: () => apiRequest('POST', '/api/git/push'),
    onSuccess: () => {
      toast({
        title: "Push Successful",
        description: "Successfully pushed to remote repository",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/git/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Push Failed",
        description: error.message || "Failed to push to remote",
        variant: "destructive",
      });
    },
  });

  const getBranchColor = (branch: string) => {
    if (branch === 'main') return 'bg-red-500';
    if (branch === 'develop') return 'bg-yellow-500';
    if (branch?.startsWith('feature/')) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const getBranchIcon = (branch: string) => {
    if (branch === 'main') return '🚀';
    if (branch === 'develop') return '🔧';
    if (branch?.startsWith('feature/')) return '💡';
    return '🌿';
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Git Branch Manager</h1>
            <p className="text-gray-400 mt-2">
              Manage your development workflow with easy branch switching
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Code className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-semibold">ShareBrain</span>
          </div>
        </div>

        {/* Current Status */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GitBranch className="h-5 w-5" />
              <span>Current Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading Git status...</span>
              </div>
            ) : gitStatus ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getBranchIcon(gitStatus.branch)}</span>
                  <Badge className={`${getBranchColor(gitStatus.branch)} text-white`}>
                    {gitStatus.branch}
                  </Badge>
                  <span className="text-sm text-gray-400">Current Branch</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {gitStatus.clean ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm">
                    {gitStatus.clean ? 'Working directory clean' : 'Changes detected'}
                  </span>
                </div>
                
                {gitStatus.status && (
                  <div className="text-sm text-gray-400 font-mono bg-gray-800 p-2 rounded">
                    {gitStatus.status}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-400">Failed to load Git status</div>
            )}
          </CardContent>
        </Card>

        {/* Branch Switching */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GitBranch className="h-5 w-5" />
              <span>Branch Operations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Quick Switch Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => switchToDevelopment.mutate()}
                disabled={switchToDevelopment.isPending || gitStatus?.branch === 'develop'}
                className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700"
              >
                {switchToDevelopment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>🔧</span>
                )}
                <span>Switch to Development</span>
              </Button>
              
              <Button
                onClick={() => switchToProduction.mutate()}
                disabled={switchToProduction.isPending || gitStatus?.branch === 'main'}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
              >
                {switchToProduction.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>🚀</span>
                )}
                <span>Switch to Production</span>
              </Button>
            </div>

            <Separator className="bg-gray-700" />

            {/* Custom Branch Switch */}
            <div className="space-y-2">
              <Label htmlFor="branch">Switch to Custom Branch</Label>
              <div className="flex space-x-2">
                <Input
                  id="branch"
                  placeholder="Enter branch name..."
                  value={newBranch}
                  onChange={(e) => setNewBranch(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                />
                <Button
                  onClick={() => switchToBranch.mutate(newBranch)}
                  disabled={switchToBranch.isPending || !newBranch.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {switchToBranch.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GitBranch className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Create Feature Branch */}
            <div className="space-y-2">
              <Label htmlFor="feature">Create New Feature Branch</Label>
              <div className="flex space-x-2">
                <Input
                  id="feature"
                  placeholder="Enter feature name..."
                  value={featureName}
                  onChange={(e) => setFeatureName(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                />
                <Button
                  onClick={() => createFeatureBranch.mutate(featureName)}
                  disabled={createFeatureBranch.isPending || !featureName.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createFeatureBranch.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deployment Control */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5" />
              <span>Deployment Control</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border-2 ${deploymentTarget === 'dev' ? 'border-yellow-500 bg-yellow-900/20' : 'border-gray-600 bg-gray-800'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🔧</span>
                    <span className="font-semibold">Development</span>
                  </div>
                  {deploymentTarget === 'dev' && (
                    <Badge className="bg-yellow-600">Active</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  Deploy to test environment: https://sharebrain.me/test
                </p>
                <Button
                  onClick={() => {
                    setDeploymentTarget('dev');
                    switchToDevelopment.mutate();
                  }}
                  className={`w-full ${deploymentTarget === 'dev' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                >
                  {deploymentTarget === 'dev' ? 'Currently Selected' : 'Select Development'}
                </Button>
              </div>
              
              <div className={`p-4 rounded-lg border-2 ${deploymentTarget === 'production' ? 'border-red-500 bg-red-900/20' : 'border-gray-600 bg-gray-800'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🚀</span>
                    <span className="font-semibold">Production</span>
                  </div>
                  {deploymentTarget === 'production' && (
                    <Badge className="bg-red-600">Active</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  Deploy to live site: https://sharebrain.me
                </p>
                <Button
                  onClick={() => {
                    setDeploymentTarget('production');
                    switchToProduction.mutate();
                  }}
                  className={`w-full ${deploymentTarget === 'production' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                >
                  {deploymentTarget === 'production' ? 'Currently Selected' : 'Select Production'}
                </Button>
              </div>
            </div>

            <div className="text-center">
              <Button
                onClick={async () => {
                  try {
                    // First, set the deployment target via API
                    if (deploymentTarget === 'dev') {
                      await switchToDevelopment.mutateAsync();
                    } else {
                      await switchToProduction.mutateAsync();
                    }
                    
                    // Then deploy using the unified endpoint
                    window.open('/deploy', '_blank');
                  } catch (error) {
                    toast({
                      title: "Deployment Failed",
                      description: "Failed to set deployment target",
                      variant: "destructive",
                    });
                  }
                }}
                className={`px-8 py-3 text-lg font-semibold ${
                  deploymentTarget === 'dev' 
                    ? 'bg-yellow-600 hover:bg-yellow-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                <Play className="h-5 w-5 mr-2" />
                Deploy to {deploymentTarget === 'dev' ? 'Test Environment' : 'Production'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Git Operations */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GitCommit className="h-5 w-5" />
              <span>Git Operations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Commit Changes */}
            <div className="space-y-2">
              <Label htmlFor="commit">Commit Message</Label>
              <div className="flex space-x-2">
                <Input
                  id="commit"
                  placeholder="Enter commit message..."
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && commitMessage.trim()) {
                      commitChanges.mutate(commitMessage);
                    }
                  }}
                />
                <Button
                  onClick={() => commitChanges.mutate(commitMessage)}
                  disabled={commitChanges.isPending || !commitMessage.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {commitChanges.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GitCommit className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Push to Remote */}
            <Button
              onClick={() => pushToRemote.mutate()}
              disabled={pushToRemote.isPending}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {pushToRemote.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Push to Remote Repository
            </Button>
          </CardContent>
        </Card>

        {/* Environment Info */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle>Environment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <div className="font-semibold text-red-400">🚀 Production</div>
                <div className="text-gray-400">main branch</div>
                <div className="text-gray-400">https://sharebrain.me</div>
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-yellow-400">🔧 Staging</div>
                <div className="text-gray-400">develop branch</div>
                <div className="text-gray-400">https://test.sharebrain.me</div>
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-blue-400">💡 Development</div>
                <div className="text-gray-400">feature/* branches</div>
                <div className="text-gray-400">Local testing</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}