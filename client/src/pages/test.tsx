import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Globe, GitBranch, Zap } from "lucide-react";

export default function Test() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <Zap className="h-8 w-8 text-yellow-500 mr-2" />
            <h1 className="text-4xl font-bold">Test Environment</h1>
          </div>
          <p className="text-gray-300 text-lg">
            You're now viewing the ShareBrain test environment
          </p>
          <Badge variant="outline" className="mt-2 text-yellow-500 border-yellow-500">
            TEST MODE ACTIVE
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Globe className="h-5 w-5 mr-2 text-blue-400" />
                Environment Info
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <span className="text-yellow-400">Test</span>
                </div>
                <div className="flex justify-between">
                  <span>URL:</span>
                  <span className="text-blue-400">https://sharebrain.me/test</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
                    <span className="text-green-400">Active</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <GitBranch className="h-5 w-5 mr-2 text-purple-400" />
                Deployment Info
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Branch:</span>
                  <span className="text-purple-400">develop</span>
                </div>
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span className="text-yellow-400">Development</span>
                </div>
                <div className="flex justify-between">
                  <span>Target:</span>
                  <span className="text-blue-400">Test Server</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Test Environment Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  <span>Safe testing environment</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  <span>Isolated from production</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  <span>Latest development features</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  <span>Real-time deployment</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  <span>Development debugging</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  <span>Git workflow testing</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-gray-400 mb-4">
            This test environment is perfect for validating changes before production deployment.
          </p>
          <Button 
            onClick={() => window.location.href = '/git-manager'} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            Go to Git Manager
          </Button>
        </div>
      </div>
    </div>
  );
}