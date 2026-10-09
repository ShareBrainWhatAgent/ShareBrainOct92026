import { useQuery } from "@tanstack/react-query";

interface TrialStatus {
  subscriptionStatus: string;
  needsSubscription: boolean;
  isTrialActive: boolean;
  trialExpired: boolean;
  hasPaymentMethod: boolean;
  trialEndDate?: string;
}

export function useTrialStatus() {
  return useQuery<TrialStatus>({
    queryKey: ['/api/user/subscription-status'],
    queryFn: async () => {
      const response = await fetch('/api/user/subscription-status', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        // If 403, it means subscription is required
        if (response.status === 403) {
          const errorData = await response.json();
          return {
            subscriptionStatus: errorData.subscriptionStatus || 'none',
            needsSubscription: true,
            isTrialActive: false,
            trialExpired: errorData.trialExpired || false,
            hasPaymentMethod: false
          };
        }
        throw new Error('Failed to fetch trial status');
      }
      
      return response.json();
    },
    staleTime: 0, // No caching - always fetch fresh
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false
  });
}