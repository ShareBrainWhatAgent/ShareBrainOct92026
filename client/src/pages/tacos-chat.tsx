import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { TacoChatInterface } from '@/components/taco-chat-interface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Heart, Star } from 'lucide-react';

interface Agent {
  id: number;
  name: string;
  description: string;
  category: string;
}

export default function TacosChat() {
  const params = useParams();
  const agentId = parseInt(params.id || '0');

  const { data: agent, isLoading } = useQuery<Agent>({
    queryKey: [`/api/agents/${agentId}`],
    enabled: !!agentId
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white text-center">
          <div className="text-6xl mb-4">🌮</div>
          <p>Loading your taco guide...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white text-center">
          <div className="text-6xl mb-4">❌</div>
          <p>Taco agent not found</p>
        </div>
      </div>
    );
  }

  // Check if this is the Tacos agent
  const isTacosAgent = agent.name.toLowerCase().includes('taco') || 
                     agent.category.toLowerCase().includes('food');

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Hero Section */}
      <div className="bg-black text-white py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white text-black rounded-full w-24 h-24 flex items-center justify-center font-bold text-3xl mx-auto mb-4">
            🌮
          </div>
          <h1 className="text-4xl font-bold mb-2">Tacos</h1>
          <p className="text-xl text-gray-300 mb-4">Your Personal Taco Enthusiast</p>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Discover amazing taco spots, get personalized recommendations, and explore authentic Mexican cuisine. 
            I remember your preferences and help you find the perfect tacos for every craving!
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="bg-black border-gray-700 h-[700px]">
              <TacoChatInterface agentId={agentId} agentName={agent.name} />
            </Card>
          </div>

          {/* Sidebar with Taco Features */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <Star className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-white rounded-lg p-3 hover:shadow-md cursor-pointer transition-shadow">
                  <p className="font-medium text-gray-800">Find Nearby Tacos</p>
                  <p className="text-sm text-gray-600">Get recommendations based on your location</p>
                </div>
                <div className="bg-white rounded-lg p-3 hover:shadow-md cursor-pointer transition-shadow">
                  <p className="font-medium text-gray-800">Share Preferences</p>
                  <p className="text-sm text-gray-600">Tell me about your spice level and favorites</p>
                </div>
                <div className="bg-white rounded-lg p-3 hover:shadow-md cursor-pointer transition-shadow">
                  <p className="font-medium text-gray-800">Explore Cuisine</p>
                  <p className="text-sm text-gray-600">Learn about different taco styles and regions</p>
                </div>
              </CardContent>
            </Card>

            {/* Taco Types */}
            <Card className="bg-gradient-to-br from-red-50 to-pink-100 border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  🌮 Popular Taco Styles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between bg-white rounded p-2">
                  <span className="font-medium">Carnitas</span>
                  <span className="text-sm text-gray-600">Slow-cooked pork</span>
                </div>
                <div className="flex items-center justify-between bg-white rounded p-2">
                  <span className="font-medium">Carne Asada</span>
                  <span className="text-sm text-gray-600">Grilled beef</span>
                </div>
                <div className="flex items-center justify-between bg-white rounded p-2">
                  <span className="font-medium">Al Pastor</span>
                  <span className="text-sm text-gray-600">Marinated pork</span>
                </div>
                <div className="flex items-center justify-between bg-white rounded p-2">
                  <span className="font-medium">Fish Tacos</span>
                  <span className="text-sm text-gray-600">Coastal specialty</span>
                </div>
                <div className="flex items-center justify-between bg-white rounded p-2">
                  <span className="font-medium">Veggie</span>
                  <span className="text-sm text-gray-600">Plant-based options</span>
                </div>
              </CardContent>
            </Card>

            {/* Memory Feature */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Heart className="h-5 w-5" />
                  Personal Memory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-700 mb-3">
                  I remember your taco preferences, favorite places, and dietary restrictions across all our conversations.
                </p>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Example:</p>
                  <p className="text-sm italic">"Remember that I love spicy food and my favorite taco place is La Taqueria"</p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}