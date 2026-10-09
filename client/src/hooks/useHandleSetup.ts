import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  handle?: string;
  profileImageUrl?: string;
}

export function useHandleSetup() {
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['/api/user/profile'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  return {
    profile,
    isLoading,
    needsHandleSetup: !isLoading && profile && !profile.handle
  };
}