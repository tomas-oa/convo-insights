import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  icon?: LucideIcon;
}

export function StatCard({ title, value, description, trend, trendDirection = "neutral", icon: Icon }: StatCardProps & React.ComponentProps<typeof Card>) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            {trend && (
              <p
                className={cn(
                  "mt-2 text-sm font-medium",
                  trendDirection === "up" && "text-success",
                  trendDirection === "down" && "text-destructive",
                  trendDirection === "neutral" && "text-muted-foreground"
                )}
              >
                {trend}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}