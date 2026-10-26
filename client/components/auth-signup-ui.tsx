import type { LucideIcon } from "lucide-react";
import { ChevronRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export const authStepMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export function AuthFormHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-8 space-y-2">
      {eyebrow ? <p className="auth-eyebrow">{eyebrow}</p> : null}
      <h1 className="auth-title">{title}</h1>
      {subtitle ? <p className="auth-subtitle">{subtitle}</p> : null}
    </header>
  );
}

export function AuthStepProgress({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center gap-2 mb-8" aria-hidden>
      {Array.from({ length: total }, (_, i) => i + 1).map((i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-500 ${
            current >= i ? "bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)]" : "bg-muted/80"
          }`}
        />
      ))}
    </div>
  );
}

export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3">
      <p className="text-sm font-medium text-destructive leading-snug">{message}</p>
    </div>
  );
}

export function AuthPrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="btn-brand w-full h-12 rounded-xl text-[15px] font-semibold tracking-tight disabled:opacity-50 disabled:pointer-events-none"
    >
      {children}
    </button>
  );
}

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-border/80" />
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border/80" />
    </div>
  );
}

export function AuthRoleCard({
  icon: Icon,
  title,
  description,
  index,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className="group relative w-full flex items-center gap-4 rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-4 text-left shadow-sm transition-all duration-300 hover:border-primary/30 hover:bg-card hover:shadow-[0_8px_30px_hsl(var(--primary)/0.08)] hover:-translate-y-0.5"
    >
      <div className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center duration-300" />
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
        <Icon className="h-5 w-5" strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold tracking-tight text-foreground">{title}</p>
        <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </motion.button>
  );
}

export function AuthSubmitSpinner() {
  return <Loader2 className="mx-auto h-5 w-5 animate-spin" />;
}

export function AuthStepIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient-soft ring-1 ring-primary/15">
      {children}
    </div>
  );
}
