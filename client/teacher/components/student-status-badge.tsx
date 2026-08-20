import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Zap } from "lucide-react";

export function StudentStatusBadge({
  isInactive,
  isActive,
  isStalled,
}: {
  isInactive?: boolean;
  isActive?: boolean;
  isStalled?: boolean;
}) {
  if (isInactive) {
    return (
      <Badge variant="secondary" className="bg-muted text-muted-foreground border-border shadow-sm">
        <Clock className="w-3 h-3 mr-1.5" /> Inactive
      </Badge>
    );
  }
  if (isStalled) {
    return (
      <Badge variant="destructive" className="bg-energy-orange/10 text-energy-orange border-energy-orange/20 shadow-sm">
        <AlertTriangle className="w-3 h-3 mr-1.5" /> Stalled
      </Badge>
    );
  }
  if (isActive) {
    return (
      <Badge className="bg-trust-blue/10 text-trust-blue border-trust-blue/20 shadow-sm">
        <Zap className="w-3 h-3 mr-1.5" /> Active
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-growth-green/30 text-growth-green bg-growth-green/10 shadow-sm">
      On Track
    </Badge>
  );
}
