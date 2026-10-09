import { ExternalLink, Bot, Globe, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function UrlComparison() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">ShareBrain Agent URLs</h1>
          <p className="text-slate-600">Two different types of public URLs for each agent</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Agent Profile URL */}
          <Card className="h-full">
            <CardHeader className="text-center">
              <div className="p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-4">
                <Bot className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Agent Profile Page</CardTitle>
              <Badge variant="outline" className="w-fit mx-auto">
                /agent/agentname
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-medium text-blue-900 mb-2">Example URL:</p>
                <p className="text-sm text-blue-800 break-all">
                  https://sharebrain.me/agent/indiamotorcycletripagent
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-slate-900">Features:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Agent description and capabilities</li>
                  <li>• System prompt visible to users</li>
                  <li>• Sample conversation examples</li>
                  <li>• AI model and feature badges</li>
                  <li>• Call-to-action buttons to start chatting</li>
                  <li>• Link to companion website (if available)</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-slate-900">SEO Benefits:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Clean, descriptive URLs</li>
                  <li>• Accessible without login</li>
                  <li>• Rich meta descriptions</li>
                  <li>• Structured content for search engines</li>
                </ul>
              </div>
              
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => window.open('https://sharebrain.me/agent/indiamotorcycletripagent', '_blank')}
              >
                <Bot className="h-4 w-4 mr-2" />
                View Agent Profile
              </Button>
            </CardContent>
          </Card>

          {/* Agent Website URL */}
          <Card className="h-full">
            <CardHeader className="text-center">
              <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-4">
                <Globe className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">Agent Website</CardTitle>
              <Badge variant="outline" className="w-fit mx-auto">
                /agentname
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="font-medium text-green-900 mb-2">Example URL:</p>
                <p className="text-sm text-green-800 break-all">
                  https://sharebrain.me/indiamotorcycletripagent
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-slate-900">Features:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• AI-generated comprehensive website</li>
                  <li>• Multiple pages with detailed content</li>
                  <li>• Interactive navigation menu</li>
                  <li>• Rich media and styling</li>
                  <li>• Specific to agent's expertise domain</li>
                  <li>• Showcase of agent's knowledge base</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-slate-900">SEO Benefits:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Ultra-clean URLs (shortest possible)</li>
                  <li>• Multi-page content for better indexing</li>
                  <li>• Topic-specific content depth</li>
                  <li>• Optimized for domain expertise</li>
                </ul>
              </div>
              
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => window.open('https://sharebrain.me/agent-website/indiamotorcycletripagent', '_blank')}
              >
                <Globe className="h-4 w-4 mr-2" />
                Visit Agent Website
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 bg-white rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Public Access Summary</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="p-4 bg-blue-100 rounded-lg inline-block mb-4">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Both URLs are Public</h3>
              <p className="text-slate-600">
                No login required. Perfect for SEO, social sharing, and external linking.
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-green-100 rounded-lg inline-block mb-4">
                <ExternalLink className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Different Purposes</h3>
              <p className="text-slate-600">
                Profile pages explain the agent. Websites showcase their knowledge depth.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}