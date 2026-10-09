import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Zap, 
  Users, 
  MessageSquare, 
  Code, 
  Shield
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-white bg-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-white">ShareBrain</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild className="text-white border-white hover:bg-white hover:text-black">
              <a href="/api/auth/google">Sign In with Google</a>
            </Button>
            <Button asChild className="bg-white text-black hover:bg-gray-200">
              <a href="/api/auth/google">Get Started</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Build simple yet powerful AI powered Brains which you can share with your friends and the world.
            <span className="text-blue-400 block">Share your brains!</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Create, customize and Share your AI Brains with your friends and the world. Use your creativity to make the world a better place. No coding required. Just bring your brain a bit of creativity and get started today!
          </p>
          <div className="flex justify-center">
            <Button size="lg" asChild className="text-lg px-8 bg-white text-black hover:bg-gray-200">
              <a href="/api/auth/google">Sign in with Google</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need to build AI agents
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Our platform provides all the tools and integrations you need to create 
              sophisticated AI agents that work for your business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border border-white bg-black shadow-lg">
              <CardHeader>
                <MessageSquare className="h-12 w-12 text-blue-400 mb-4" />
                <CardTitle className="text-white">Smart Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Build agents with advanced conversational abilities, context awareness, 
                  and natural language understanding.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-white bg-black shadow-lg">
              <CardHeader>
                <Zap className="h-12 w-12 text-yellow-400 mb-4" />
                <CardTitle className="text-white">Voice Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Add text-to-speech capabilities to your agents with multiple voice 
                  options and high-quality audio output.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-white bg-black shadow-lg">
              <CardHeader>
                <Code className="h-12 w-12 text-green-400 mb-4" />
                <CardTitle className="text-white">API Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Connect your agents to external applications with our comprehensive 
                  REST API and webhooks.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <Users className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Team Collaboration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Share agents with your team, collaborate on improvements, and 
                  manage permissions across your organization.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <Shield className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle>Enterprise Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Built with security in mind, featuring encryption, access controls, 
                  and compliance with industry standards.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <Bot className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle>Template Library</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Get started quickly with pre-built agent templates for common 
                  use cases like support, sales, and content creation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6" />
              <span className="text-xl font-bold">ShareBrain</span>
            </div>
            <p className="text-slate-400">
              © 2025 ShareBrain. Built with Replit.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
