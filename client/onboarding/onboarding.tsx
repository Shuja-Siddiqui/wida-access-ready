import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useApi, extractErrorMessage } from "@/hooks/use-api";
import {
  CreateStudentBodyGradeBand,
  CreateStudentBodyStateAssessment,
} from "@/api-generated";
import { AppSelect } from "@/components/app-select";
import { InputField } from "@/components/input-field";
import { GoogleButton } from "@/components/google-button";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import {
  AuthDivider,
  AuthErrorBanner,
  AuthFormHeader,
  AuthPrimaryButton,
  AuthStepProgress,
  AuthSubmitSpinner,
  authStepMotion,
} from "@/components/auth-signup-ui";
import { useAuthConfig } from "@/hooks/use-auth-config";
import { motion, AnimatePresence } from "framer-motion";
import { Globe2, Mail, Lock, Eye, EyeOff, GraduationCap, MessageCircle, CheckCircle2 } from "lucide-react";
import {
  loadPendingGoogleAuth,
  clearPendingGoogleAuth,
} from "@/auth-callback/auth-callback";
import { EmailVerificationCheckInbox } from "@/components/email-verification-ui";

const COMMON_LANGUAGES = [
  "Spanish", "Mandarin Chinese", "Arabic", "Haitian Creole", "Portuguese",
  "Somali", "Vietnamese", "Amharic", "Hmong", "Tagalog", "French",
  "Russian", "Bengali", "Punjabi", "Nepali", "Karen", "Burmese",
  "Urdu", "Hindi", "Korean", "Japanese", "Swahili", "Tigrinya",
  "Pashto", "Farsi / Dari", "Ukrainian", "Polish", "Turkish",
  "Other"
];

type StudentTrack = "academic" | "general";

const ONBOARDING_PANEL_FEATURES = [
  "Practice aligned to your state assessment",
  "Goals that match your classroom track",
  "Progress your teacher can see",
];

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

  const showProgress = step < 6;

  return (
    <AuthSplitLayout
      panelTitle="Practice built around you"
      panelSubtitle="Set your language, assessment, and goal — we’ll tailor every session."
      panelFeatures={ONBOARDING_PANEL_FEATURES}
      panelIcon={<Globe2 className="w-7 h-7 text-white" strokeWidth={2.25} />}
      onBack={handleBack}
      showBack={showProgress}
      backTo="/login"
    >
      <div className="w-full max-w-lg">
        {showProgress ? <AuthStepProgress total={totalDots} current={step} /> : null}

        <AnimatePresence mode="wait">

          {/* ── Step 1: Home language ── */}
          {step === 1 && (
            <motion.div key="step1" {...authStepMotion} transition={{ duration: 0.28 }} className="space-y-6">
              <AuthFormHeader
                eyebrow="Student signup"
                title="Your home language"
                subtitle="We use this to personalize instructions and support."
              />

              {googleEnabled && !isGoogleMode && (
                <>
                  <GoogleButton label="Sign up with Google" />
                  <AuthDivider label="or continue manually" />
                </>
              )}

              <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1 pb-1">
                {COMMON_LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setHomeLanguage(lang)}
                    className={`text-left px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      homeLanguage === lang
                        ? "bg-primary text-primary-foreground border-primary/30 shadow-sm"
                        : "border-border/60 bg-gradient-to-br from-card/90 via-card/90 to-primary/[0.06] hover:border-primary/25 hover:to-primary/[0.1] text-foreground"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              {homeLanguage === "Other" && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                  <InputField
                    label="Type your home language"
                    autoFocus
                    value={otherLanguage}
                    onChange={e => setOtherLanguage(e.target.value)}
                    placeholder="e.g. Tigrinya, Kinyarwanda..."
                  />
                </motion.div>
              )}

              <AuthPrimaryButton onClick={handleNext} disabled={!resolvedLanguage}>
                Continue
              </AuthPrimaryButton>
            </motion.div>
          )}

          {/* ── Step 2: About you ── */}
          {step === 2 && (
            <motion.div key="step2" {...authStepMotion} transition={{ duration: 0.28 }} className="space-y-6">
              <AuthFormHeader
                eyebrow={`Step 2 of ${totalDots}`}
                title="About you"
                subtitle="Tell us a bit so we can set the right goal."
              />

              <div className="space-y-5">
                {!isGoogleMode && (
                  <InputField
                    label="What's your first name?"
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="First name"
                  />
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

              <AuthPrimaryButton
                onClick={handleNext}
                disabled={isGoogleMode ? !gradeBand || !stateAssessment : !name || !gradeBand || !stateAssessment}
              >
                Continue
              </AuthPrimaryButton>
            </motion.div>
          )}

          {/* ── Step 3: Track selection ── */}
          {step === 3 && (
            <motion.div key="step3track" {...authStepMotion} transition={{ duration: 0.28 }} className="space-y-6">
              <AuthFormHeader
                eyebrow={`Step 3 of ${totalDots}`}
                title="Your goal"
                subtitle={
                  stateAssessment === "WIDA"
                    ? "WIDA has two common exit levels."
                    : "Pick the proficiency level you're working toward."
                }
              />

              <div className="space-y-4">
                {trackOptions.map(opt => {
                  const selected = track === opt.value;
                  const Icon = opt.Icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTrack(opt.value)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                        selected
                          ? "border-primary/35 bg-gradient-to-br from-card via-card to-primary/[0.1] shadow-[0_8px_24px_hsl(var(--primary)/0.08)]"
                          : "border-border/50 bg-gradient-to-br from-card/90 via-card/90 to-primary/[0.05] hover:border-primary/20 hover:to-primary/[0.08]"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 transition-colors ${selected ? `${opt.bg} ring-transparent` : "bg-muted/80 ring-border/40"}`}>
                          <Icon className={`w-6 h-6 ${selected ? "text-white" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-[15px] tracking-tight text-foreground">
                              {opt.title}
                            </span>
                            <span className={`text-[10px] font-medium uppercase tracking-[0.14em] px-2.5 py-0.5 rounded-full flex-shrink-0 transition-colors ${
                              selected ? `${opt.badgeBg}` : "bg-muted text-muted-foreground"
                            }`}>
                              {opt.badge}
                            </span>
                          </div>
                          <p className={`text-sm mb-2.5 ${selected ? "text-foreground/75" : "text-muted-foreground"}`}>
                            {opt.subtitle}
                          </p>
                          <ul className="space-y-1.5">
                            {opt.bullets.map((b, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-snug">
                                <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${selected ? opt.color : "text-muted-foreground/45"}`} />
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

              <p className="text-sm text-muted-foreground text-center">
                You can change this later in profile settings.
              </p>

              <AuthPrimaryButton onClick={handleNext}>Continue</AuthPrimaryButton>
            </motion.div>
          )}

          {/* ── Step 4 Google mode: teacher code ── */}
          {step === 4 && isGoogleMode && (
            <motion.div key="step4g" {...authStepMotion} transition={{ duration: 0.28 }} className="space-y-6">
              <AuthFormHeader
                eyebrow={`Step 4 of ${totalDots}`}
                title="Link your teacher"
                subtitle="Enter your teacher's email so they can track your progress."
              />

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

              {registerError ? <AuthErrorBanner message={registerError} /> : null}

              <div className="space-y-3">
                <AuthPrimaryButton onClick={handleNext} disabled={isPending}>
                  {isPending ? <AuthSubmitSpinner /> : "Finish setup"}
                </AuthPrimaryButton>
                <button
                  type="button"
                  className="w-full h-11 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl transition-colors disabled:opacity-50"
                  onClick={() => completeGoogleProfile({ skipTeacher: true })}
                  disabled={isPending}
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 4 Normal mode: email + password ── */}
          {step === 4 && !isGoogleMode && (
            <motion.div key="step4" {...authStepMotion} transition={{ duration: 0.28 }} className="space-y-6">
              <AuthFormHeader
                eyebrow={`Step 4 of ${totalDots}`}
                title="Create your login"
                subtitle="Your email and password to sign in again."
              />

              <div className="space-y-4">
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

              <AuthPrimaryButton
                onClick={handleNext}
                disabled={!email.trim() || password.length < 8 || password !== confirmPassword}
              >
                Continue
              </AuthPrimaryButton>
            </motion.div>
          )}

          {/* ── Step 5 Normal mode: teacher code ── */}
          {step === 5 && !isGoogleMode && (
            <motion.div key="step5" {...authStepMotion} transition={{ duration: 0.28 }} className="space-y-6">
              <AuthFormHeader
                eyebrow={`Step 5 of ${totalDots}`}
                title="Link your teacher"
                subtitle="Enter your teacher's email so they can track your progress."
              />

              <InputField
                label="Teacher email"
                id="ob-teacher"
                type="email"
                icon={Mail}
                value={teacherCode}
                onChange={e => setTeacherCode(e.target.value)}
                placeholder="teacher@school.edu"
              />

              {registerError ? <AuthErrorBanner message={registerError} /> : null}

              <div className="space-y-3">
                <AuthPrimaryButton onClick={handleNext} disabled={isPending}>
                  {isPending ? <AuthSubmitSpinner /> : "Create account"}
                </AuthPrimaryButton>
                <button
                  type="button"
                  className="w-full h-11 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl transition-colors disabled:opacity-50"
                  onClick={createAccount}
                  disabled={isPending}
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 6 Normal mode: email verification sent ── */}
          {step === 6 && !isGoogleMode && (
            <motion.div key="step6" {...authStepMotion} transition={{ duration: 0.28 }}>
              <EmailVerificationCheckInbox
                email={email}
                onLogin={() => setLocation("/login")}
                onResend={async () => {
                  await request("/api/auth/resend-verification", {
                    method: "POST",
                    body: JSON.stringify({ email, role: "student" }),
                  }).catch(() => {});
                }}
                resendLabel="resend the email"
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </AuthSplitLayout>
  );
}
