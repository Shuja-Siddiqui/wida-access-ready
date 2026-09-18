import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Flame, ArrowUpCircle, Star, BookOpen } from "lucide-react";
import { LoadingScreen } from "@/components/loading-screen";
import { AttemptFeedbackCard } from "@/home/components/attempt-feedback-card";
import confetti from "canvas-confetti";
import { getThemeConfettiColors } from "@/lib/theme-colors";

export default function SessionComplete() {
  const [, setLocation] = useLocation();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const res = localStorage.getItem("lastSessionResult");
    if (res) {
      const parsed = JSON.parse(res);
      setResult(parsed);
      
      if (parsed.domainAtExit) {
        triggerConfetti();
      }
    } else {
      setLocation("/home");
    }
  }, [setLocation]);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;
    const colors = getThemeConfettiColors();

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  if (!result) return <LoadingScreen />;

  return (
    <div className={`min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-5 ${result.domainAtExit ? 'bg-streak-gold/5' : 'bg-background'}`}>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
        className="max-w-md w-full space-y-8 text-center"
      >
        {result.domainAtExit ? (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Star className="w-20 h-20 text-streak-gold fill-streak-gold drop-shadow-sm" />
            </div>
            <h1 className="text-5xl font-black text-streak-gold drop-shadow-sm tracking-tight">You did it.</h1>
            <p className="text-2xl font-extrabold text-foreground">Level {result.levelAfter.toFixed(1)}. You are ready.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center">
              {result.scorePct >= 80 ? (
                <Star className="w-16 h-16 text-streak-gold fill-streak-gold drop-shadow-sm" />
              ) : (
                <BookOpen className="w-16 h-16 text-primary" />
              )}
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-foreground tracking-tight">Session Complete</h2>
              <p className="text-xl text-muted-foreground font-bold">{result.message}</p>
            </div>
            
            <div className="flex justify-center py-6">
              <div className="relative">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted" />
                  <motion.circle 
                    cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                    strokeDasharray={2 * Math.PI * 88}
                    initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - result.scorePct / 100) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="text-primary" 
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-5xl font-black text-foreground">{Math.round(result.scorePct)}%</span>
                  <span className="text-sm font-black text-muted-foreground uppercase tracking-widest mt-1">Score</span>
                </div>
              </div>
            </div>

            {result.levelChanged && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-growth-green/10 border border-growth-green/30 text-growth-green rounded-xl p-4 flex items-center justify-center gap-3 shadow-sm"
              >
                <ArrowUpCircle className="w-8 h-8" />
                <span className="text-xl font-bold">Level Up! {result.levelBefore.toFixed(1)} → {result.levelAfter.toFixed(1)}</span>
              </motion.div>
            )}

            <div className="flex items-center justify-center gap-2 text-streak-gold font-bold text-lg bg-streak-gold/10 py-3 rounded-xl border border-streak-gold/20 shadow-sm">
              <Flame className="w-6 h-6 fill-streak-gold" />
              {result.streakUpdated ? `${result.newStreak} Day Streak!` : "Streak Kept Alive"}
            </div>
          </div>
        )}

        {result.attemptFeedback && (
          <AttemptFeedbackCard feedback={result.attemptFeedback} />
        )}

        <Button 
          className="w-full h-14 text-lg font-bold rounded-xl shadow-sm mt-8"
          onClick={() => {
            localStorage.removeItem("lastSessionResult");
            setLocation("/home");
          }}
        >
          See you tomorrow
        </Button>
      </motion.div>
    </div>
  );
}
