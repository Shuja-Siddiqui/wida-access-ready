import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const slide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

function StatusIcon({ children }: { children: ReactNode }) {
  return (
    <div className="w-20 h-20 rounded-2xl bg-brand-gradient-soft border border-primary/20 flex items-center justify-center shadow-sm">
      {children}
    </div>
  );
}

export function EmailVerificationLoading() {
  return (
    <motion.div {...slide} className="flex flex-col items-center gap-6 py-4 text-center w-full max-w-md">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <div>
        <h1 className="heading-page text-2xl sm:text-3xl">Verifying your email</h1>
        <p className="text-muted-foreground font-medium mt-2">This only takes a moment.</p>
      </div>
    </motion.div>
  );
}

export function EmailVerificationSuccess({ onContinue }: { onContinue: () => void }) {
  return (
    <motion.div {...slide} className="flex flex-col items-center gap-8 py-2 text-center w-full max-w-md">
      <StatusIcon>
        <CheckCircle2 className="w-10 h-10 text-primary" />
      </StatusIcon>
      <div className="space-y-2">
        <h1 className="heading-page text-2xl sm:text-3xl">Email verified</h1>
        <p className="text-muted-foreground font-medium">Your account is active. You can start practicing.</p>
      </div>
      <Button className="btn-brand w-full h-12 rounded-xl text-base" onClick={onContinue}>
        Start practicing
      </Button>
    </motion.div>
  );
}

export function EmailVerificationInvalid({ onLogin }: { onLogin: () => void }) {
  return (
    <motion.div {...slide} className="flex flex-col items-center gap-8 py-2 text-center w-full max-w-md">
      <StatusIcon>
        <AlertCircle className="w-10 h-10 text-primary" />
      </StatusIcon>
      <div className="space-y-2">
        <h1 className="heading-page text-2xl sm:text-3xl">Link expired</h1>
        <p className="text-muted-foreground font-medium">
          This verification link is invalid or has expired. Log in to request a new one.
        </p>
      </div>
      <Button
        variant="outline"
        className="w-full h-12 rounded-xl font-bold border-border/60"
        onClick={onLogin}
      >
        Go to log in
      </Button>
    </motion.div>
  );
}

export function EmailVerificationCheckInbox({
  email,
  onLogin,
  onResend,
  resendLabel = "Resend email",
}: {
  email: string;
  onLogin: () => void;
  onResend?: () => void | Promise<void>;
  resendLabel?: string;
}) {
  return (
    <motion.div {...slide} className="space-y-8 text-center w-full max-w-md">
      <div className="flex justify-center">
        <StatusIcon>
          <Mail className="w-10 h-10 text-primary" />
        </StatusIcon>
      </div>
      <div className="space-y-3">
        <h1 className="heading-page text-2xl sm:text-3xl">Check your inbox</h1>
        <p className="text-muted-foreground font-medium">We sent a verification link to</p>
        <p className="text-foreground font-bold text-lg break-all">{email}</p>
        <p className="text-muted-foreground text-sm font-medium">
          Click the link in that email to activate your account.
        </p>
      </div>
      <div className="rounded-2xl border border-border/50 bg-muted/30 p-5 text-left space-y-2">
        <p className="text-sm font-semibold text-foreground">Didn&apos;t get it?</p>
        <p className="text-sm text-muted-foreground font-medium">
          Check spam or promotions, or{" "}
          {onResend ? (
            <button
              type="button"
              onClick={() => void onResend()}
              className="font-bold text-primary hover:underline"
            >
              {resendLabel}
            </button>
          ) : (
            "try again in a few minutes"
          )}
          .
        </p>
      </div>
      <Button
        variant="outline"
        className="w-full h-12 rounded-xl font-bold border-border/60"
        onClick={onLogin}
      >
        Back to log in
      </Button>
    </motion.div>
  );
}
