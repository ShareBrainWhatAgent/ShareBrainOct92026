import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ExternalLink, Code, Zap, Shield, Users, Globe, BarChart3 } from "lucide-react";

export default function ShopifyAgent() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-green-100 p-3 rounded-full mr-4">
            <ShoppingBag className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-white">ShareBrain Shopify App</h1>
        </div>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Embed intelligent AI customer service agents directly into Shopify stores. 
          Provide 24/7 automated support with access to real-time store data.
        </p>
      </div>

      {/* Key Features */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <Card className="p-6 bg-gray-900 border-gray-700">
          <div className="flex items-center mb-4">
            <Zap className="h-6 w-6 text-yellow-500 mr-3" />
            <h3 className="text-lg font-semibold text-white">AI-Powered Support</h3>
          </div>
          <p className="text-gray-300">
            Access to 180+ pre-trained ShareBrain agents for intelligent customer service automation.
          </p>
        </Card>

        <Card className="p-6 bg-gray-900 border-gray-700">
          <div className="flex items-center mb-4">
            <Globe className="h-6 w-6 text-blue-500 mr-3" />
            <h3 className="text-lg font-semibold text-white">Real-Time Integration</h3>
          </div>
          <p className="text-gray-300">
            Live access to products, orders, customer data, and inventory for personalized support.
          </p>
        </Card>

        <Card className="p-6 bg-gray-900 border-gray-700">
          <div className="flex items-center mb-4">
            <Shield className="h-6 w-6 text-green-500 mr-3" />
            <h3 className="text-lg font-semibold text-white">Privacy Compliant</h3>
          </div>
          <p className="text-gray-300">
            GDPR and CCPA ready with secure data handling. Customer data stays in Shopify.
          </p>
        </Card>

        <Card className="p-6 bg-gray-900 border-gray-700">
          <div className="flex items-center mb-4">
            <Users className="h-6 w-6 text-purple-500 mr-3" />
            <h3 className="text-lg font-semibold text-white">Easy Setup</h3>
          </div>
          <p className="text-gray-300">
            Simple installation through Shopify admin panel with customizable widget appearance.
          </p>
        </Card>

        <Card className="p-6 bg-gray-900 border-gray-700">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-6 w-6 text-red-500 mr-3" />
            <h3 className="text-lg font-semibold text-white">Analytics & Insights</h3>
          </div>
          <p className="text-gray-300">
            Track conversation metrics, customer satisfaction, and support performance.
          </p>
        </Card>

        <Card className="p-6 bg-gray-900 border-gray-700">
          <div className="flex items-center mb-4">
            <Code className="h-6 w-6 text-orange-500 mr-3" />
            <h3 className="text-lg font-semibold text-white">Developer Friendly</h3>
          </div>
          <p className="text-gray-300">
            Complete API integration with webhooks, OAuth 2.0, and theme extensions.
          </p>
        </Card>
      </div>

      {/* Demo Video/Image Section */}
      <Card className="p-8 mb-12 bg-gray-900 border-gray-700">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">How It Works</h2>
          <div className="bg-gray-800 rounded-lg p-8 border-2 border-dashed border-gray-600">
            <div className="flex items-center justify-center mb-4">
              <ShoppingBag className="h-16 w-16 text-green-500" />
            </div>
            <p className="text-gray-300 text-lg">
              Widget Demo Coming Soon
            </p>
            <p className="text-gray-400 mt-2">
              Interactive chat widget that embeds seamlessly into any Shopify theme
            </p>
          </div>
        </div>
      </Card>

      {/* App Store Status */}
      <Card className="p-8 mb-12 bg-gradient-to-r from-green-900 to-blue-900 border-green-700">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">🚀 Ready for Shopify App Store</h2>
          <p className="text-green-100 text-lg mb-6">
            Complete app development finished and ready for App Store submission
          </p>
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">✅ Technical Requirements</h3>
              <ul className="text-green-100 text-sm space-y-1">
                <li>• OAuth 2.0 Authentication</li>
                <li>• GDPR Compliance Webhooks</li>
                <li>• Theme Extensions</li>
                <li>• SSL & Security</li>
              </ul>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">✅ App Store Ready</h3>
              <ul className="text-green-100 text-sm space-y-1">
                <li>• Complete Documentation</li>
                <li>• Deployment Guide</li>
                <li>• Submission Requirements</li>
                <li>• Support Infrastructure</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Technical Architecture */}
      <Card className="p-8 mb-12 bg-gray-900 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Technical Architecture</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-white mb-2">Shopify Integration</h3>
            <p className="text-gray-300 text-sm">
              OAuth 2.0, REST API, webhooks, and theme extensions for seamless store integration
            </p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-white mb-2">ShareBrain Platform</h3>
            <p className="text-gray-300 text-sm">
              180+ AI agents powered by Llama 3.1 70B for intelligent customer service responses
            </p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-white mb-2">Customer Experience</h3>
            <p className="text-gray-300 text-sm">
              Embedded chat widget with mobile responsiveness and brand customization
            </p>
          </div>
        </div>
      </Card>

      {/* Documentation Links */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card className="p-6 bg-gray-900 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">📚 Development Resources</h3>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start border-gray-600 text-white hover:bg-gray-800"
              onClick={() => window.open('/shopify-app/README.md', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Complete Documentation
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start border-gray-600 text-white hover:bg-gray-800"
              onClick={() => window.open('/shopify-app/DEPLOYMENT_GUIDE.md', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Deployment Guide
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-900 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">🛠️ Technical Files</h3>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start border-gray-600 text-white hover:bg-gray-800"
              onClick={() => window.open('https://github.com/ShareBrainWhatAgent/AiAgentPlatformJuly3/tree/main/shopify-app', '_blank')}
            >
              <Code className="h-4 w-4 mr-2" />
              View Source Code
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start border-gray-600 text-white hover:bg-gray-800"
              onClick={() => window.open('/shopify-app/shopify.app.toml', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              App Configuration
            </Button>
          </div>
        </Card>
      </div>

      {/* Next Steps */}
      <Card className="p-8 bg-gradient-to-r from-blue-900 to-purple-900 border-blue-700">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready for App Store Submission</h2>
          <p className="text-blue-100 mb-6">
            The ShareBrain Shopify App is fully developed and ready for submission to the Shopify App Store
          </p>
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => window.open('https://partners.shopify.com', '_blank')}
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Shopify Partners
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-purple-900"
              onClick={() => window.open('https://apps.shopify.com', '_blank')}
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              App Store
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}