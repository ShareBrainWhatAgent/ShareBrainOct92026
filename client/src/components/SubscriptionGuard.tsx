import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CreditCard, Clock } from "lucide-react";

interface SubscriptionStatus {
  needsSubscription: boolean;
  subscriptionStatus: string;
  trialExpired: boolean;
  isTrialActive: boolean;
  hasPaymentMethod: boolean;
  trialEndDate?: string;
}

interface SubscriptionGuardProps {
  children: React.ReactNode;
  feature?: string;
  allowPersonalAgents?: boolean;
}

export function SubscriptionGuard({ 
  children, 
  feature = "this feature",
  allowPersonalAgents = false 
}: SubscriptionGuardProps) {
  const [, setLocation] = useLocation();
  const [isBlocked, setIsBlocked] = useState(false);

  // Real-time subscription validation - no caching
  const { data: subscriptionStatus, isLoading, error } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/user/subscription-status'],
    queryFn: async () => {
      const response = await fetch('/api/user/subscription-status', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json();
          throw new Error(JSON.stringify(errorData));
        }
        throw new Error('Failed to validate subscription');
      }
      
      return response.json();
    },
    staleTime: 0, // No caching - always fetch fresh
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false
  });

  useEffect(() => {
    if (error) {
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.needsSubscription) {
          setIsBlocked(true);
        }
      } catch {
        // Not a subscription error
        setIsBlocked(false);
      }
    } else {
      setIsBlocked(false);
    }
  }, [error]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  // Subscription required
  if (isBlocked || (subscriptionStatus && subscriptionStatus.needsSubscription)) {
    const status = subscriptionStatus || JSON.parse(error?.message || '{}');
    
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gray-900 border-white">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              {status.trialExpired ? (
                <Clock className="h-12 w-12 text-orange-500 mx-auto mb-3" />
              ) : (
                <Lock className="h-12 w-12 text-blue-500 mx-auto mb-3" />
              )}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">
              {status.trialExpired ? "Trial Expired" : "Subscription Required"}
            </h3>
            
            <p className="text-white mb-4">
              {status.trialExpired 
                ? `Your free trial has ended. Subscribe to continue using ${feature}.`
                : `You need an active subscription to access ${feature}.`
              }
            </p>

            <div className="space-y-2 mb-6">
              <Button
                onClick={() => setLocation("/trial-signup")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {status.trialExpired ? "Subscribe Now" : "Start Free Trial"}
              </Button>
              
              {allowPersonalAgents && (
                <Button
                  onClick={() => setLocation("/easy-agents")}
                  variant="outline"
                  className="w-full border-white text-white hover:bg-white hover:text-black"
                >
                  Create Personal Agent (Free)
                </Button>
              )}
            </div>

            <p className="text-sm text-gray-400">
              Personal agents are always free. Premium features require a subscription.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid subscription - render children
  return <>{children}</>;
}

// Higher-order component for easy wrapping
export function withSubscriptionGuard<P extends object>(
  Component: React.ComponentType<P>,
  feature?: string
) {
  return function SubscriptionGuardedComponent(props: P) {
    return (
      <SubscriptionGuard feature={feature}>
        <Component {...props} />
      </SubscriptionGuard>
    );
  };
}