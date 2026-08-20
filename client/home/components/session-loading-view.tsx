import { Navbar } from "@/components/navbar";
import { motion } from "framer-motion";
import type { Crumb } from "@/components/breadcrumbs";

interface SessionLoadingViewProps {
  trail: Crumb[];
  domain: string;
}

const DOTS = [0, 1, 2, 3, 4];

export function SessionLoadingView({ trail, domain }: SessionLoadingViewProps) {
  return (
    <>
      <Navbar trail={trail} />
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-background px-6 relative overflow-hidden">
        
        {/* Background gradient orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-trust-blue/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md flex flex-col items-center gap-10 relative z-10">
          
          {/* Smooth waveform */}
          <div className="flex items-center gap-2 h-16">
            {DOTS.map((i) => (
               <motion.div
                 key={i}
                 className="w-2.5 rounded-full bg-gradient-to-b from-trust-blue to-[#e91e8c] shadow-[0_0_10px_rgba(255,77,141,0.3)]"
                 animate={{ 
                   height: ["12px", "48px", "12px"],
                 }}
                 transition={{
                   duration: 1.2,
                   repeat: Infinity,
                   ease: "easeInOut",
                   delay: i * 0.15,
                 }}
               />
             ))}
          </div>

          <div className="text-center space-y-3 w-full">
            <h2 className="font-black text-2xl tracking-tight text-foreground">
              Assembling {domain}
            </h2>
            <p className="text-muted-foreground text-sm font-semibold uppercase tracking-widest">
              Initializing modules • Est. 15s
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
