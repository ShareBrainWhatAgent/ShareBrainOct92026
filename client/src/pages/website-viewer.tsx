import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, ArrowLeft, ExternalLink, Download, Code } from "lucide-react";
import { Link } from "wouter";

export default function WebsiteViewer() {
  const [match, params] = useRoute("/websites/:id");
  const websiteId = params?.id;

  const { data: website, isLoading } = useQuery({
    queryKey: ["/api/agent-websites", websiteId],
    queryFn: async () => {
      const response = await fetch(`/api/agent-websites/${websiteId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch website");
      }
      return response.json();
    },
    enabled: !!websiteId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!website) {
    return (
      <div className="text-center py-12">
        <Globe className="h-16 w-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Website not found</h3>
        <p className="text-slate-600 mb-4">The website you're looking for doesn't exist.</p>
        <Link href="/websites">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Websites
          </Button>
        </Link>
      </div>
    );
  }

  const downloadWebsite = () => {
    const blob = new Blob([website.code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${website.name.replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/websites">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{website.agentName}</h1>
            <p className="text-slate-600 mt-1">Companion Website</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={website.status === 'deployed' ? 'default' : 'secondary'}>
            {website.status}
          </Badge>
          {website.isPublic && (
            <Badge variant="outline">Public</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Website Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  srcDoc={website.code}
                  className="w-full h-96"
                  title={`${website.agentName} Website`}
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Website Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => window.open(website.websiteUrl, '_blank')}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
              
              <Button 
                variant="outline"
                onClick={downloadWebsite}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download HTML
              </Button>
              
              <Button 
                variant="outline"
                className="w-full"
              >
                <Code className="h-4 w-4 mr-2" />
                View Source
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Website Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm font-medium text-slate-700">Agent Name</div>
                <div className="text-sm text-slate-600">{website.agentName}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-slate-700">Description</div>
                <div className="text-sm text-slate-600">{website.description}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-slate-700">Created</div>
                <div className="text-sm text-slate-600">
                  {new Date(website.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-slate-700">Last Updated</div>
                <div className="text-sm text-slate-600">
                  {new Date(website.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}