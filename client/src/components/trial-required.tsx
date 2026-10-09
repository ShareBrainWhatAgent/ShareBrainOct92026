import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface TrialRequiredProps {
  children: React.ReactNode;
}

export function TrialRequired({ children }: TrialRequiredProps) {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // Force invalidate trial status cache every time this component mounts
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/user/trial-status'] });
  }, [queryClient]);

  const { data: trialStatus, isLoading } = useTrialStatus();

  useEffect(() => {
    if (!isLoading && trialStatus?.needsTrialSignup) {
      navigate("/trial-signup");
    }
  }, [isLoading, trialStatus, navigate]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (trialStatus?.needsTrialSignup) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return <>{children}</>;
}