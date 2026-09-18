import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from "recharts";
import {
  ArrowRight,
  Target,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  Check,
  User,
  Building2,
  Lock,
  Headphones,
  Mic,
  BookOpen,
  PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ContactForm } from "@/contact/contact-form";
import { useGetBillingPlans, getGetBillingPlansQueryKey, type Plan } from "@/api-generated";

const DOMAINS = [
  { label: "Listening",  colorVar: "trust-blue",     color: "text-trust-blue",     bg: "bg-trust-blue/10",     gradientFrom: "from-trust-blue",     series: [1.5,1.8,2.2,2.6,3.1,3.6,4.0] },
  { label: "Speaking",   colorVar: "growth-green",   color: "text-growth-green",   bg: "bg-growth-green/10",   gradientFrom: "from-growth-green",   series: [2.0,2.2,2.3,2.7,3.0,3.4,3.9] },
  { label: "Reading",    colorVar: "energy-orange",  color: "text-energy-orange",  bg: "bg-energy-orange/10",  gradientFrom: "from-energy-orange",  series: [1.0,1.6,2.1,2.5,3.0,3.6,4.2] },
  { label: "Writing",    colorVar: "achieve-purple", color: "text-achieve-purple", bg: "bg-achieve-purple/10", gradientFrom: "from-achieve-purple", series: [1.8,2.1,2.4,2.8,3.2,3.7,4.1] },
];

const DOMAIN_DETAILS = [
  {
    label: "Listening", icon: Headphones, colorVar: "trust-blue",
    color: "text-trust-blue", bg: "bg-trust-blue/10", gradientFrom: "from-trust-blue",
    tagline: "Comprehension that keeps up with the classroom",
    body: "Students listen to AI-generated audio passages pitched to their exact level, then answer comprehension checks. As accuracy rises, the audio gets faster and denser — exactly how the exit test scales.",
    points: ["Leveled audio scripts generated fresh each day","Comprehension checks after every clip","Speed and vocabulary adapt to accuracy"],
    exitThreshold: 4.0, series: [1.5,1.8,2.2,2.6,3.1,3.6,4.0],
  },
  {
    label: "Speaking", icon: Mic, colorVar: "growth-green",
    color: "text-growth-green", bg: "bg-growth-green/10", gradientFrom: "from-growth-green",
    tagline: "Real practice producing the language",
    body: "Speaking prompts ask students to describe, explain, and respond out loud. Practice targets the fluency and detail the exit rubric rewards, so students get comfortable producing language under test conditions.",
    points: ["Prompts modeled on exit-test speaking tasks","Builds fluency, detail, and organization","Difficulty steps up as responses strengthen"],
    exitThreshold: 4.0, series: [2.0,2.2,2.3,2.7,3.0,3.4,3.9],
  },
  {
    label: "Reading", icon: BookOpen, colorVar: "energy-orange",
    color: "text-energy-orange", bg: "bg-energy-orange/10", gradientFrom: "from-energy-orange",
    tagline: "From decoding to grade-level meaning",
    body: "Students read leveled passages and answer questions aligned to the exact exit threshold for their state. Texts grow longer and more complex as comprehension climbs toward proficiency.",
    points: ["Passages aligned to each state's exit bar","Question types mirror the real assessment","Complexity scales with comprehension"],
    exitThreshold: 4.0, series: [1.0,1.6,2.1,2.5,3.0,3.6,4.2],
  },
  {
    label: "Writing", icon: PenLine, colorVar: "achieve-purple",
    color: "text-achieve-purple", bg: "bg-achieve-purple/10", gradientFrom: "from-achieve-purple",
    tagline: "Feedback on every sentence",
    body: "Writing prompts collect a real response, then AI gives targeted feedback on grammar, vocabulary, and organization. Students revise and resubmit — turning each session into measurable growth.",
    points: ["AI feedback on grammar, vocabulary, structure","Prompts matched to exit-test writing tasks","Revise-and-resubmit builds durable gains"],
    exitThreshold: 4.0, series: [1.8,2.1,2.4,2.8,3.2,3.7,4.1],
  },
];

const FEATURES = [
  { icon: Target,    title: "Built for your exit test",     body: "Practice is aligned to the exact WIDA exit threshold today, with OELPA, TELPAS, ELPAC, ELPA21, and NYSESLAT coming soon." },
  { icon: Sparkles,  title: "Adaptive daily practice",      body: "AI-generated sessions adjust to each student's level across all four language domains, every day." },
  { icon: TrendingUp,title: "Clear path to proficiency",    body: "See progress toward the exit threshold and focus time where the gap is largest." },
  { icon: ShieldCheck,title:"Streaks that build habits",    body: "Daily streaks and milestones keep students coming back. Ten minutes a day gets them to exit." },
];

const ASSESSMENTS = [
  { name: "WIDA",     available: true  },
  { name: "OELPA",   available: false },
  { name: "TELPAS",  available: false },
  { name: "ELPAC",   available: false },
  { name: "ELPA21",  available: false },
  { name: "NYSESLAT",available: false },
];

const PLAN_META = {
  solo: {
    icon: User, name: "Personal",
    tagline: "For an individual learner working toward their exit test.",
    features: ["1 student profile","WIDA now — more assessments soon","Adaptive daily practice","All 4 language domains","Progress & streak tracking"],
    cta: "Get started", featured: false,
  },
  organization: {
    icon: Building2, name: "Organization",
    tagline: "For schools and programs. Add as many members as you need.",
    features: ["Unlimited student seats","Billed per active seat","Educator dashboard & roster","Stall alerts & exit watch list","Score tracking across your team","Everything in Personal"],
    cta: "Get started", featured: true,
  },
} as const;

const PLAN_ORDER = ["solo", "organization"] as const;

// Soft premium shadow tooltip style
const tooltipStyle = {
  background: "var(--color-card)", border: "1px solid var(--color-border)",
  borderRadius: "12px", fontSize: 12, fontWeight: 700, color: "var(--color-foreground)",
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  padding: "8px 12px"
};

export default function Landing() {
  const [, setLocation] = useLocation();
  const { data: plans } = useGetBillingPlans({
    query: { queryKey: getGetBillingPlansQueryKey(), staleTime: 60_000 },
  });

  const goSignUp = () => setLocation("/onboarding");
  const goLogIn  = () => setLocation("/login");

  const displayPlans = PLAN_ORDER.map((planId) => {
    const meta = PLAN_META[planId];
    const live = plans?.find((p: Plan) => p.planId === planId);
    return { id: planId, ...meta, price: live ? live.displayPrice : null, period: live ? live.displayPeriod : null };
  });

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient shadow-sm flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-lg tracking-tight">ACCESS Ready</span>
          </div>
          <nav className="flex items-center gap-1">
            {[
              { label: "Features", id: "features" },
              { label: "Domains",  id: "domains"  },
              { label: "Pricing",  id: "pricing"  },
              { label: "Contact",  id: "contact"  },
            ].map(({ label, id }) => (
              <button
                key={id}
                onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
                className="hidden md:inline-flex font-bold text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/60 transition-colors"
              >
                {label}
              </button>
            ))}
            <button
              onClick={goLogIn}
              className="font-bold text-sm px-3 py-1.5 rounded-lg hover:bg-muted/60 transition-colors ml-1 md:ml-0"
            >
              Log In
            </button>
            <button
              onClick={goSignUp}
              className="ml-1 font-bold text-sm px-4 py-2 rounded-lg btn-brand"
            >
              Get Started
            </button>
            <div className="ml-2">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-24 pb-20 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Adaptive ELL exit prep for K-12
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] max-w-4xl mx-auto">
            The fastest path to{" "}
            <span className="text-brand-gradient">English proficiency.</span>
          </h1>

          <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto mt-8 leading-relaxed">
            ACCESS Ready gives every student a personalized daily practice plan
            built around their state's exit test — across listening, speaking,
            reading, and writing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <button
              onClick={goSignUp}
              className="flex items-center gap-2 font-bold btn-brand px-8 h-14 rounded-xl text-base w-full sm:w-auto justify-center"
            >
              Start practicing free <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={goLogIn}
              className="flex items-center gap-2 font-bold bg-card border border-border/60 shadow-sm hover:shadow-md hover:bg-muted/60 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all px-8 h-14 rounded-xl text-base w-full sm:w-auto justify-center"
            >
              I already have an account
            </button>
          </div>
        </motion.div>

        {/* Domain preview cards — orbit ring + session bars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-20"
        >
          {DOMAINS.map((d, i) => {
            const EXIT      = 4.7;
            const finalLvl  = d.series[d.series.length - 1];
            const growth    = (finalLvl - d.series[0]).toFixed(1);
            const pct       = Math.min(100, (finalLvl / EXIT) * 100);
            const color     = `var(--color-${d.colorVar})`;

            // SVG ring constants
            const SIZE = 88, SW = 7, R = (SIZE - SW * 2) / 2;
            const CX = SIZE / 2, CY = SIZE / 2;
            const CIRC = 2 * Math.PI * R;
            const offset = CIRC - (pct / 100) * CIRC;
            const fid = `hero-ring-glow-${d.colorVar}`;

            // Bar heights from series differences
            const maxVal = Math.max(...d.series);
            const bars   = d.series;

            return (
              <motion.div
                key={d.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                className="group relative flex flex-col items-center gap-3 bg-card border border-border/40 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${d.gradientFrom} to-transparent opacity-90`} />

                {/* Label + badge */}
                <div className="flex items-center justify-between w-full z-10">
                  <span className="font-black text-sm">{d.label}</span>
                  <span className={`inline-flex items-center gap-0.5 text-[11px] font-black ${d.color} ${d.bg} px-2 py-0.5 rounded-lg`}>
                    <TrendingUp className="w-3 h-3" />+{growth}
                  </span>
                </div>

                {/* Ring */}
                <div className="relative" style={{ width: SIZE, height: SIZE }}>
                  <svg width={SIZE} height={SIZE} style={{ transform: "rotate(-90deg)", overflow: "visible" }} aria-hidden>
                    <defs>
                      <filter id={fid} x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    <circle cx={CX} cy={CY} r={R} fill="none" stroke="currentColor" strokeWidth={SW} className="text-muted-foreground/15" />
                    <motion.circle
                      cx={CX} cy={CY} r={R}
                      fill="none" stroke={color} strokeWidth={SW} strokeLinecap="round"
                      strokeDasharray={`${CIRC} ${CIRC}`}
                      initial={{ strokeDashoffset: CIRC }}
                      animate={{ strokeDashoffset: offset }}
                      transition={{ duration: 1.4, delay: 0.4 + i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                      filter={`url(#${fid})`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black tabular-nums leading-none" style={{ color }}>
                      {finalLvl.toFixed(1)}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground tracking-wide mt-0.5">
                      / {EXIT}
                    </span>
                  </div>
                </div>

                {/* Session bars */}
                <div className="flex items-end gap-[2px] w-full" style={{ height: 28 }}>
                  {bars.map((v, bi) => {
                    const h = Math.max(15, (v / maxVal) * 100);
                    const op = 0.3 + (bi / bars.length) * 0.7;
                    return (
                      <motion.div
                        key={bi}
                        className="flex-1 rounded-sm"
                        style={{ height: `${h}%`, backgroundColor: color, opacity: op, originY: 1 }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: 0.9 + bi * 0.06, duration: 0.3, ease: "easeOut" }}
                      />
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-20 scroll-mt-20 relative">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Why it works</p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">Built around the test, not the curriculum</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-card border border-border/40 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex gap-5 group"
            >
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm border border-primary/10 group-hover:scale-105 transition-transform">
                <f.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-xl tracking-tight">{f.title}</h3>
                <p className="text-muted-foreground text-sm font-medium mt-2.5 leading-relaxed">{f.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Domains header ───────────────────────────────────────────────────── */}
      <section id="domains" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 pb-4 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Four domains</p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">One plan for all four domains</h2>
          <p className="text-muted-foreground font-medium text-lg mt-4">
            Every day, students practice across listening, speaking, reading, and writing — and watch each one climb toward the exit threshold.
          </p>
        </div>
      </section>

      {/* ── Domain sections ──────────────────────────────────────────────────── */}
      {DOMAIN_DETAILS.map((d, idx) => {
        const data     = d.series.map((v, i) => ({ session: `S${i + 1}`, level: v }));
        const growth   = (d.series[d.series.length - 1] - d.series[0]).toFixed(1);
        const reversed = idx % 2 === 1;
        return (
          <section key={d.label} className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">

              {/* Text side */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5 }}
                className={reversed ? "md:order-2" : ""}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${d.bg} flex items-center justify-center ${d.color} shadow-sm border border-[var(--color-${d.colorVar})]/20`}>
                    <d.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className={`text-xs font-semibold uppercase tracking-widest ${d.color}`}>{d.label}</span>
                    <h3 className="font-black text-3xl tracking-tight leading-tight mt-1">{d.tagline}</h3>
                  </div>
                </div>
                <p className="text-muted-foreground font-medium text-lg leading-relaxed">{d.body}</p>
                <ul className="space-y-4 mt-8">
                  {d.points.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span className={`w-6 h-6 shrink-0 rounded-full ${d.bg} ${d.color} flex items-center justify-center mt-0.5 shadow-sm border border-[var(--color-${d.colorVar})]/20`}>
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-base font-medium text-foreground/90">{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Chart card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={`bg-card border border-border/40 rounded-3xl p-8 shadow-xl relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ${reversed ? "md:order-1" : ""}`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${d.gradientFrom} to-transparent opacity-80`} />
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sample progress</span>
                  <span className={`inline-flex items-center gap-1.5 text-sm font-black ${d.color} ${d.bg} px-3 py-1.5 rounded-xl shadow-sm border border-[var(--color-${d.colorVar})]/10`}>
                    <TrendingUp className="w-4 h-4" />+{growth} levels
                  </span>
                </div>
                <div className="h-72 relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                      <defs>
                        <linearGradient id={`grad-detail-${d.colorVar}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={`var(--color-${d.colorVar})`} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={`var(--color-${d.colorVar})`} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="session" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)", fontWeight: 600 }} tickLine={false} axisLine={false} dy={10} />
                      <YAxis domain={[0, 5]} ticks={[0,1,2,3,4,5]} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)", fontWeight: 600 }} tickLine={false} axisLine={false} width={32} />
                      <Tooltip
                        cursor={{ stroke: "var(--color-border)", strokeDasharray: "4 4" }}
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => [value.toFixed(1), "Level"]}
                      />
                      <ReferenceLine y={d.exitThreshold} stroke={`var(--color-${d.colorVar})`} strokeDasharray="6 6" strokeOpacity={0.5}
                        label={{ value: "Exit", position: "right", fontSize: 11, fontWeight: 700, fill: `var(--color-${d.colorVar})` }}
                      />
                      <Area type="monotone" dataKey="level" stroke={`var(--color-${d.colorVar})`} strokeWidth={4}
                        fill={`url(#grad-detail-${d.colorVar})`}
                        dot={{ r: 5, fill: "var(--color-card)", stroke: `var(--color-${d.colorVar})`, strokeWidth: 2.5 }}
                        activeDot={{ r: 7, fill: `var(--color-${d.colorVar})`, stroke: "var(--color-card)", strokeWidth: 3 }}
                        isAnimationActive animationDuration={900}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

            </div>
          </section>
        );
      })}

      {/* ── Assessment badges ─────────────────────────────────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
          WIDA available now — more assessments coming soon
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {ASSESSMENTS.map((a) =>
            a.available ? (
              <span key={a.name} className="btn-brand inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm transition-transform hover:-translate-y-0.5">
                <Check className="w-4 h-4" />{a.name}
              </span>
            ) : (
              <span key={a.name} className="inline-flex items-center gap-2 bg-card border border-border/60 text-muted-foreground rounded-xl px-5 py-2.5 font-semibold text-sm shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                {a.name}
                <span className="text-[10px] font-bold uppercase tracking-widest bg-muted rounded-full px-2 py-0.5 text-muted-foreground/80">Soon</span>
              </span>
            )
          )}
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-24 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Pricing</p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">Simple, transparent pricing</h2>
          <p className="text-muted-foreground font-medium text-lg mt-4">
            Start with one learner or roll it out across your whole program.
          </p>
          <div className="inline-flex items-center gap-2 bg-card border border-border/40 text-foreground px-5 py-2.5 rounded-full text-sm font-bold mt-8 shadow-sm">
            <Lock className="w-4 h-4 text-growth-green" />
            Secure checkout powered by Stripe
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {displayPlans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative bg-card rounded-3xl p-10 flex flex-col border transition-all duration-300 ${
                plan.featured
                  ? "border-primary/30 shadow-[0_8px_30px_hsl(var(--primary)/0.15)] hover:shadow-[0_12px_40px_hsl(var(--primary)/0.25)] hover:-translate-y-1"
                  : "border-border/40 shadow-sm hover:shadow-xl hover:-translate-y-1"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-px left-0 right-0 h-1.5 bg-brand-gradient rounded-t-3xl" />
              )}
              {plan.featured && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-gradient text-primary-foreground text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                  Best for teams
                </span>
              )}

              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center shadow-sm border ${plan.featured ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted/50 border-border/40 text-foreground"}`}>
                  <plan.icon className="w-6 h-6" />
                </div>
                <h3 className="font-black text-2xl tracking-tight">{plan.name}</h3>
              </div>

              <p className="text-muted-foreground text-base font-medium mt-5 leading-relaxed">{plan.tagline}</p>

              <div className="flex items-baseline gap-1.5 mt-8">
                {plan.price ? (
                  <>
                    <span className="text-5xl font-black tracking-tight">{plan.price}</span>
                    <span className="text-muted-foreground font-bold text-sm uppercase tracking-wider">{plan.period}</span>
                  </>
                ) : (
                  <span className="h-12 w-32 rounded-lg bg-muted animate-pulse" aria-hidden />
                )}
              </div>

              <ul className="space-y-4 mt-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-growth-green/10 text-growth-green flex items-center justify-center mt-0.5 border border-growth-green/20">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-base font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={plan.featured ? goLogIn : goSignUp}
                className={`mt-10 h-14 font-bold rounded-xl transition-all text-base w-full flex items-center justify-center gap-2 ${
                  plan.featured 
                    ? "btn-brand" 
                    : "bg-card border border-border/60 shadow-sm hover:bg-muted/60 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                }`}
              >
                {plan.cta} <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA band ─────────────────────────────────────────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="bg-brand-gradient rounded-[2.5rem] px-8 py-16 md:py-24 text-center shadow-[0_20px_60px_hsl(var(--primary)/0.3)] relative overflow-hidden"
        >
          {/* Decorative glow elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
             <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[150%] bg-white/10 blur-[100px] rounded-full mix-blend-overlay" />
             <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[150%] bg-white/10 blur-[100px] rounded-full mix-blend-overlay" />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
              Ready to get to exit?
            </h2>
            <p className="text-white/90 font-medium text-lg mt-6 leading-relaxed">
              Set up a student profile in under two minutes and start a personalized practice session today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <button
                onClick={goSignUp}
                className="flex items-center gap-2 font-bold bg-white text-primary shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] active:translate-y-0 active:shadow-sm transition-all px-8 py-4 rounded-xl text-base w-full sm:w-auto justify-center"
              >
                Get started <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={goLogIn}
                className="flex items-center gap-2 font-bold text-white bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 hover:border-white/30 hover:-translate-y-0.5 transition-all px-8 py-4 rounded-xl text-base w-full sm:w-auto justify-center"
              >
                Educator / Admin login
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Contact ──────────────────────────────────────────────────────────── */}
      <section id="contact" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-20 scroll-mt-20">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Get in touch</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Questions? We're here.</h2>
        </div>
        <div className="max-w-xl mx-auto bg-card border border-border/40 rounded-3xl p-8 md:p-10 shadow-xl">
          <ContactForm />
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 bg-card py-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-gradient shadow-sm flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground/80">ACCESS Ready</span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Built for ELL students and their educators.
          </p>
        </div>
      </footer>
    </div>
  );
}
