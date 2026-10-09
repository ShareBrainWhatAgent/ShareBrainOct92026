import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, ExternalLink, Eye, Code, Calendar } from "lucide-react";
import { Link } from "wouter";

interface AgentWebsite {
  id: string;
  name: string;
  description: string;
  agentName: string;
  websiteUrl: string;
  isPublic: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function Websites() {
  const { data: websites, isLoading } = useQuery<AgentWebsite[]>({
    queryKey: ["/api/agent-websites"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Agent Websites</h1>
          <p className="text-slate-600 mt-2">
            Companion websites showcasing your agents' knowledge and capabilities
          </p>
        </div>
      </div>

      {!websites || websites.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Globe className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No websites yet</h3>
              <p className="text-slate-600 mb-4">
                Generate companion websites for your agents to showcase their knowledge
              </p>
              <Link href="/agents">
                <Button>
                  <Globe className="h-4 w-4 mr-2" />
                  Go to My Agents
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {websites.map((website) => (
            <Card key={website.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <Badge variant={website.status === 'deployed' ? 'default' : 'secondary'}>
                      {website.status}
                    </Badge>
                  </div>
                  {website.isPublic && (
                    <Badge variant="outline">Public</Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{website.agentName}</CardTitle>
                <CardDescription>{website.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(website.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => window.open(website.websiteUrl, '_blank')}
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Website
                    </Button>
                    
                    <Button size="sm" variant="outline">
                      <Code className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}