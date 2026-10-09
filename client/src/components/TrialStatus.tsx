import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, CreditCard, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

interface TrialStatusProps {
  user: {
    subscriptionStatus: string;
    trialEndDate?: string;
    trialStartDate?: string;
  };
}

export default function TrialStatus({ user }: TrialStatusProps) {
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (user.trialEndDate) {
      const endDate = new Date(user.trialEndDate);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      setDaysRemaining(diffDays);
      setIsExpired(diffDays <= 0);
    }
  }, [user.trialEndDate]);

  if (user.subscriptionStatus === "active") {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Active Subscription
            </Badge>
            <span className="text-sm text-green-700">
              Your subscription is active and current
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (user.subscriptionStatus === "expired" || isExpired) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <strong className="text-red-800">Trial Expired</strong>
              <p className="text-sm text-red-700 mt-1">
                Your 14-day free trial has ended. Subscribe to continue using ShareBrain.
              </p>
            </div>
            <Button asChild className="bg-red-600 hover:bg-red-700">
              <Link href="/subscribe">
                Subscribe Now - $10/month
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (user.subscriptionStatus === "trial") {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Free Trial
              </Badge>
              <span className="text-sm text-blue-700">
                {daysRemaining > 0 ? `${daysRemaining} days remaining` : "Expires today"}
              </span>
            </div>
            {daysRemaining <= 3 && (
              <Button variant="outline" asChild className="border-blue-300 text-blue-700">
                <Link href="/subscribe">
                  Subscribe Now
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}