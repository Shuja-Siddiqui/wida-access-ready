import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useApi } from "@/hooks/use-api";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import {
  EmailVerificationInvalid,
  EmailVerificationLoading,
  EmailVerificationSuccess,
} from "@/components/email-verification-ui";

type Step = "verifying" | "success" | "invalid";

const PANEL_FEATURES = [
  "One click activates your account",
  "Links expire after 24 hours for security",
  "You can request a new link from log in",
];

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { loginWithToken } = useAuth();
  const { request } = useApi();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [step, setStep] = useState<Step>(token ? "verifying" : "invalid");
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token || calledRef.current) return;
    calledRef.current = true;

    const verify = async () => {
      try {
        const data = await request<{
          ok?: boolean;
          token?: string;
          userType?: string;
          studentId?: string;
          teacherId?: string;
        }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);

        if (data.token) {
          loginWithToken(data.token, {
            studentId: data.studentId,
            teacherId: data.teacherId,
          });
        }

        setStep("success");
      } catch {
        setStep("invalid");
      }
    };

    void verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const goHome = () => {
    setLocation("/home");
  };

  return (
    <AuthSplitLayout
      panelTitle="Confirm your email"
      panelSubtitle="Verification keeps your account secure and unlocks ACCESS Ready practice."
      panelFeatures={PANEL_FEATURES}
      showBack={false}
    >
      <AnimatePresence mode="wait">
        {step === "verifying" && <EmailVerificationLoading key="verifying" />}
        {step === "success" && (
          <EmailVerificationSuccess key="success" onContinue={goHome} />
        )}
        {step === "invalid" && (
          <EmailVerificationInvalid key="invalid" onLogin={() => setLocation("/login")} />
        )}
      </AnimatePresence>
    </AuthSplitLayout>
  );
}
