import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Building2, Users, ChevronRight, Check } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { BackButton } from "@/components/back-button";

const ROLES = [
  {
    id: "student",
    icon: GraduationCap,
    title: "Student",
    description: "Practice for your English language exit exam",
    href: "/onboarding",
    color: "text-primary",
    iconBg: "bg-primary/12",
    accent: "hsl(var(--primary))",
  },
  {
    id: "educator",
    icon: BookOpen,
    title: "Teacher / Educator",
    description: "Track your students' progress toward exit thresholds",
    href: "/signup/educator",
    color: "text-growth-green",
    iconBg: "bg-growth-green/12",
    accent: "hsl(var(--growth-green))",
  },
  {
    id: "district",
    icon: Building2,
    title: "District Admin",
    description: "Oversee ELL progress across your schools and district",
    href: "/signup/district",
    color: "text-achieve-purple",
    iconBg: "bg-achieve-purple/12",
    accent: "hsl(var(--achieve-purple))",
  },
  {
    id: "parent",
    icon: Users,
    title: "Parent / Guardian",
    description: "Stay connected to your child's language learning journey",
    href: "/signup/parent",
    color: "text-energy-orange",
    iconBg: "bg-energy-orange/12",
    accent: "hsl(var(--energy-orange))",
  },
];

const FEATURES = [
  "Join students across hundreds of schools",
  "10 minutes of practice a day is enough",
  "Progress shows up in weeks, not months",
];

export default function Signup() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ─────────────────────────────────────── */}
      <div className="brand-panel-gradient hidden lg:flex lg:w-[44%] flex-col justify-between p-12 relative overflow-hidden flex-shrink-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute bottom-0 -left-16 w-72 h-72 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative z-10">
          <AppLogo href="/" imageClassName="h-12" />
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              Start your journey to English proficiency.
            </h2>
            <p className="text-white/75 font-medium leading-relaxed">
              Personalized exit prep for every student, every day.
            </p>
          </div>
          <ul className="space-y-4">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-white/90 font-medium">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-white/50 text-sm font-medium relative z-10">Built by Fugees Family, Inc.</p>
      </div>

      {/* ── Right panel ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen bg-background">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <AppLogo href="/" imageClassName="h-8 lg:hidden" className="lg:hidden" />
            <BackButton onClick={() => setLocation("/login")} />
          </div>
          <ThemeToggle />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="heading-page text-3xl">Create your account</h1>
              <p className="text-muted-foreground font-medium mt-1.5">Choose what best describes you.</p>
            </div>

            <div className="space-y-3">
              {ROLES.map((role, i) => (
                <motion.button
                  key={role.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3 }}
                  onClick={() => setLocation(role.href)}
                  className="w-full group flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-250 text-left"
                >
                  {/* Colored left accent bar */}
                  <div
                    className="absolute left-0 top-3 bottom-3 w-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: role.accent }}
                  />

                  <div className={`w-12 h-12 rounded-xl ${role.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <role.icon className={`w-6 h-6 ${role.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-base leading-tight">{role.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 font-medium leading-snug">{role.description}</p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </motion.button>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground font-medium mt-8">
              Already have an account?{" "}
              <button
                onClick={() => setLocation("/login")}
                className="font-bold text-primary hover:underline"
              >
                Log in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
