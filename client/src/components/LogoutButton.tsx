import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function LogoutButton({ className }: { className?: string }) {
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of ShareBrain.",
      });
      // Refresh the page to clear all client-side state
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button variant="outline" onClick={handleLogout} className={className}>
      <LogOut className="h-4 w-4 mr-2" />
      Sign Out
    </Button>
  );
}