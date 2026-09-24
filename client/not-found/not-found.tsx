import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Compass, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-full w-full flex items-center justify-center py-3 sm:py-4 lg:py-5 relative overflow-hidden">
      {/* Subtle background element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-trust-blue/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md relative z-10">
        <Card className="border border-border/40 shadow-xl rounded-3xl overflow-hidden bg-card/80 backdrop-blur-xl">
          <CardContent className="p-10 text-center space-y-8">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-brand-gradient-soft rounded-3xl flex items-center justify-center shadow-inner">
                <Compass className="w-12 h-12 text-trust-blue" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-4xl font-black text-foreground tracking-tight">404</h1>
              <p className="text-xl font-bold text-foreground">Lost in the void.</p>
              <p className="text-sm text-muted-foreground font-medium pt-2">
                The page you're looking for might have been moved or doesn't exist anymore.
              </p>
            </div>

            <Button 
              className="btn-brand w-full h-14 text-sm rounded-xl mt-4" 
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Safety
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
