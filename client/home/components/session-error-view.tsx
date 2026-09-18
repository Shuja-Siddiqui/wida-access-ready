import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionErrorViewProps {
  errorMsg: string;
  onBack: () => void;
  onRetry: () => void;
}

export function SessionErrorView({ errorMsg, onBack, onRetry }: SessionErrorViewProps) {
  return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center bg-background p-6">
        <div className="w-full max-w-md bg-card border border-border/40 rounded-3xl p-8 shadow-xl text-center relative overflow-hidden">
          
          <div className="w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-6 mt-2">
            <AlertCircle className="w-10 h-10 text-destructive stroke-[2]" />
          </div>
          
          <h2 className="text-2xl font-black tracking-tight text-foreground mb-3">System Error</h2>
          <p className="text-muted-foreground font-medium mb-8 p-4 bg-muted/50 rounded-xl">
            {errorMsg}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex-1 h-12 text-sm font-semibold rounded-xl border border-border/40 bg-card text-foreground shadow-sm hover:bg-muted/60 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Abort
            </Button>
            <Button 
              onClick={onRetry}
              className="btn-brand flex-1 h-12 text-sm rounded-xl"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        </div>
      </div>
  );
}
