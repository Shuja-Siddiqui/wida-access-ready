import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { InputField } from "@/components/input-field";
import { useAuth } from "@/hooks/use-auth";
import { useApi, ApiError } from "@/hooks/use-api";
import { PageLoader } from "@/components/loading-screen";

type Step = "loading" | "form" | "success" | "invalid";

interface InviteInfo {
  inviteeName: string;
  inviteeEmail: string;
  inviterName: string;
  inviterRole: string;
  inviteeRole?: string;
  gradeBand?: string;
  stateAssessment?: string;
  homeLanguage?: string;
}

export default function AcceptInvite() {
  const [, setLocation] = useLocation();
  const { loginWithToken } = useAuth();
  const { request } = useApi();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [step, setStep] = useState<Step>(token ? "loading" : "invalid");
  const [invite, setInvite] = useState<InviteInfo | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const passwordLongEnough = password.length >= 8;
  const passwordsMatch = password === confirmPassword;

  useEffect(() => {
    if (!token) return;

    const checkInvite = async () => {
      try {
        const data = await request<InviteInfo>(
          `/api/auth/invite/check?token=${encodeURIComponent(token)}`,
        );
        setInvite(data);
        setStep("form");
      } catch {
        setStep("invalid");
      }
    };

    void checkInvite();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordLongEnough || !passwordsMatch || submitting) return;
    setErrorMsg("");
    setSubmitting(true);

    try {
      const data = await request<{ token?: string; studentId?: string; teacherId?: string }>(
        "/api/auth/invite/accept",
        {
          method: "POST",
          body: JSON.stringify({ token, password }),
        },
      );

      if (data.token) {
        loginWithToken(data.token, {
          studentId: data.studentId,
          teacherId: data.teacherId,
        });
      }

      setStep("success");
      // Route educators to their dashboard automatically
      if (data.teacherId && !data.studentId) {
        const dest = invite?.inviteeRole === "principal" ? "/principal" : "/teacher";
        setTimeout(() => setLocation(dest), 2000);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrorMsg("An account already exists with this email. Please log in instead.");
      } else {
        setErrorMsg(
          err instanceof ApiError
            ? (err.data as { error?: string } | null)?.error ?? "Something went wrong. Please try again."
            : "Something went wrong. Please try again.",
        );
      }
      setSubmitting(false);
    }
  };

  const slide = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  };

  const roleLabel =
    invite?.inviterRole === "parent"
      ? "parent"
      : invite?.inviterRole === "district_admin"
        ? "district administrator"
        : "teacher";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="absolute top-0 right-0 p-6">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary border border-border/40  flex items-center justify-center mb-6 transform ">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground ">Accept Invitation</h1>
          {invite && (
            <p className="text-muted-foreground text-sm font-bold mt-2 uppercase tracking-widest">
              {invite.inviterName} ({roleLabel}) invited you
            </p>
          )}
        </div>

        <div className="bg-card border border-border/40 shadow-sm rounded-2xl  p-8">
          <AnimatePresence mode="wait">
            {step === "loading" && (
              <motion.div key="loading" {...slide} className="flex flex-col items-center gap-6 py-6">
                <PageLoader />
                <p className="text-muted-foreground font-bold uppercase tracking-widest">Loading invitation</p>
              </motion.div>
            )}

            {step === "form" && invite && (
              <motion.div key="form" {...slide} className="space-y-6">
                <div className="bg-muted border border-border/40 rounded-xl p-5  space-y-2">
                  <p className="text-lg font-bold text-foreground tracking-wide">{invite.inviteeName}</p>
                  <p className="text-sm font-bold text-muted-foreground">{invite.inviteeEmail}</p>
                  {invite.stateAssessment && (
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
                      Assessment: <span className="text-foreground">{invite.stateAssessment}</span>
                      {invite.gradeBand && <> · Grade <span className="text-foreground">{invite.gradeBand}</span></>}
                    </p>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    Choose a password to activate
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <InputField
                    label="Create password"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    icon={Lock}
                    rightAddon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-foreground p-2"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    error={password && !passwordLongEnough ? "Minimum 8 characters" : undefined}
                  />

                  <InputField
                    label="Confirm password"
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    icon={Lock}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    error={confirmPassword && !passwordsMatch ? "Passwords don't match" : undefined}
                  />

                  {errorMsg && (
                    <div className="bg-destructive/10 border border-destructive p-3 rounded-xl mt-4">
                      <p className="text-sm font-bold text-destructive text-center">{errorMsg}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={!passwordLongEnough || !passwordsMatch || submitting}
                    className="w-full h-14 text-lg font-bold bg-gradient-to-br from-primary to-[#e91e8c] text-white shadow-[0_4px_14px_rgba(255,77,141,0.4)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,77,141,0.5)] active:translate-y-0 active:shadow-sm transition-all duration-300 rounded-xl mt-6 border-none"
                  >
                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Activate my account"}
                  </Button>
                </form>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div key="success" {...slide} className="flex flex-col items-center gap-8 py-4">
                <div className="w-20 h-20 rounded-2xl bg-[hsl(var(--growth-green))] border border-border/40  flex items-center justify-center transform ">
                  <CheckCircle className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="text-center space-y-3">
                  <p className="text-3xl font-bold text-foreground tracking-tight">You're in!</p>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    {invite?.inviteeRole === "principal"
                      ? "Taking you to your dashboard…"
                      : invite?.inviteeRole === "teacher"
                        ? "Taking you to your dashboard…"
                        : "Ready to start practicing?"}
                  </p>
                </div>
                {invite?.inviteeRole !== "teacher" && invite?.inviteeRole !== "principal" && (
                  <Button
                    className="w-full h-14 text-lg font-bold bg-gradient-to-br from-primary to-[#e91e8c] text-white shadow-[0_4px_14px_rgba(255,77,141,0.4)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,77,141,0.5)] active:translate-y-0 active:shadow-sm transition-all duration-300 rounded-xl mt-6 border-none"
                    onClick={() => setLocation("/home")}
                  >
                    Start practicing
                  </Button>
                )}
              </motion.div>
            )}

            {step === "invalid" && (
              <motion.div key="invalid" {...slide} className="flex flex-col items-center gap-8 py-4">
                <div className="w-20 h-20 rounded-2xl bg-[hsl(var(--energy-orange))] border border-border/40  flex items-center justify-center transform ">
                  <AlertCircle className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="text-center space-y-3">
                  <p className="text-3xl font-bold text-foreground tracking-tight">Invite expired</p>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    Ask for a new invitation
                  </p>
                </div>
                <Button
                  className="w-full h-14 text-lg font-bold bg-card text-foreground border border-border shadow-sm hover:bg-muted/60 transition-all rounded-xl mt-4"
                  onClick={() => setLocation("/login")}
                >
                  Go to log in
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
