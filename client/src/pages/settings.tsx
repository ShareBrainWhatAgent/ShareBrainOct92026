import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, CreditCard, Shield, X, CheckCircle, AlertTriangle, User, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useState, useEffect } from "react";

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  handle?: string;
  profileImageUrl?: string;
}

export default function Settings() {
  const { user } = useAuth();
  const { data: trialStatus } = useTrialStatus();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    handle: ""
  });

  // Fetch user profile for editing
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['/api/user/profile'],
    refetchOnWindowFocus: false
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setProfileData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        handle: profile.handle || ""
      });
    }
  }, [profile]);

  const cancelTrialMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/trial-cancel"),
    onSuccess: () => {
      toast({
        title: "Subscription cancelled",
        description: "Your trial has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/trial-status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation failed",
        description: error.message || "Failed to cancel subscription.",
        variant: "destructive",
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const handleCancelTrial = () => {
    cancelTrialMutation.mutate();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                placeholder="Enter your first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                placeholder="Enter your last name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="handle">Handle (Username)</Label>
            <Input
              id="handle"
              value={profileData.handle}
              onChange={(e) => setProfileData({ ...profileData, handle: e.target.value })}
              placeholder="Choose a unique handle (e.g., @johndoe)"
            />
            <p className="text-sm text-white">
              This is how other users can find and add you as a friend. Include the @ symbol.
            </p>
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={() => updateProfileMutation.mutate(profileData)}
              disabled={updateProfileMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white">Email</label>
              <p className="text-white">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-white">Handle</label>
              <p className="text-white">
                {profile?.handle || 'Not set'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {trialStatus?.isTrialActive ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">Free Trial</h3>
                  <p className="text-sm text-white">
                    Your 14-day free trial is currently active
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-white">Trial Started</label>
                  <p className="text-white">
                    {trialStatus.trialStartDate ? formatDate(trialStatus.trialStartDate) : 'Today'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-white">Trial Ends</label>
                  <p className="text-white">
                    {trialStatus.trialEndsAt ? formatDate(trialStatus.trialEndsAt) : 'In 14 days'}
                    {trialStatus.trialEndsAt && (
                      <span className="text-sm text-white ml-2">
                        ({getDaysRemaining(trialStatus.trialEndsAt)} days remaining)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-white">Billing Information</h4>
                    <p className="text-sm text-white mt-1">
                      After your trial ends, you'll be charged $10/month. You can cancel anytime before the trial expires.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={cancelTrialMutation.isPending}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel Trial
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Trial Subscription</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel your trial? This will:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Immediately end your access to ShareBrain</li>
                          <li>Cancel your upcoming $10/month subscription</li>
                          <li>Remove your saved payment method</li>
                        </ul>
                        <br />
                        You can always sign up again later if you change your mind.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Trial</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleCancelTrial}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Cancel Trial
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Active Subscription</h3>
              <p className="text-white mb-4">
                Start your free trial to access all ShareBrain features
              </p>
              <Button>
                <Calendar className="h-4 w-4 mr-2" />
                Start Free Trial
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage & Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-black border border-white rounded-lg">
                <div className="text-2xl font-bold text-white">Unlimited</div>
                <div className="text-sm text-white">AI Agents</div>
              </div>
              <div className="text-center p-4 bg-black border border-white rounded-lg">
                <div className="text-2xl font-bold text-white">Unlimited</div>
                <div className="text-sm text-white">Conversations</div>
              </div>
              <div className="text-center p-4 bg-black border border-white rounded-lg">
                <div className="text-2xl font-bold text-white">Full</div>
                <div className="text-sm text-white">API Access</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}