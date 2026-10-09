import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Bot, MessageSquare, Plus, Lock, Globe, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import type { Agent } from "@shared/schema";

export default function BrainDirectory() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [privacyFilter, setPrivacyFilter] = useState<"all" | "public" | "private">("public");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: templateAgents, isLoading: templateLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents/templates"],
  });

  const { data: publicAgents, isLoading: publicLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents/public"],
  });

  const { data: customAgents, isLoading: customLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents/my-agents"],
  });

  const agents = useMemo(() => {
    const templates = templateAgents || [];
    const publicUserAgents = publicAgents || [];
    const custom = customAgents || [];
    const allAgents = [...templates, ...publicUserAgents, ...custom];
    return Array.from(new Map(allAgents.map(agent => [agent.id, agent])).values());
  }, [templateAgents, publicAgents, customAgents]);

  const isLoading = templateLoading || publicLoading || customLoading;

  // Get unique categories for filtering
  const categories = useMemo(() => {
    if (!agents || !Array.isArray(agents)) return [];
    const uniqueCategories = [...new Set(agents.map(agent => agent.category))];
    return uniqueCategories.sort();
  }, [agents]);

  // Get categories with 10+ agents for category cards
  const largeCategoriesWithCounts = useMemo(() => {
    if (!agents || !Array.isArray(agents)) return [];
    
    const categoryCounts: { [key: string]: number } = {};
    agents.filter(agent => !agent.isPersonal).forEach(agent => {
      categoryCounts[agent.category] = (categoryCounts[agent.category] || 0) + 1;
    });
    
    return Object.entries(categoryCounts)
      .filter(([_, count]) => count >= 10)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [agents]);

  // Filter and sort agents alphabetically with privacy and category filtering
  const filteredAndSortedAgents = useMemo(() => {
    if (!agents || !Array.isArray(agents)) return [];

    const customIds = new Set((customAgents || []).map(a => a.id));

    const filtered = agents.filter((agent: Agent) => {
      if (customIds.has(agent.id)) {
        return false;
      }
      if (agent.isPersonal) {
        return false;
      }

      const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (agent.description && agent.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPrivacy = privacyFilter === "all" ||
        (privacyFilter === "public" && !agent.isPrivate) ||
        (privacyFilter === "private" && agent.isPrivate);

      const matchesCategory = categoryFilter === "all" || agent.category === categoryFilter;

      return matchesSearch && matchesPrivacy && matchesCategory;
    });

    return filtered.sort((a: Agent, b: Agent) => a.name.localeCompare(b.name));
  }, [agents, customAgents, searchQuery, privacyFilter, categoryFilter]);

  const filteredCustomAgents = useMemo(() => {
    if (!customAgents || !Array.isArray(customAgents)) return [];

    const filtered = customAgents.filter((agent: Agent) => {
      const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (agent.description && agent.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPrivacy = privacyFilter === "all" ||
        (privacyFilter === "public" && !agent.isPrivate) ||
        (privacyFilter === "private" && agent.isPrivate);

      const matchesCategory = categoryFilter === "all" || agent.category === categoryFilter;

      return matchesSearch && matchesPrivacy && matchesCategory;
    });

    return filtered.sort((a: Agent, b: Agent) => a.name.localeCompare(b.name));
  }, [customAgents, searchQuery, privacyFilter, categoryFilter]);

  // Group agents by first letter
  const groupedAgents = useMemo(() => {
    const groups: { [key: string]: Agent[] } = {};
    
    filteredAndSortedAgents.forEach((agent: Agent) => {
      const firstLetter = agent.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(agent);
    });

    return groups;
  }, [filteredAndSortedAgents]);

  const addAgentToContacts = async (agent: Agent) => {
    try {
      await apiRequest("POST", "/api/contacts/agents", {
        agentId: agent.id,
      });
      
      toast({
        title: "Brain Added",
        description: `${agent.name} has been added to your contacts.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add brain to contacts.",
        variant: "destructive",
      });
    }
  };

  const openAgentWebsite = (agent: Agent) => {
    // Open agent website in new tab - placeholder for now
    toast({
      title: "Website",
      description: `${agent.name} website feature coming soon.`,
    });
  };

  // Function to get website URL for an agent
  const getWebsiteUrl = async (agentId: number) => {
    try {
      const response = await apiRequest("GET", `/api/agent-website/${agentId}`);
      const websiteData = await response.json();
      return websiteData.websiteSlug ? `https://sharebrain.me/${websiteData.websiteSlug}` : null;
    } catch (error) {
      return null;
    }
  };

  const renderAgentCard = (agent: Agent) => (
    <Card key={agent.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bot className="text-primary h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg leading-tight text-white">{agent.name}</CardTitle>
                {agent.isPrivate ? (
                  <Lock className="h-4 w-4 text-slate-500" title="Private Brain" />
                ) : (
                  <Globe className="h-4 w-4 text-green-600" title="Public Brain" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {agent.category}
                </Badge>
                {agent.isPrivate ? (
                  <Badge variant="outline" className="text-xs border-slate-300 text-slate-600">
                    <Lock className="h-3 w-3 mr-1" />
                    Private
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                    <Globe className="h-3 w-3 mr-1" />
                    Public
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {agent.description && (
          <p className="text-sm text-white mb-3 line-clamp-2">
            {agent.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            {agent.voiceEnabled && (
              <Badge variant="outline" className="text-xs">
                Voice
              </Badge>
            )}
          </div>

          <div className="flex space-x-2">
            <Link href={`/chat/${agent.id}`}>
              <Button
                variant="default"
                size="sm"
                className="text-xs"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Chat
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addAgentToContacts(agent)}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );



  if (isLoading) {
    return (
      <>
        <header className="bg-black border-b border-white px-6 py-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Brain Directory</h2>
            <p className="text-white mt-1">Browse and discover all available AI brains</p>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-8 py-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 scrollbar-track-slate-100">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="bg-black border-b border-white px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Brain Directory</h2>
            <p className="text-white mt-1">
              Browse and discover all {Array.isArray(agents) ? agents.length : 0} available AI brains
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 scrollbar-track-slate-100">
        {/* Search Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search brains by name, category, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Filter Tabs */}
        <div className="mb-8">
          <Tabs value={privacyFilter} onValueChange={(value) => setPrivacyFilter(value as "all" | "public" | "private")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="flex items-center gap-2 text-2xl font-bold">
                <Bot className="h-5 w-5" />
                All Brains
              </TabsTrigger>
              <TabsTrigger value="public" className="flex items-center gap-2 text-2xl font-bold">
                <Globe className="h-5 w-5" />
                Public Brains
              </TabsTrigger>
              <TabsTrigger value="private" className="flex items-center gap-2 text-2xl font-bold">
                <Lock className="h-5 w-5" />
                Private Brains
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Privacy Information */}
          <div className="mt-4 p-4 bg-black border border-white rounded-lg">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {privacyFilter === "public" ? (
                  <Globe className="h-5 w-5 text-white" />
                ) : privacyFilter === "private" ? (
                  <Lock className="h-5 w-5 text-white" />
                ) : (
                  <Bot className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">
                  {privacyFilter === "public" && "Public Brains"}
                  {privacyFilter === "private" && "Private Brains"}
                  {privacyFilter === "all" && "Brain Privacy"}
                </h4>
                <p className="text-sm text-white">
                  {privacyFilter === "public" && "These brains are accessible via external API and can be integrated into third-party applications. Perfect for building bots, automations, and public services."}
                  {privacyFilter === "private" && "These brains are only accessible within ShareBrain and protected from external API access. Personal assistants and sensitive brains are automatically private."}
                  {privacyFilter === "all" && "Public brains are available via API for external integrations. Private brains are protected and only accessible within ShareBrain."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Agents Section */}
        {filteredCustomAgents.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Your Custom Brains</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomAgents.map((agent: Agent) => renderAgentCard(agent))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Browse by Category</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={categoryFilter === "all" ? "default" : "outline"}
              onClick={() => setCategoryFilter("all")}
              className="rounded-full"
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={categoryFilter === category ? "default" : "outline"}
                onClick={() => setCategoryFilter(category)}
                className="rounded-full"
              >
                {category}
                {category === "Language Teachers" && (
                  <Badge variant="secondary" className="ml-2">
                    {agents?.filter(a => a.category === category).length || 0}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-slate-600">
            {searchQuery ? (
              <>Showing {filteredAndSortedAgents.length} brains matching "{searchQuery}"</>
            ) : categoryFilter !== "all" ? (
              <>Showing {filteredAndSortedAgents.length} brains in {categoryFilter}</>
            ) : (
              <>Showing all {filteredAndSortedAgents.length} brains</>
            )}
          </p>
        </div>

        {/* Category Cards for Large Categories (when viewing all) */}
        {categoryFilter === "all" && largeCategoriesWithCounts.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Popular Categories</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {largeCategoriesWithCounts.map(({ category, count }) => (
                <Card 
                  key={category} 
                  className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary"
                  onClick={() => setCategoryFilter(category)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Bot className="text-white h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg leading-tight text-white">{category}</CardTitle>
                        <p className="text-sm text-white mt-1">{count} brains available</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-white mb-3">
                      {category === "Language Teachers" && "Learn languages with native-speaking AI tutors covering 100+ world languages."}
                      {category !== "Language Teachers" && `Explore ${count} specialized brains in ${category.toLowerCase()}.`}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {count} Brains
                      </Badge>
                      <ExternalLink className="h-4 w-4 text-white" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Individual Agents Display */}
        {categoryFilter !== "all" ? (
          /* Show filtered agents when a specific category is selected */
          Object.keys(groupedAgents).sort().map((letter) => (
            <div key={letter} className="mb-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                  {letter}
                </span>
                {letter}
              </h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedAgents[letter].map((agent: Agent) => renderAgentCard(agent))}
              </div>
            </div>
          ))
        ) : (
          /* Show individual agents from smaller categories when viewing all */
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Other Brains</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedAgents
                .filter(agent => !largeCategoriesWithCounts.some(lc => lc.category === agent.category))
                .map((agent: Agent) => renderAgentCard(agent))}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredAndSortedAgents.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Bot className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No brains found</h3>
                <p className="text-slate-600">
                  {searchQuery
                    ? `No brains match your search for "${searchQuery}"`
                    : "No brains available"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}