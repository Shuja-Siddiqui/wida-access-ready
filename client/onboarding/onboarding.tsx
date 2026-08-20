import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useApi, extractErrorMessage } from "@/hooks/use-api";
import {
  CreateStudentBodyGradeBand,
  CreateStudentBodyStateAssessment,
} from "@/api-generated";
import { Button } from "@/components/ui/button";
import { AppSelect } from "@/components/app-select";
import { InputField } from "@/components/input-field";
import { ThemeToggle } from "@/components/theme-toggle";
import { BackButton } from "@/components/back-button";
import { GoogleButton } from "@/components/google-button";
import { useAuthConfig } from "@/hooks/use-auth-config";
import { motion, AnimatePresence } from "framer-motion";
import { Globe2, Mail, Lock, Eye, EyeOff, GraduationCap, MessageCircle, CheckCircle2 } from "lucide-react";
import {
  loadPendingGoogleAuth,
  clearPendingGoogleAuth,
} from "@/auth-callback/auth-callback";

const COMMON_LANGUAGES = [
  "Spanish", "Mandarin Chinese", "Arabic", "Haitian Creole", "Portuguese",
  "Somali", "Vietnamese", "Amharic", "Hmong", "Tagalog", "French",
  "Russian", "Bengali", "Punjabi", "Nepali", "Karen", "Burmese",
  "Urdu", "Hindi", "Korean", "Japanese", "Swahili", "Tigrinya",
  "Pashto", "Farsi / Dari", "Ukrainian", "Polish", "Turkish",
  "Other"
];

type StudentTrack = "academic" | "general";

const slide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

// ── Track card config ─────────────────────────────────────────────────────────

interface TrackOption {
  value: StudentTrack;
  Icon: React.FC<{ className?: string }>;
  title: string;
  subtitle: string;
  bullets: string[];
  badge: string;
  color: string;
  border: string;
  bg: string;
  badgeBg: string;
}

function getTrackOptions(assessment: string): TrackOption[] {
  if (assessment === "WIDA") {
    return [
      {
        value: "academic",
        Icon: GraduationCap,
        title: "Academic English",
        subtitle: "Full reclassification",
        bullets: [
          "Target: WIDA Level 6 (Reaching)",
          "Required for reclassification",
          "Qualifies for advanced / mainstream classes",
        ],
        badge: "Level 6",
        color: "text-trust-blue",
        border: "border-border/40",
        bg: "bg-trust-blue",
        badgeBg: "bg-trust-blue text-white",
      },
      {
        value: "general",
        Icon: MessageCircle,
        title: "Everyday English",
        subtitle: "School & social communication",
        bullets: [
          "Target: WIDA Level 5 (Bridging)",
          "Strong school & daily communication",
          "Solid foundation before level 6 push",
        ],
        badge: "Level 5",
        color: "text-growth-green",
        border: "border-border/40",
        bg: "bg-growth-green",
        badgeBg: "bg-growth-green text-white",
      },
    ];
  }

  // Generic labels for non-WIDA assessments
  return [
    {
      value: "academic",
      Icon: GraduationCap,
      title: "Academic English",
      subtitle: "Full language proficiency exit",
      bullets: [
        "Highest exit threshold on your assessment",
        "Required for mainstream academic programs",
        "Full reclassification pathway",
      ],
      badge: "Full exit",
      color: "text-trust-blue",
      border: "border-border/40",
      bg: "bg-trust-blue",
      badgeBg: "bg-trust-blue text-white",
    },
    {
      value: "general",
      Icon: MessageCircle,
      title: "Everyday English",
      subtitle: "School & social communication",
      bullets: [
        "Proficiency for everyday school settings",
        "Strong communication foundation",
        "Can upgrade to Academic later",
      ],
      badge: "Core goal",
      color: "text-growth-green",
      border: "border-border/40",
      bg: "bg-growth-green",
      badgeBg: "bg-growth-green text-white",
    },
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Onboarding() {
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const isGoogleMode = searchParams.get("source") === "google";

  const [step, setStep]                   = useState(1);
  const [homeLanguage, setHomeLanguage]   = useState("");
  const [otherLanguage, setOtherLanguage] = useState("");
  const [name, setName]                   = useState("");
  const [gradeBand, setGradeBand]         = useState<CreateStudentBodyGradeBand | "">("");
  const [stateAssessment, setStateAssessment] = useState<CreateStudentBodyStateAssessment | "">("");
  const [track, setTrack]                 = useState<StudentTrack>("academic");
  const [teacherCode, setTeacherCode]     = useState("");
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [isPending, setIsPending]         = useState(false);

  const [, setLocation] = useLocation();
  const { loginWithToken } = useAuth();
  const { googleEnabled } = useAuthConfig();
  const { request } = useApi();

  const resolvedLanguage = homeLanguage === "Other" ? otherLanguage : homeLanguage;

  // Step numbering:
  //   Google: 1 lang → 2 about → 3 track → 4 teacher → done
  //   Normal: 1 lang → 2 about → 3 track → 4 email/pwd → 5 teacher → 6 verify
  const totalDots = isGoogleMode ? 4 : 5;

  // ── Google-mode: complete profile ────────────────────────────────────────
  const completeGoogleProfile = async ({ skipTeacher = false } = {}) => {
    const pending = loadPendingGoogleAuth();
    if (!pending) {
      setRegisterError("Session expired. Please sign in with Google again.");
      return;
    }

    setRegisterError("");
    setIsPending(true);
    try {
      await request("/api/auth/google/complete-profile", {
        method: "POST",
        headers: { Authorization: `Bearer ${pending.token}` },
        body: JSON.stringify({
          gradeBand,
          stateAssessment,
          homeLanguage: resolvedLanguage || undefined,
          track,
          teacherCode: !skipTeacher && teacherCode.trim() ? teacherCode.trim() : undefined,
        }),
      });

      clearPendingGoogleAuth();
      loginWithToken(pending.token, {
        studentId: pending.studentId,
        teacherId: pending.teacherId,
      });
      setLocation("/home");
    } catch (err) {
      setRegisterError(extractErrorMessage(err));
      setIsPending(false);
    }
  };

  // ── Normal mode: create account ──────────────────────────────────────────
  const createAccount = async () => {
    setRegisterError("");
    setIsPending(true);
    try {
      const data = await request<{
        ok?: boolean;
        requiresVerification?: boolean;
        token?: string;
        studentId?: string;
        teacherId?: string;
      }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email: email.trim(),
          password,
          gradeBand,
          stateAssessment,
          homeLanguage: resolvedLanguage || undefined,
          track,
          teacherCode: teacherCode.trim() || undefined,
        }),
      });

      if (data.requiresVerification) {
        setStep(6);
        return;
      }

      if (data.token) {
        loginWithToken(data.token, {
          studentId: data.studentId,
          teacherId: data.teacherId,
        });
      }
      setStep(6);
    } catch (err) {
      setRegisterError(extractErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!resolvedLanguage) return;
      setStep(2);
    } else if (step === 2) {
      if (!gradeBand || !stateAssessment) return;
      if (!isGoogleMode && !name) return;
      setStep(3);
    } else if (step === 3) {
      // Track chosen — advance
      if (isGoogleMode) {
        setStep(4); // → teacher code
      } else {
        setStep(4); // → email/password
      }
    } else if (step === 4) {
      if (isGoogleMode) {
        await completeGoogleProfile();
      } else {
        if (!email.trim() || password.length < 8 || password !== confirmPassword) return;
        setStep(5); // → teacher code
      }
    } else if (step === 5) {
      await createAccount();
    } else {
      setLocation("/home");
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else setLocation("/login");
  };

  const trackOptions = getTrackOptions(stateAssessment as string);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 sm:px-6 lg:px-10 py-6 sm:py-8 bg-[radial-gradient(125%_120%_at_50%_-10%,hsl(var(--primary)/0.08)_0%,transparent_45%)]">
      <div className="max-w-xl w-full bg-card border border-border/40 shadow-sm rounded-2xl  transition-all relative">
        <div className="flex items-center justify-between mb-8">
          {step < 6 ? (
            <BackButton onClick={handleBack} />
          ) : (
            <span />
          )}
          <ThemeToggle />
        </div>
        <div className="flex gap-2 mb-10">
          {Array.from({ length: totalDots }, (_, i) => i + 1).map(i => (
            <div
              key={i}
              className={`h-3 flex-1 rounded-full border border-border/40 transition-all duration-300 ${step >= i ? "bg-primary " : "bg-muted"}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Home language ── */}
          {step === 1 && (
            <motion.div key="step1" {...slide} transition={{ duration: 0.25 }} className="space-y-8">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-trust-blue border border-border/40  rounded-full flex items-center justify-center  transform hover: transition-transform">
                    <Globe2 className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h2 className="text-4xl font-bold text-foreground tracking-tight ">Your Language</h2>
                <p className="text-muted-foreground font-bold text-lg">This helps us personalize your practice.</p>
              </div>

              {googleEnabled && !isGoogleMode && (
                <>
                  <GoogleButton label="Sign up with Google" />
                  <div className="flex items-center gap-3">
                    <div className="h-1 flex-1 bg-foreground" />
                    <span className="text-xs font-bold uppercase tracking-widest text-foreground">or continue manually</span>
                    <div className="h-1 flex-1 bg-foreground" />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-2 pb-2">
                {COMMON_LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    onClick={() => setHomeLanguage(lang)}
                    className={`text-left px-4 py-3 rounded-2xl border font-bold transition-all outline-none focus-visible:ring-4 focus-visible:ring-foreground ${
                      homeLanguage === lang
                        ? "bg-primary text-primary-foreground border-border/40  -translate-y-1"
                        : "border-border bg-card hover:border-border/40 hover: hover:-translate-y-1 text-foreground"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              {homeLanguage === "Other" && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="font-bold">
                  <InputField
                    label="Type your home language"
                    autoFocus
                    value={otherLanguage}
                    onChange={e => setOtherLanguage(e.target.value)}
                    placeholder="e.g. Tigrinya, Kinyarwanda..."
                  />
                </motion.div>
              )}

              <Button
                className={`w-full h-14 text-xl font-bold rounded-2xl border transition-all ${
                  !resolvedLanguage
                    ? "bg-muted text-muted-foreground border-border opacity-50 cursor-not-allowed hover:bg-muted active:translate-x-0 active:translate-y-0 "
                    : "bg-primary text-primary-foreground border-border/40    hover:   "
                }`}
                onClick={handleNext}
                disabled={!resolvedLanguage}
              >
                CONTINUE
              </Button>
            </motion.div>
          )}

          {/* ── Step 2: About you ── */}
          {step === 2 && (
            <motion.div key="step2" {...slide} transition={{ duration: 0.25 }} className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold text-foreground tracking-tight">About You</h2>
                <p className="text-muted-foreground font-bold text-lg">Tell us a bit so we can set the right goal.</p>
              </div>

              <div className="space-y-6">
                {!isGoogleMode && (
                  <div className="font-bold">
                    <InputField
                      label="What's your first name?"
                      autoFocus
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="First name"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <AppSelect
                    label="Grade Band"
                    value={gradeBand}
                    onChange={(v) => setGradeBand(v as CreateStudentBodyGradeBand)}
                    placeholder="Select grade"
                    options={[
                      { value: "K-2",  label: "Kindergarten – 2nd grade" },
                      { value: "3-5",  label: "3rd – 5th grade" },
                      { value: "6-8",  label: "6th – 8th grade" },
                      { value: "9-12", label: "9th – 12th grade" },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <AppSelect
                    label="State Assessment"
                    value={stateAssessment}
                    onChange={(v) => setStateAssessment(v as CreateStudentBodyStateAssessment)}
                    placeholder="Select your state test"
                    options={[
                      { value: "WIDA",     label: "WIDA (ACCESS)" },
                      { value: "OELPA",    label: "OELPA (Ohio) — Coming soon",       disabled: true },
                      { value: "TELPAS",   label: "TELPAS (Texas) — Coming soon",     disabled: true },
                      { value: "ELPAC",    label: "ELPAC (California) — Coming soon", disabled: true },
                      { value: "ELPA21",   label: "ELPA21 — Coming soon",             disabled: true },
                      { value: "NYSESLAT", label: "NYSESLAT (New York) — Coming soon",disabled: true },
                    ]}
                  />
                </div>
              </div>

              <Button
                className={`w-full h-14 text-xl font-bold rounded-2xl border transition-all ${
                  isGoogleMode ? (!gradeBand || !stateAssessment) : (!name || !gradeBand || !stateAssessment)
                    ? "bg-muted text-muted-foreground border-border opacity-50 cursor-not-allowed hover:bg-muted active:translate-x-0 active:translate-y-0 "
                    : "bg-primary text-primary-foreground border-border/40    hover:   "
                }`}
                onClick={handleNext}
                disabled={isGoogleMode ? (!gradeBand || !stateAssessment) : (!name || !gradeBand || !stateAssessment)}
              >
                CONTINUE
              </Button>
            </motion.div>
          )}

          {/* ── Step 3: Track selection ── */}
          {step === 3 && (
            <motion.div key="step3track" {...slide} transition={{ duration: 0.25 }} className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold text-foreground tracking-tight">Your Goal</h2>
                <p className="text-muted-foreground font-bold text-lg">
                  {stateAssessment === "WIDA"
                    ? "WIDA has two common exit levels."
                    : "Pick the proficiency level you're working toward."}
                </p>
              </div>

              <div className="space-y-4">
                {trackOptions.map(opt => {
                  const selected = track === opt.value;
                  const Icon = opt.Icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTrack(opt.value)}
                      className={`w-full text-left rounded-3xl border p-5 transition-all outline-none focus-visible:ring-4 focus-visible:ring-foreground ${
                        selected ? `border-border/40  -translate-y-1 bg-card` : "border-border bg-card hover:border-border/40 hover: hover:-translate-y-1"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border border-border/40 transition-colors ${selected ? opt.bg + ' ' : "bg-muted"}`}>
                          <Icon className={`w-7 h-7 ${selected ? "text-white" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`font-bold text-lg text-foreground`}>
                              {opt.title}
                            </span>
                            <span className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-border/40 flex-shrink-0 transition-colors ${
                              selected ? opt.bg + " text-white" : "bg-muted text-muted-foreground border-transparent"
                            }`}>
                              {opt.badge}
                            </span>
                          </div>
                          <p className={`text-sm font-bold mb-3 ${selected ? "text-foreground/80" : "text-muted-foreground"}`}>
                            {opt.subtitle}
                          </p>
                          <ul className="space-y-1.5">
                            {opt.bullets.map((b, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm font-semibold text-muted-foreground">
                                <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${selected ? opt.color : "text-muted-foreground/50"}`} />
                                {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-sm font-bold text-muted-foreground text-center">
                You can change this later from your profile settings.
              </p>

              <Button
                className="w-full h-14 text-lg font-bold bg-gradient-to-br from-primary to-[#e91e8c] text-white shadow-[0_4px_14px_rgba(255,77,141,0.4)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,77,141,0.5)] active:translate-y-0 active:shadow-sm transition-all duration-300 rounded-xl mt-6 border-none"
                onClick={handleNext}
              >
                CONTINUE
              </Button>
            </motion.div>
          )}

          {/* ── Step 4 Google mode: teacher code ── */}
          {step === 4 && isGoogleMode && (
            <motion.div key="step4g" {...slide} transition={{ duration: 0.25 }} className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold text-foreground tracking-tight">Link Your Teacher</h2>
                <p className="text-muted-foreground font-bold text-lg">Enter your teacher's email so they can track your progress.</p>
              </div>

              <div className="font-bold">
                <InputField
                  label="Teacher email"
                  id="ob-teacher-g"
                  type="email"
                  icon={Mail}
                  autoFocus
                  value={teacherCode}
                  onChange={e => setTeacherCode(e.target.value)}
                  placeholder="teacher@school.edu"
                />
              </div>

              {registerError && (
                <p className="text-sm font-bold text-destructive">{registerError}</p>
              )}

              <div className="space-y-4">
                <Button
                  className="w-full h-14 text-lg font-bold bg-gradient-to-br from-primary to-[#e91e8c] text-white shadow-[0_4px_14px_rgba(255,77,141,0.4)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,77,141,0.5)] active:translate-y-0 active:shadow-sm transition-all duration-300 rounded-xl mt-6 border-none"
                  onClick={handleNext}
                  disabled={isPending}
                >
                  {isPending ? "SAVING…" : "FINISH"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-12 text-base font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                  onClick={() => completeGoogleProfile({ skipTeacher: true })}
                  disabled={isPending}
                >
                  {isPending ? "SAVING…" : "Skip for now"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 4 Normal mode: email + password ── */}
          {step === 4 && !isGoogleMode && (
            <motion.div key="step4" {...slide} transition={{ duration: 0.25 }} className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold text-foreground tracking-tight">Create Account</h2>
                <p className="text-muted-foreground font-bold text-lg">Your email and password to log back in.</p>
              </div>

              <div className="space-y-6 font-bold">
                <InputField
                  label="Email address"
                  id="ob-email"
                  type="email"
                  icon={Mail}
                  autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <InputField
                  label="Password"
                  id="ob-password"
                  type={showPassword ? "text" : "password"}
                  icon={Lock}
                  rightAddon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="text-muted-foreground hover:text-foreground p-2 rounded-lg"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                <InputField
                  label="Confirm password"
                  id="ob-confirm"
                  type={showPassword ? "text" : "password"}
                  icon={Lock}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  error={confirmPassword && confirmPassword !== password ? "Passwords don't match" : undefined}
                />
              </div>

              <Button
                className={`w-full h-14 text-xl font-bold rounded-2xl border transition-all ${
                  !email.trim() || password.length < 8 || password !== confirmPassword
                    ? "bg-muted text-muted-foreground border-border opacity-50 cursor-not-allowed hover:bg-muted active:translate-x-0 active:translate-y-0 "
                    : "bg-primary text-primary-foreground border-border/40    hover:   "
                }`}
                onClick={handleNext}
                disabled={!email.trim() || password.length < 8 || password !== confirmPassword}
              >
                CONTINUE
              </Button>
            </motion.div>
          )}

          {/* ── Step 5 Normal mode: teacher code ── */}
          {step === 5 && !isGoogleMode && (
            <motion.div key="step5" {...slide} transition={{ duration: 0.25 }} className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold text-foreground tracking-tight">Link Your Teacher</h2>
                <p className="text-muted-foreground font-bold text-lg">Enter your teacher's email so they can track your progress.</p>
              </div>

              <div className="font-bold">
                <InputField
                  label="Teacher email"
                  id="ob-teacher"
                  type="email"
                  icon={Mail}
                  value={teacherCode}
                  onChange={e => setTeacherCode(e.target.value)}
                  placeholder="teacher@school.edu"
                />
              </div>

              {registerError && (
                <p className="text-sm font-bold text-destructive">{registerError}</p>
              )}

              <div className="space-y-4">
                <Button
                  className="w-full h-14 text-lg font-bold bg-gradient-to-br from-primary to-[#e91e8c] text-white shadow-[0_4px_14px_rgba(255,77,141,0.4)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,77,141,0.5)] active:translate-y-0 active:shadow-sm transition-all duration-300 rounded-xl mt-6 border-none"
                  onClick={handleNext}
                  disabled={isPending}
                >
                  {isPending ? "CREATING..." : "FINISH"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-12 text-base font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                  onClick={createAccount}
                  disabled={isPending}
                >
                  {isPending ? "CREATING..." : "Skip for now"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 6 Normal mode: email verification sent ── */}
          {step === 6 && !isGoogleMode && (
            <motion.div key="step6" {...slide} transition={{ duration: 0.25 }} className="space-y-8 text-center">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-trust-blue border border-border/40  flex items-center justify-center  transform hover: transition-transform">
                  <Mail className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-foreground tracking-tight ">Check your inbox!</h2>
                <p className="text-muted-foreground font-bold text-lg">
                  We sent a verification link to <span className="font-bold text-foreground">{email}</span>.
                </p>
                <p className="text-muted-foreground font-bold text-lg mt-2">
                  Click the link in that email to activate your account and start practicing.
                </p>
              </div>
              <div className="bg-card border border-border/40 shadow-sm rounded-2xl p-6  text-left space-y-2 mt-6">
                <p className="text-sm font-bold text-foreground tracking-widest">Didn't get it?</p>
                <p className="text-base font-bold text-muted-foreground">Check your spam folder or{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="font-bold h-auto p-0 text-base text-primary hover:text-foreground"
                    onClick={async () => {
                      await request("/api/auth/resend-verification", {
                        method: "POST",
                        body: JSON.stringify({ email, role: "student" }),
                      }).catch(() => {});
                    }}
                  >
                    resend the email
                  </Button>.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full h-14 text-xl font-bold rounded-2xl border border-border/40 hover:bg-muted   transition-all"
                onClick={() => setLocation("/login")}
              >
                BACK TO LOG IN
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
