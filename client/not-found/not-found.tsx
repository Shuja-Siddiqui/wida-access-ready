import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Compass, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-5 relative overflow-hidden">
      {/* Subtle background element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-trust-blue/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md relative z-10">
        <Card className="border border-border/40 shadow-xl rounded-3xl overflow-hidden bg-card/80 backdrop-blur-xl">
          <CardContent className="p-10 text-center space-y-8">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-trust-blue/10 to-[#e91e8c]/10 rounded-3xl flex items-center justify-center shadow-inner">
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
              className="w-full h-14 text-sm font-bold rounded-xl bg-gradient-to-br from-trust-blue to-[#e91e8c] text-white shadow-[0_4px_14px_rgba(255,77,141,0.4)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,77,141,0.5)] active:translate-y-0 active:shadow-sm transition-all duration-300 mt-4" 
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
