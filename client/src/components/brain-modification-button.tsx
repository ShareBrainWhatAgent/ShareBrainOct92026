import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Brain, Zap } from "lucide-react";

interface BrainModificationButtonProps {
  brainId: number;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function BrainModificationButton({ 
  brainId, 
  variant = "default", 
  size = "default",
  className = ""
}: BrainModificationButtonProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation(`/brain-modifier/${brainId}`);
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={className}
    >
      <Zap className="w-4 h-4 mr-2" />
      Modify with AI
    </Button>
  );
}

export default BrainModificationButton;