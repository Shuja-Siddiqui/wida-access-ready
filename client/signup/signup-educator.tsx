import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAuthConfig } from "@/hooks/use-auth-config";
import { useApi, extractErrorMessage } from "@/hooks/use-api";
import { AppInput } from "@/components/app-input";
import { GoogleButton } from "@/components/google-button";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { loadPendingGoogleAuth, clearPendingGoogleAuth } from "@/auth-callback/auth-callback";
import { EmailVerificationCheckInbox } from "@/components/email-verification-ui";
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

const FEATURES = [
  "Know which students are stalling",
  "Progress data across all four domains",
  "Exit-aligned practice you don't have to build",
];

export default function SignupEducator() {
  const search      = useSearch();
  const isGoogleMode = new URLSearchParams(search).get("source") === "google";

  const [step, setStep]                       = useState(1);
  const [name, setName]                       = useState("");
  const [school, setSchool]                   = useState("");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [error, setError]                     = useState("");
  const [isPending, setIsPending]             = useState(false);

  const [, setLocation]  = useLocation();
  const { loginWithToken } = useAuth();
  const { googleEnabled }  = useAuthConfig();
  const { request }        = useApi();

  const totalSteps = isGoogleMode ? 1 : 2;

  const completeGoogleProfile = async () => {
    const pending = loadPendingGoogleAuth();
    if (!pending) { setError("Session expired. Please try again."); return; }
    setError(""); setIsPending(true);
    try {
      await request("/api/auth/google/complete-profile/educator", {
        method: "POST",
        headers: { Authorization: `Bearer ${pending.token}` },
        body: JSON.stringify({ school: school.trim() }),
      });
      clearPendingGoogleAuth();
      loginWithToken(pending.token, { teacherId: pending.teacherId });
      setLocation("/teacher");
    } catch (err) {
      setError(extractErrorMessage(err, "Something went wrong."));
      setIsPending(false);
    }
  };

  const createAccount = async () => {
    setError(""); setIsPending(true);
    try {
      await request("/api/auth/register/educator", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, school: school.trim() }),
      });
      setStep(3);
    } catch (err) {
      setError(extractErrorMessage(err, "Something went wrong."));
    } finally { setIsPending(false); }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (isGoogleMode) { await completeGoogleProfile(); return; }
      if (!name.trim() || !school.trim()) return;
      setStep(2);
    } else if (step === 2) {
      if (!email.trim() || password.length < 8 || password !== confirmPassword) return;
      await createAccount();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else setLocation("/signup");
  };

  const eyeToggle = (
    <button type="button" onClick={() => setShowPassword((v) => !v)}
      className="text-muted-foreground hover:text-foreground transition-colors">
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <AuthSplitLayout
      panelTitle="Built for educators who want clarity."
      panelSubtitle="Give every student a personalized path toward exit readiness."
      panelFeatures={FEATURES}
      panelIcon={<BookOpen className="w-7 h-7 text-white" strokeWidth={2.25} />}
      onBack={step < 3 ? handleBack : undefined}
      showBack={step < 3}
      backTo="/signup"
    >
      <div className="w-full max-w-md">
        {step < 3 ? <AuthStepProgress total={totalSteps} current={step} /> : null}

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" {...authStepMotion} transition={{ duration: 0.28 }} className="space-y-6">
                  <AuthFormHeader
                    eyebrow="Teacher signup"
                    title={isGoogleMode ? "One more detail" : "About you"}
                    subtitle={isGoogleMode ? "Where do you teach?" : "We'll use this to set up your classroom."}
                  />

                  <div className="space-y-4">
                    {!isGoogleMode && (
                      <AppInput
                        label="Full name"
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                      />
                    )}
                    <AppInput
                      label="School name"
                      autoFocus={isGoogleMode}
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="e.g. Lincoln Elementary"
                    />
                  </div>

                  {googleEnabled && !isGoogleMode && (
                    <>
                      <AuthDivider label="or continue with" />
                      <GoogleButton role="educator" label="Continue with Google" />
                    </>
                  )}

                  {error ? <AuthErrorBanner message={error} /> : null}

                  <AuthPrimaryButton
                    onClick={handleNext}
                    disabled={isGoogleMode ? isPending : !name.trim() || !school.trim()}
                  >
                    {isPending ? <AuthSubmitSpinner /> : isGoogleMode ? "Complete sign-up" : "Continue"}
                  </AuthPrimaryButton>
                </motion.div>
              )}

              {step === 2 && !isGoogleMode && (
                <motion.div key="step2" {...authStepMotion} transition={{ duration: 0.28 }} className="space-y-6">
                  <AuthFormHeader
                    eyebrow="Step 2 of 2"
                    title="Create your login"
                    subtitle="Use your school email if you have one."
                  />

                  <div className="space-y-4">
                    <AppInput
                      label="Email address"
                      autoFocus
                      type="email"
                      icon={Mail}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                    <AppInput
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      icon={Lock}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      rightAddon={eyeToggle}
                    />
                    <AppInput
                      label="Confirm password"
                      type={showPassword ? "text" : "password"}
                      icon={Lock}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      error={confirmPassword && confirmPassword !== password ? "Passwords don't match" : undefined}
                    />
                  </div>

                  {error ? <AuthErrorBanner message={error} /> : null}

                  <AuthPrimaryButton
                    onClick={handleNext}
                    disabled={!email.trim() || password.length < 8 || password !== confirmPassword || isPending}
                  >
                    {isPending ? <AuthSubmitSpinner /> : "Create account"}
                  </AuthPrimaryButton>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" {...authStepMotion} transition={{ duration: 0.28 }}>
                  <EmailVerificationCheckInbox
                    email={email}
                    onLogin={() => setLocation("/login")}
                    onResend={async () => {
                      await request("/api/auth/resend-verification", {
                        method: "POST",
                        body: JSON.stringify({ email: email.trim(), role: "teacher" }),
                      }).catch(() => {});
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
      </div>
    </AuthSplitLayout>
  );
}
