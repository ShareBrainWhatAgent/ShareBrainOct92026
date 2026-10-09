import { ArrowLeft, Bot, ExternalLink, Sparkles, Volume2, MessageSquare, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function ChatDemo() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/agents">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Agents
            </Button>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">India Motorcycle Trip Agent</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  Travel & Transportation
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Llama 3.1 70B
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2 gap-1 bg-green-50 border-green-200 hover:bg-green-100"
                  onClick={() => window.open("https://sharebrain.me/agent-website/indiamotorcycletripagent", '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                  Website
                </Button>
                <Badge variant="outline" className="text-xs gap-1">
                  <Volume2 className="h-3 w-3" />
                  Voice
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" disabled>
              <UserPlus className="h-4 w-4" />
              Add Friends
            </Button>
            
            <Button variant="outline" size="sm" disabled>
              Clear Chat
            </Button>
          </div>
        </div>
        
        <p className="text-slate-600 mt-3 text-sm max-w-2xl line-clamp-2">
          Expert guide for motorcycle travel across India's diverse regions, from the Himalayas to coastal roads.
        </p>
        <p className="text-slate-600 mt-2 text-sm">
          If you need instructions, please type "instructions" into the chatbox.
        </p>
      </header>

      {/* Chat Interface */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="h-full flex flex-col max-w-4xl mx-auto">
          {/* Website Link Banner - prominently displayed in welcome */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mx-6 mt-6">
            <div className="flex items-center justify-center gap-4">
              <ExternalLink className="h-6 w-6 text-green-600" />
              <div className="text-center">
                <p className="font-semibold text-green-900 mb-1">Companion Website Available</p>
                <p className="text-sm text-green-700 mb-3">Explore this agent's comprehensive knowledge base and travel guides</p>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => window.open("https://sharebrain.me/agent-website/indiamotorcycletripagent", '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Website
                </Button>
              </div>
            </div>
          </div>
          
          {/* Welcome content */}
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="p-4 bg-slate-50 rounded-full mb-4">
              <Sparkles className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Start chatting with India Motorcycle Trip Agent
            </h3>
            <p className="text-slate-600 mb-6 max-w-md">
              This agent is specialized in travel & transportation. 
              Ask a question or say hello to get started!
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
              <p className="text-blue-800 text-sm font-medium mb-2">✨ Demo Preview</p>
              <p className="text-blue-700 text-sm">
                This is what the chat interface looks like with the website link! 
                Notice the green website button in the header and the prominent banner above.
              </p>
            </div>
          </div>
          
          {/* Fixed input at bottom */}
          <div className="border-t border-slate-200 p-4 bg-white">
            <div className="flex space-x-3 max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Message India Motorcycle Trip Agent..."
                disabled
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100"
              />
              <Button disabled className="bg-primary hover:bg-blue-700 text-white">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}