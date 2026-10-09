import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  BarChart3, 
  Phone, 
  Mail, 
  Globe, 
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  TrendingUp,
  Users,
  MousePointer
} from "lucide-react";

export default function Advertisements() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data: advertisements = [], isLoading } = useQuery({
    queryKey: ["/api/advertisements"],
  });

  const toggleAdMutation = useMutation({
    mutationFn: async (data: { id: number; isActive: boolean }) => {
      return await apiRequest("PUT", `/api/advertisements/${data.id}`, {
        isActive: !data.isActive
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertisements"] });
      toast({
        title: "Advertisement Updated",
        description: "Advertisement status updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Error updating advertisement:", error);
      toast({
        title: "Error",
        description: "Failed to update advertisement.",
        variant: "destructive",
      });
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/advertisements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertisements"] });
      toast({
        title: "Advertisement Deleted",
        description: "Advertisement deleted successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting advertisement:", error);
      toast({
        title: "Error",
        description: "Failed to delete advertisement.",
        variant: "destructive",
      });
    },
  });

  const handleToggleActive = (ad: any) => {
    toggleAdMutation.mutate({ id: ad.id, isActive: ad.isActive });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this advertisement?")) {
      deleteAdMutation.mutate(id);
    }
  };

  const getSocialLinks = (ad: any) => {
    const links = [];
    if (ad.facebookUrl) links.push({ icon: Facebook, url: ad.facebookUrl, name: "Facebook" });
    if (ad.instagramUrl) links.push({ icon: Instagram, url: ad.instagramUrl, name: "Instagram" });
    if (ad.twitterUrl) links.push({ icon: Twitter, url: ad.twitterUrl, name: "Twitter" });
    if (ad.linkedinUrl) links.push({ icon: Linkedin, url: ad.linkedinUrl, name: "LinkedIn" });
    return links;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isAuthenticated ? "My Advertisements" : "Business Directory"}
              </h1>
              <p className="text-gray-600">
                {isAuthenticated 
                  ? "Manage your advertising campaigns and track performance" 
                  : "Find local service providers and businesses in your area"
                }
              </p>
            </div>
            {isAuthenticated && (
              <Button 
                onClick={() => navigate("/create-advertisement")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Ad
              </Button>
            )}
          </div>
        </div>

        {advertisements.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mb-4">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isAuthenticated ? "No advertisements yet" : "No businesses listed yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {isAuthenticated 
                  ? "Create your first advertisement to start reaching potential customers"
                  : "Check back soon for local service providers and businesses in your area"
                }
              </p>
              {isAuthenticated && (
                <Button 
                  onClick={() => navigate("/create-advertisement")}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Ad
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advertisements.map((ad: any) => (
              <Card key={ad.id} className={`${ad.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{ad.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {ad.description}
                      </CardDescription>
                    </div>
                    <Badge variant={ad.isActive ? "default" : "secondary"}>
                      {ad.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Keywords */}
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Keywords</div>
                      <div className="flex flex-wrap gap-1">
                        {ad.keywords.split(',').slice(0, 3).map((keyword: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword.trim()}
                          </Badge>
                        ))}
                        {ad.keywords.split(',').length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{ad.keywords.split(',').length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Performance Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-600">
                          <Eye className="h-4 w-4" />
                          <span className="text-lg font-bold">{ad.impressions || 0}</span>
                        </div>
                        <div className="text-xs text-gray-500">Impressions</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-600">
                          <MousePointer className="h-4 w-4" />
                          <span className="text-lg font-bold">{ad.clicks || 0}</span>
                        </div>
                        <div className="text-xs text-gray-500">Clicks</div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-2">
                      {ad.website && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Globe className="h-4 w-4" />
                          <a href={ad.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                            {ad.website}
                          </a>
                        </div>
                      )}
                      {ad.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{ad.phoneNumber}</span>
                        </div>
                      )}
                      {ad.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{ad.email}</span>
                        </div>
                      )}
                      {ad.address && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{ad.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Social Links */}
                    {getSocialLinks(ad).length > 0 && (
                      <div className="flex items-center gap-2">
                        {getSocialLinks(ad).map(({ icon: Icon, url, name }) => (
                          <a
                            key={name}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Icon className="h-4 w-4" />
                          </a>
                        ))}
                      </div>
                    )}

                    <Separator />

                    {/* Actions - Only show for authenticated users */}
                    {isAuthenticated && (
                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(ad)}
                          disabled={toggleAdMutation.isPending}
                        >
                          {ad.isActive ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </Button>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/edit-advertisement/${ad.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(ad.id)}
                            disabled={deleteAdMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Performance Overview - Only show for authenticated users */}
        {isAuthenticated && advertisements.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {advertisements.length}
                  </div>
                  <div className="text-sm text-gray-500">Total Ads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {advertisements.filter((ad: any) => ad.isActive).length}
                  </div>
                  <div className="text-sm text-gray-500">Active Ads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {advertisements.reduce((sum: number, ad: any) => sum + (ad.impressions || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-500">Total Impressions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {advertisements.reduce((sum: number, ad: any) => sum + (ad.clicks || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-500">Total Clicks</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}