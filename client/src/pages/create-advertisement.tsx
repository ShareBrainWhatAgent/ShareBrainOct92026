import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Facebook, Instagram, Twitter, Linkedin, Phone, Mail, Globe, MapPin, DollarSign, Tag, Target } from "lucide-react";

export default function CreateAdvertisement() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    website: "",
    phoneNumber: "",
    email: "",
    address: "",
    facebookUrl: "",
    instagramUrl: "",
    twitterUrl: "",
    linkedinUrl: "",
    keywords: "",
    targetAgentIds: "",
  });

  const createAdMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/advertisements", data);
    },
    onSuccess: () => {
      toast({
        title: "Advertisement Created",
        description: "Your advertisement has been created successfully and is now active!",
      });
      navigate("/advertisements");
    },
    onError: (error: any) => {
      console.error("Error creating advertisement:", error);
      toast({
        title: "Error",
        description: "Failed to create advertisement. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.keywords.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in Title, Description, and Keywords. All other fields are optional.",
        variant: "destructive",
      });
      return;
    }

    createAdMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-full p-4 py-8 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Advertisement</h1>
          <p className="text-gray-600">
            Reach potential customers through targeted ads in AI agent conversations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Advertisement Details
                </CardTitle>
                <CardDescription>
                  Create your advertisement to reach customers through AI agent conversations<br />
                  <span className="text-green-600 font-medium">Only title, description, and keywords are required - all other fields are optional</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Advertisement Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Professional Spanish Tutoring Services"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your services, experience, and what makes you unique..."
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        rows={4}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="keywords">Keywords * (comma-separated)</Label>
                      <Input
                        id="keywords"
                        placeholder="spanish teacher, spanish tutor, language learning, spanish lessons"
                        value={formData.keywords}
                        onChange={(e) => handleInputChange("keywords", e.target.value)}
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Keywords trigger your ad when users mention them in conversations
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Contact Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="website"
                            placeholder="https://yourwebsite.com"
                            value={formData.website}
                            onChange={(e) => handleInputChange("website", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="phoneNumber"
                            placeholder="(555) 123-4567"
                            value={formData.phoneNumber}
                            onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="contact@yourservice.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="address"
                            placeholder="City, State"
                            value={formData.address}
                            onChange={(e) => handleInputChange("address", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Social Media Links */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Social Media</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="facebookUrl">Facebook</Label>
                        <div className="relative">
                          <Facebook className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="facebookUrl"
                            placeholder="https://facebook.com/yourpage"
                            value={formData.facebookUrl}
                            onChange={(e) => handleInputChange("facebookUrl", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="instagramUrl">Instagram</Label>
                        <div className="relative">
                          <Instagram className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="instagramUrl"
                            placeholder="https://instagram.com/yourprofile"
                            value={formData.instagramUrl}
                            onChange={(e) => handleInputChange("instagramUrl", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="twitterUrl">Twitter</Label>
                        <div className="relative">
                          <Twitter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="twitterUrl"
                            placeholder="https://twitter.com/yourhandle"
                            value={formData.twitterUrl}
                            onChange={(e) => handleInputChange("twitterUrl", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="linkedinUrl">LinkedIn</Label>
                        <div className="relative">
                          <Linkedin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="linkedinUrl"
                            placeholder="https://linkedin.com/in/yourprofile"
                            value={formData.linkedinUrl}
                            onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Submit Button */}
                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/advertisements")}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createAdMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {createAdMutation.isPending ? "Creating..." : "Create Advertisement"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">$10</div>
                  <div className="text-sm text-gray-500">per month</div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Targeted placement</span>
                    <Badge variant="secondary">✓</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Keyword targeting</span>
                    <Badge variant="secondary">✓</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Analytics tracking</span>
                    <Badge variant="secondary">✓</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Agent-specific ads</span>
                    <Badge variant="secondary">✓</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 rounded-full p-1 mt-1">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <div className="font-medium">Keyword Targeting</div>
                    <div className="text-sm text-gray-600">
                      Your ad appears when users mention your keywords
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 rounded-full p-1 mt-1">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <div>
                    <div className="font-medium">Agent Integration</div>
                    <div className="text-sm text-gray-600">
                      Ads appear naturally in relevant agent conversations
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 rounded-full p-1 mt-1">
                    <span className="text-xs font-bold text-blue-600">3</span>
                  </div>
                  <div>
                    <div className="font-medium">Performance Tracking</div>
                    <div className="text-sm text-gray-600">
                      Monitor impressions, clicks, and engagement
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}