import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAuthConfig } from "@/hooks/use-auth-config";
import { useApi, extractErrorMessage } from "@/hooks/use-api";
import { AppInput } from "@/components/app-input";
import { GoogleButton } from "@/components/google-button";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Mail, Lock, Eye, EyeOff } from "lucide-react";
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
  "Progress data across all your schools",
  "Spot gaps before they become crises",
  "Ready for your next ELL review",
];

export default function SignupDistrict() {
  const search       = useSearch();
  const isGoogleMode = new URLSearchParams(search).get("source") === "google";

  const [step, setStep]                       = useState(1);
  const [name, setName]                       = useState("");
  const [district, setDistrict]               = useState("");
  const [title, setTitle]                     = useState("");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [error, setError]                     = useState("");
  const [isPending, setIsPending]             = useState(false);

  const [, setLocation]    = useLocation();
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
        body: JSON.stringify({ school: district.trim(), title: title.trim() }),
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
      await request("/api/auth/register/district", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, district: district.trim(), title: title.trim() }),
      });
      setStep(3);
    } catch (err) {
      setError(extractErrorMessage(err, "Something went wrong."));
    } finally { setIsPending(false); }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (isGoogleMode) { if (!district.trim()) return; await completeGoogleProfile(); return; }
      if (!name.trim() || !district.trim()) return;
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
      panelTitle="District-wide ELL progress, clearly"
      panelSubtitle="Give every school tools that move students toward exit readiness."
      panelFeatures={FEATURES}
      panelIcon={<Building2 className="w-7 h-7 text-white" strokeWidth={2.25} />}
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
                    eyebrow="District signup"
                    title={isGoogleMode ? "About your district" : "District info"}
                    subtitle={isGoogleMode ? "Just a few details to get started." : "Tell us about your district."}
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
                      label="District name"
                      autoFocus={isGoogleMode}
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Chicago Public Schools"
                    />
                    <AppInput
                      label={<>Your title <span className="text-muted-foreground font-medium normal-case">(optional)</span></>}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. ELL Coordinator"
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
                    disabled={isGoogleMode ? !district.trim() || isPending : !name.trim() || !district.trim()}
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
                    subtitle="Use your district email if you have one."
                  />

                  <div className="space-y-4">
                    <AppInput
                      label="Email address"
                      autoFocus
                      type="email"
                      icon={Mail}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@district.edu"
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
