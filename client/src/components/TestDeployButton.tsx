import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Rocket, Loader2 } from 'lucide-react';

interface TestDeployButtonProps {
  className?: string;
  variant?: 'default' | 'secondary' | 'outline';
}

export default function TestDeployButton({ className, variant = 'default' }: TestDeployButtonProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const { toast } = useToast();

  const handleDeploy = async () => {
    if (isDeploying) return;

    setIsDeploying(true);
    
    try {
      const response = await fetch('/api/deploy-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Test Deployment Started",
          description: "Your changes are being deployed to the test environment. This may take a few minutes.",
          duration: 8000,
        });

        // Show success after a delay
        setTimeout(() => {
          toast({
            title: "Deployment Complete",
            description: (
              <div className="space-y-2">
                <p>Your changes are now live on the test environment!</p>
                <a 
                  href="https://sharebrain.me/test" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline block"
                >
                  🔗 Open Test Environment
                </a>
              </div>
            ),
            duration: 12000,
          });
        }, 90000); // 90 seconds

      } else {
        throw new Error(result.error || 'Deployment failed');
      }
    } catch (error) {
      console.error('Deployment error:', error);
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Failed to start test deployment",
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Button
      onClick={handleDeploy}
      disabled={isDeploying}
      variant={variant}
      className={className}
    >
      {isDeploying ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Deploying...
        </>
      ) : (
        <>
          <Rocket className="h-4 w-4 mr-2" />
          Deploy to Test
        </>
      )}
    </Button>
  );
}