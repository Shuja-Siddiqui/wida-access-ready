import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Headphones, ArrowRight, CheckCircle2, XCircle,
  Star, Zap, Flame, LayoutGrid,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import {
  ListeningMC, ListeningTrueFalse, ListeningImageGrid,
  ListeningSequence, ListeningMatch, ListeningClassify,
} from "@/wida-content";
import type { AnyQuestion } from "@/wida-content";

// ── TYPE LABELS ───────────────────────────────────────────────────────────────
const TYPE_LABEL: Record<string, string> = {
  listening_mc:         "Listen + Multiple Choice",
  listening_tf:         "Listen + Agree / Disagree",
  listening_image_grid: "Listen + Point to Picture",
  listening_sequence:   "Listen + Put in Order",
  listening_match:      "Listen + Match Pairs",
  listening_classify:   "Listen + Sort into Groups",
};

// ── DEMO QUESTIONS — one per format ──────────────────────────────────────────
const QUESTIONS: AnyQuestion[] = [
  // 1. Multiple Choice  (Level 3 — Developing — Recount)
  {
    type: "listening_mc",
    audioScript:
      "Maria walks into the school cafeteria and sees her friend Luis sitting alone. She says: 'Hey Luis, you look sad. What's wrong?' Luis replies: 'I forgot my lunch at home and I don't have any money.' Maria smiles and says: 'Don't worry! I have extra. We can share my sandwich.'",
    question: "Why does Luis look sad?",
    options: [
      "He forgot his lunch and has no money",
      "He got a bad grade on his test",
      "He does not have any friends",
    ],
    correctIndex: 0,
  },

  // 2. True / False  (Level 1 — Entering — Argue)
  {
    type: "listening_tf",
    audioScript:
      "The teacher says: 'Today is a rainy day. Please bring your umbrella if you go outside at recess.'",
    statement: "Today is a sunny day.",
    answer: "false",
    mode: "true_false",
  },

  // 3. Agree / Disagree  (Level 1 — Entering — Argue)
  {
    type: "listening_tf",
    audioScript:
      "The principal says: 'Our school lunch is free for all students this month because of a new program.'",
    statement: "Students have to pay for lunch this month.",
    answer: "disagree",
    mode: "agree_disagree",
  },

  // 4. Image Grid — "Point to the picture"  (Level 1 — Entering — Explain)
  {
    type: "listening_image_grid",
    audioScript:
      "Listen: 'Show me the animal that lives in the ocean and has eight arms.'",
    instruction: "Point to the animal you heard described.",
    images: [
      { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Octopus3.jpg/320px-Octopus3.jpg",  label: "Octopus",  altText: "Octopus" },
      { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/All_Gizah_Pyramids.jpg/320px-All_Gizah_Pyramids.jpg", label: "Pyramids", altText: "Pyramids" },
      { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Cute_dog.jpg/320px-Cute_dog.jpg",  label: "Dog",      altText: "Dog" },
    ],
    correctIndex: 0,
  },

  // 5. Sequence  (Level 2 — Emerging — Recount)
  {
    type: "listening_sequence",
    audioScript:
      "Listen to what Maria did in the morning: 'First, Maria woke up and got dressed. Then she ate breakfast. After that, she brushed her teeth. Finally, she picked up her backpack and walked to school.'",
    instruction: "Put Maria's morning routine in the correct order.",
    items: [
      "Ate breakfast",
      "Woke up and got dressed",
      "Walked to school",
      "Brushed her teeth",
    ],
    correctOrder: [1, 0, 3, 2],
  },

  // 6. Match  (Level 2 — Emerging — Explain)
  {
    type: "listening_match",
    audioScript:
      "A scientist explains: 'When it rains a lot, rivers can flood. When there is no rain for a long time, the ground becomes very dry. When the wind is very strong, trees can fall down.'",
    instruction: "Match each weather event to its effect.",
    leftItems: ["Heavy rain", "No rain for weeks", "Very strong wind"],
    rightItems: ["Trees fall down", "Rivers flood", "Ground becomes dry"],
    correctPairs: [1, 2, 0],
  },

  // 7. Classify  (Level 2 — Emerging — Explain)
  {
    type: "listening_classify",
    audioScript:
      "The teacher says: 'In science today we will sort animals. Some animals are mammals — they are warm-blooded and feed their babies milk. Others are reptiles — they are cold-blooded and have scales. A dog, a whale, and a bat are mammals. A lizard, a crocodile, and a snake are reptiles.'",
    instruction: "Sort each animal into the correct group.",
    categories: ["Mammal", "Reptile"],
    items: ["Dog", "Lizard", "Whale", "Crocodile", "Bat", "Snake"],
    correctCategories: [0, 1, 0, 1, 0, 1],
  },
];

type Screen = "session" | "complete";

export default function ListeningDemo() {
  const [, setLocation] = useLocation();
  const [screen, setScreen] = useState<Screen>("session");
  const [qIdx, setQIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  const q = QUESTIONS[qIdx];
  const progressPct = (qIdx / QUESTIONS.length) * 100;
  const typeLabel = TYPE_LABEL[q.type] ?? "Listening";

  const handleAnswer = (answer: unknown) => {
    if (answered) return;
    let correct = false;
    if (q.type === "listening_mc")         correct = answer === q.correctIndex;
    else if (q.type === "listening_tf")    correct = answer === q.answer;
    else if (q.type === "listening_image_grid") correct = answer === q.correctIndex;
    else if (q.type === "listening_sequence")
      correct = (answer as number[]).every((itemIdx, pos) => q.correctOrder[itemIdx] === pos);
    else if (q.type === "listening_match")
      correct = (answer as number[]).every((ri, li) => ri === q.correctPairs[li]);
    else if (q.type === "listening_classify")
      correct = (answer as number[]).every((cat, i) => cat === q.correctCategories[i]);
    else correct = true;

    setLastCorrect(correct);
    if (correct) setScore(s => s + 1);
    setAnswered(true);
    setShowFeedback(true);
  };

  const handleNext = () => {
    setShowFeedback(false);
    setAnswered(false);
    if (qIdx < QUESTIONS.length - 1) {
      setQIdx(i => i + 1);
    } else {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      setScreen("complete");
    }
  };

  const restart = () => {
    setQIdx(0); setAnswered(false); setLastCorrect(false);
    setShowFeedback(false); setScore(0); setScreen("session");
  };

  // ── COMPLETE SCREEN ───────────────────────────────────────────────────────
  if (screen === "complete") {
    const pct = Math.round((score / QUESTIONS.length) * 100);
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-background flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm space-y-5">
          <div className="flex justify-center">
            {pct >= 80
              ? <Star className="w-16 h-16 text-streak-gold fill-streak-gold drop-shadow-sm" />
              : <Headphones className="w-16 h-16 text-primary" />}
          </div>
          <h2 className="text-2xl font-extrabold text-foreground">Session Complete!</h2>
          <div className="text-5xl font-black text-primary tracking-tight">{pct}%</div>
          <p className="text-muted-foreground font-bold">{score} of {QUESTIONS.length} correct</p>

          <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-2 text-sm">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-achieve-purple fill-achieve-purple" />
              <span className="text-lg font-bold text-achieve-purple">+{20 + (pct >= 80 ? 10 : 0)} XP</span>
            </div>
            <div className="flex justify-between text-muted-foreground"><span>Session completed</span><span className="font-bold text-foreground">+20 XP</span></div>
            {pct >= 80 && <div className="flex justify-between text-muted-foreground"><span>Accuracy bonus</span><span className="font-bold text-growth-green">+10 XP</span></div>}
          </div>

          {pct >= 80 && (
            <div className="flex items-center justify-center gap-2 bg-streak-gold/10 px-4 py-3 rounded-xl border border-streak-gold/20">
              <Flame className="w-5 h-5 text-streak-gold fill-streak-gold" />
              <span className="font-bold text-streak-gold">Streak extended!</span>
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-1">
            <Button className="w-full h-12 text-base font-bold rounded-xl" onClick={restart}>Try Again</Button>
            <Button variant="outline" className="w-full h-12 text-base font-bold rounded-xl" onClick={() => setLocation("/")}>Back to Home</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── SESSION SCREEN ────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-trust-blue/10 flex items-center justify-center flex-shrink-0">
            <Headphones className="w-4 h-4 text-trust-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black text-trust-blue uppercase tracking-wide truncate">
                {typeLabel}
              </span>
              <span className="text-xs font-bold text-muted-foreground ml-2 flex-shrink-0">
                {qIdx + 1} / {QUESTIONS.length}
              </span>
            </div>
            <Progress value={progressPct} className="h-1.5" />
          </div>
        </div>
      </div>

      {/* Demo banner */}
      <div className="bg-primary/8 border-b border-primary/15 py-1.5 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-primary/80">Preview — dummy data, no account needed</span>
          <div className="flex items-center gap-1">
            {QUESTIONS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setQIdx(i); setAnswered(false); setShowFeedback(false); }}
                className={cn(
                  "w-5 h-5 rounded-full text-[9px] font-black transition-all",
                  i === qIdx ? "bg-primary text-primary-foreground scale-110" : "bg-muted text-muted-foreground hover:bg-primary/20",
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Format badge */}
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 pt-4">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-3.5 h-3.5 text-primary/60" />
          <span className="text-xs font-bold text-primary/70 uppercase tracking-widest">{typeLabel}</span>
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-4 pb-28 flex flex-col justify-start">
        <AnimatePresence mode="wait">
          <motion.div
            key={qIdx}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
          >
            {q.type === "listening_mc" && (
              <ListeningMC question={q} onSubmit={handleAnswer} showResult={answered} />
            )}
            {q.type === "listening_tf" && (
              <ListeningTrueFalse question={q} onSubmit={handleAnswer} showResult={answered} />
            )}
            {q.type === "listening_image_grid" && (
              <ListeningImageGrid question={q} onSubmit={handleAnswer} showResult={answered} />
            )}
            {q.type === "listening_sequence" && (
              <ListeningSequence question={q} onSubmit={handleAnswer} showResult={answered} />
            )}
            {q.type === "listening_match" && (
              <ListeningMatch question={q} onSubmit={handleAnswer} showResult={answered} />
            )}
            {q.type === "listening_classify" && (
              <ListeningClassify question={q} onSubmit={handleAnswer} showResult={answered} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Feedback drawer */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 p-5 border-t-4 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-50",
              lastCorrect ? "bg-growth-green/10 border-growth-green" : "bg-destructive/5 border-destructive",
            )}
          >
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {lastCorrect
                  ? <CheckCircle2 className="w-7 h-7 text-growth-green flex-shrink-0" />
                  : <XCircle className="w-7 h-7 text-destructive flex-shrink-0" />}
                <div>
                  <p className={cn("text-lg font-black", lastCorrect ? "text-growth-green" : "text-destructive")}>
                    {lastCorrect ? "Correct!" : "Not quite"}
                  </p>
                  {!lastCorrect && (
                    <p className="text-foreground text-sm font-medium mt-0.5">
                      Listen again and look for key details.
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={handleNext}
                className={cn(
                  "h-12 px-6 rounded-xl font-bold text-white",
                  lastCorrect ? "bg-growth-green hover:bg-growth-green/90" : "bg-destructive hover:bg-destructive/90",
                )}
              >
                {qIdx < QUESTIONS.length - 1 ? "Next" : "Finish"}{" "}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
