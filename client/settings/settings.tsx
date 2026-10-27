import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Lock, Loader2, Sparkles } from "lucide-react";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { LoadingScreen } from "@/components/loading-screen";
import { AppInput } from "@/components/app-input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/contexts/user-context";
import { useApi, extractErrorMessage } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DASHBOARD_PANEL } from "@/components/dashboard-ui-styles";
import { getGetStudentQueryKey } from "@/api-generated";
import { useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const { ready, studentId, teacherId } = useAuth();
  const { studentData, refetchStudent } = useUser();
  const { request } = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const student = studentData?.student as
    | {
        aiSuggestionsEnabled?: boolean;
        hasPassword?: boolean;
      }
    | undefined;

  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!studentId && !teacherId) {
      setLocation("/login");
    }
  }, [ready, studentId, teacherId, setLocation]);

  useEffect(() => {
    if (student?.aiSuggestionsEnabled !== undefined) {
      setAiSuggestions(student.aiSuggestionsEnabled);
    }
  }, [student?.aiSuggestionsEnabled]);

  if (!ready) {
    return <LoadingScreen />;
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    try {
      await request("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password updated", description: "Use your new password next time you sign in." });
    } catch (err) {
      toast({ title: extractErrorMessage(err), variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleAiSuggestionsChange(checked: boolean) {
    if (!studentId) return;
    const previous = aiSuggestions;
    setAiSuggestions(checked);
    setSavingPrefs(true);
    try {
      await request(`/api/students/${studentId}/preferences`, {
        method: "PATCH",
        body: JSON.stringify({ aiSuggestionsEnabled: checked }),
      });
      await queryClient.invalidateQueries({ queryKey: getGetStudentQueryKey(studentId) });
      refetchStudent();
      toast({
        title: checked ? "AI suggestions on" : "AI suggestions off",
        description: checked
          ? "Coach notes will appear after practice sessions."
          : "We will not send your sessions to AI for coach suggestions.",
      });
    } catch (err) {
      setAiSuggestions(previous);
      toast({ title: extractErrorMessage(err), variant: "destructive" });
    } finally {
      setSavingPrefs(false);
    }
  }

  const showAiToggle = Boolean(studentId);

  return (
    <PageContainer className="space-y-8" themeWash>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your password and, for students, AI coach suggestions."
      />

      <div
        className={cn(
          "flex flex-col gap-6 lg:gap-8",
          showAiToggle && "lg:flex-row lg:items-start",
        )}
      >
      <section
        className={cn(
          DASHBOARD_PANEL,
          "p-6 sm:p-7 space-y-5 min-w-0",
          showAiToggle && "lg:flex-1",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/25 to-trust-blue/15 flex items-center justify-center ring-1 ring-white/10">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-black text-lg text-foreground">Password</h2>
            <p className="text-xs text-muted-foreground font-medium">
              {student?.hasPassword === false
                ? "Set a password at login if you were invited without one."
                : "Change the password you use to sign in."}
            </p>
          </div>
        </div>

        <form onSubmit={(e) => void handleChangePassword(e)} className="space-y-4">
          <AppInput
            label="Current password"
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <AppInput
            label="New password"
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <AppInput
            label="Confirm new password"
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={savingPassword || !currentPassword || !newPassword}
            className="btn-brand h-11 w-full sm:w-auto px-8 rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {savingPassword ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </span>
            ) : (
              "Update password"
            )}
          </button>
        </form>
      </section>

      {showAiToggle && (
        <section
          className={cn(
            DASHBOARD_PANEL,
            "p-5 sm:p-6 min-w-0 w-full lg:w-auto lg:max-w-sm lg:shrink-0 self-start",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-trust-blue/20 to-primary/10 flex items-center justify-center ring-1 ring-white/10 shrink-0">
                <Sparkles className="w-4 h-4 text-trust-blue" />
              </div>
              <h2 className="font-black text-base text-foreground leading-tight">AI coach suggestions</h2>
            </div>
            <Switch
              checked={aiSuggestions}
              disabled={savingPrefs}
              onCheckedChange={(v) => void handleAiSuggestionsChange(v)}
              aria-label="AI coach suggestions"
              className="shrink-0"
            />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-3 leading-relaxed">
            When on, coach notes appear on your dashboard after practice. When off, session data is not sent to AI for
            suggestions.
          </p>
        </section>
      )}
      </div>
    </PageContainer>
  );
}
