import { useAuth } from './useAuth';

export function useAdminAuth() {
  const { user, isLoading } = useAuth();
  
  const isAdmin = user?.email === 'tom@colorfulranch.com';
  
  return {
    isAdmin,
    isLoading,
    user
  };
}