import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Plus, Loader2, ArrowLeft, School, User, Mail, X, MailCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { AppInput } from "@/components/app-input";
import { LoadingScreen } from "@/components/loading-screen";
import { useDistrict } from "@/contexts/district-context";
import { customFetch } from "@/api-generated/custom-fetch";

interface InviteSent {
  principalName: string;
  principalEmail: string;
}

interface FormState {
  schoolName: string;
  state: string;
  schoolCode: string;
  principalName: string;
  principalEmail: string;
}

const EMPTY_FORM: FormState = {
  schoolName: "",
  state: "",
  schoolCode: "",
  principalName: "",
  principalEmail: "",
};

export default function DistrictSchools() {
  const [, setLocation] = useLocation();
  const { ready, userType } = useAuth();
  const { toast } = useToast();
  const { district, schools, isLoading } = useDistrict();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [invited, setInvited] = useState<InviteSent | null>(null);

  useEffect(() => {
    if (ready && userType !== "district_admin") setLocation("/");
  }, [ready, userType, setLocation]);

  if (!ready || isLoading) return <LoadingScreen />;

  function field(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!district?.id) return;
    setSubmitting(true);
    try {
      await customFetch<{ ok: boolean }>(
        `/api/districts/${district.id}/schools`,
        {
          method: "POST",
          body: JSON.stringify({
            name:       form.schoolName.trim(),
            state:      form.state.trim() || undefined,
            schoolCode: form.schoolCode.trim() || undefined,
            principal: {
              name:  form.principalName.trim(),
              email: form.principalEmail.trim(),
            },
          }),
        },
      );
      setInvited({ principalName: form.principalName.trim(), principalEmail: form.principalEmail.trim() });
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send invitation";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer maxWidth="max-w-4xl" className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
          <div className="space-y-1">
            <button
              onClick={() => setLocation("/district")}
              className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to dashboard
            </button>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Schools</h1>
            <p className="text-sm font-medium text-muted-foreground">
              {district?.name ?? "My District"} · Manage schools and principals
            </p>
          </div>
          <Button
            onClick={() => { setShowForm(true); setInvited(null); }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl shadow-sm shadow-primary/25 shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add School
          </Button>
        </div>
      </motion.div>

      {/* Add-school form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border/40 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-extrabold text-foreground">New School</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
              {/* School details */}
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5" /> School details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AppInput
                    label="School name *"
                    id="schoolName"
                    value={form.schoolName}
                    onChange={field("schoolName")}
                    placeholder="Lincoln Elementary"
                    required
                  />
                  <AppInput
                    label="State"
                    id="state"
                    value={form.state}
                    onChange={field("state")}
                    placeholder="OH"
                    maxLength={2}
                  />
                  <div className="sm:col-span-2">
                    <AppInput
                      label="School code"
                      id="schoolCode"
                      value={form.schoolCode}
                      onChange={field("schoolCode")}
                      placeholder="LIN-001 (optional)"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border/40" />

              {/* Principal details */}
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Principal account
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AppInput
                    label="Full name *"
                    id="principalName"
                    value={form.principalName}
                    onChange={field("principalName")}
                    placeholder="Jane Smith"
                    required
                  />
                  <AppInput
                    label="Email *"
                    id="principalEmail"
                    type="email"
                    icon={Mail}
                    value={form.principalEmail}
                    onChange={field("principalEmail")}
                    placeholder="jsmith@district.edu"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  An invitation will be sent to the principal. The school is created in the system when they accept and set their password.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="font-bold rounded-xl"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl shadow-sm shadow-primary/25"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
                  ) : (
                    <><Mail className="w-4 h-4 mr-2" /> Send Invitation</>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success card — invitation sent */}
      <AnimatePresence>
        {invited && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-[hsl(150_62%_41%)]/8 border border-[hsl(150_62%_41%)]/25 rounded-2xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-black text-[hsl(150_62%_41%)] uppercase tracking-wide mb-1">
                  Invitation sent!
                </p>
                <p className="text-base font-bold text-foreground">{invited.principalName}</p>
              </div>
              <button
                onClick={() => setInvited(null)}
                className="text-muted-foreground hover:text-foreground transition-colors mt-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-start gap-3 bg-background rounded-xl px-4 py-3.5 border border-border">
              <MailCheck className="w-5 h-5 text-[hsl(150_62%_41%)] flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">Invitation email sent</p>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="font-mono break-all">{invited.principalEmail}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {invited.principalName} will receive a link to set their password and activate their account. The school is created when they accept. The link expires in 7 days.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schools list */}
      {schools.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl py-20 flex flex-col items-center gap-3 text-muted-foreground"
        >
          <Building2 className="w-10 h-10" />
          <p className="font-bold">No schools yet</p>
          <p className="text-sm text-center max-w-xs">
            Invite a principal to create your first school. The school is set up when they accept.
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl shadow-sm shadow-primary/25"
          >
            <Plus className="w-4 h-4 mr-2" /> Add School
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {schools.map((school, i) => (
            <motion.div
              key={school.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-foreground truncate">{school.name}</p>
                {school.state && (
                  <p className="text-xs text-muted-foreground">{school.state}</p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs font-black bg-[hsl(286_70%_58%)]/10 text-[hsl(286_70%_58%)] px-2.5 py-1 rounded-full">
                  {school.teacherCount ?? 0} teacher{school.teacherCount !== 1 ? "s" : ""}
                </span>
                <span className="text-xs font-black bg-[hsl(150_62%_41%)]/10 text-[hsl(150_62%_41%)] px-2.5 py-1 rounded-full">
                  {school.studentCount ?? 0} student{school.studentCount !== 1 ? "s" : ""}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
