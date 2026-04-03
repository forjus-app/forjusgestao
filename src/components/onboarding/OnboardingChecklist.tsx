import { useState } from "react";
import { Link } from "react-router-dom";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ArrowRight, X, Rocket } from "lucide-react";

export function OnboardingChecklist() {
  const { data: onboarding, isLoading } = useOnboarding();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("forjus_onboarding_dismissed") === "true";
  });

  if (isLoading || !onboarding || onboarding.allCompleted || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem("forjus_onboarding_dismissed", "true");
    setDismissed(true);
  };

  const progress = (onboarding.completedCount / onboarding.totalSteps) * 100;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Configure seu escritório</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {onboarding.completedCount}/{onboarding.totalSteps} concluídos
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {onboarding.steps.map((step) => (
            <Link
              key={step.key}
              to={step.href}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                step.completed
                  ? "bg-muted/50 opacity-60"
                  : "bg-card hover:bg-accent/10 border border-border/50"
              }`}
            >
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.completed ? "line-through" : ""}`}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {step.description}
                </p>
              </div>
              {!step.completed && (
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
