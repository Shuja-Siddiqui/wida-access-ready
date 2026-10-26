import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetStudent, getGetStudentQueryKey } from "@/api-generated";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, AlertCircle, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { useApi, extractErrorMessage } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { MemberActiveToggle } from "./member-active-toggle";
import { motion } from "framer-motion";
import { PageContainer } from "@/components/page-container";
import { LoadingScreen } from "@/components/loading-screen";
import { StudentDomainProgressBars } from "@/components/student-domain-progress-bars";
import { StudentDomainChart } from "@/components/student-domain-chart";
import { StudentAiUsageChart } from "@/components/student-ai-usage-chart";
import { useAuth } from "@/hooks/use-auth";

export default function DistrictStudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const [, setLocation] = useLocation();
  const { ready, userType } = useAuth();
  const { request } = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (ready && userType !== "district_admin") setLocation("/");
  }, [ready, userType, setLocation]);

  const { data, isLoading, isError } = useGetStudent(studentId || "", {
    query: { enabled: !!studentId && userType === "district_admin", queryKey: getGetStudentQueryKey(studentId || "") },
  });

  if (!ready || isLoading) return <LoadingScreen />;

  if (isError || !data) {
    return (
      <PageContainer maxWidth="max-w-5xl" className="space-y-4">
        <Button variant="ghost" onClick={() => setLocation("/district")} className="-ml-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to district
        </Button>
        <p className="text-sm text-muted-foreground font-medium">Could not load this student.</p>
      </PageContainer>
    );
  }

  const { student, progress, recentSessions } = data;
  const studentAccount = student as typeof student & {
    emailVerified?: boolean;
    hasPassword?: boolean;
    isActive?: boolean;
  };

  async function markEmailVerified() {
    if (!studentId) return;
    setVerifying(true);
    try {
      await request(`/api/students/${studentId}/verify-email`, { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: getGetStudentQueryKey(studentId) });
      toast({ title: "Email marked as verified" });
    } catch (err) {
      toast({ title: extractErrorMessage(err), variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  }

  const chartSessions = recentSessions.map((s) => ({
    domain: s.domain,
    levelStart: s.levelStart ?? 0,
  }));

  return (
    <PageContainer maxWidth="max-w-5xl" className="space-y-8">
      <Button variant="ghost" onClick={() => setLocation("/district")} className="mb-2 text-muted-foreground hover:text-foreground -ml-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to district
      </Button>

      <div className="space-y-1">
        <h1 className="text-4xl font-black text-foreground tracking-tight">{student.name}</h1>
        <p className="text-muted-foreground flex items-center gap-2 font-medium text-sm flex-wrap">
          <span className="font-bold text-foreground bg-muted border border-border/40 shadow-sm px-2 py-0.5 rounded-lg">
            {student.stateAssessment}
          </span>
          <span className="font-bold text-foreground">Grade {student.gradeBand}</span>
        </p>
      </div>

      {studentAccount.email && (
        <Card className="rounded-2xl border border-border/40 shadow-sm bg-card">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-bold text-foreground truncate">{studentAccount.email}</p>
                <p className="text-xs text-muted-foreground">
                  {studentAccount.emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-growth-green font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Email verified (login)
                    </span>
                  ) : (
                    "Email not verified for login"
                  )}
                  {studentAccount.hasPassword === false && studentAccount.emailVerified && (
                    <span className="block mt-0.5">Student must create a password at login before signing in.</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <MemberActiveToggle
                kind="student"
                studentId={student.id}
                isActive={studentAccount.isActive ?? true}
                onUpdated={() =>
                  void queryClient.invalidateQueries({ queryKey: getGetStudentQueryKey(studentId || "") })
                }
              />
              {!studentAccount.emailVerified && (
                <Button
                  type="button"
                  onClick={() => void markEmailVerified()}
                  disabled={verifying}
                  className="btn-brand font-bold rounded-xl"
                >
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark email verified"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!studentAccount.email && (
        <Card className="rounded-2xl border border-border/40 shadow-sm bg-card">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">No login email on file for this student.</p>
            <MemberActiveToggle
              kind="student"
              studentId={student.id}
              isActive={studentAccount.isActive ?? true}
              onUpdated={() =>
                void queryClient.invalidateQueries({ queryKey: getGetStudentQueryKey(studentId || "") })
              }
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {progress.domains.map((d, i) => (
          <motion.div key={d.domain} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="rounded-2xl border border-border/40 shadow-sm transition-all hover:-translate-y-1 hover:shadow-sm bg-card">
              <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-1">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{d.domain}</span>
                <span className="text-5xl font-black text-foreground">{d.currentLevel.toFixed(1)}</span>
                <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                  Target: {d.exitThreshold}
                </span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <StudentAiUsageChart studentId={student.id} />

      <div className="hidden lg:block">
        <StudentDomainChart sessions={chartSessions} />
      </div>

      <div className="lg:hidden">
        <h2 className="text-lg font-black mb-3 text-foreground">Domain progress</h2>
        <StudentDomainProgressBars domains={progress.domains} />
      </div>

      <Card className="rounded-2xl border border-border/40 shadow-sm bg-card">
        <CardHeader className="border-b border-border/10 pb-4">
          <CardTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Exit Projections
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-1">
            {progress.exitProjections.map((ep, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-3 rounded-xl border border-transparent hover:border-border/10 hover:bg-muted/30 transition-all hover:shadow-sm"
              >
                <span className="font-black text-foreground text-sm capitalize">{ep.domain}</span>
                {ep.status === "at_exit" ? (
                  <span className="text-[hsl(150_62%_41%)] font-bold text-sm bg-[hsl(150_62%_41%)]/10 px-2 py-0.5 rounded-md">Ready</span>
                ) : ep.status === "stalled" ? (
                  <span className="text-[hsl(14_86%_57%)] font-bold text-sm flex items-center gap-1.5 bg-[hsl(14_86%_57%)]/10 px-2 py-0.5 rounded-md">
                    <AlertCircle className="w-3.5 h-3.5" /> Stalled
                  </span>
                ) : ep.weeksToExit ? (
                  <span className="text-foreground text-sm font-bold">{ep.weeksToExit} weeks</span>
                ) : (
                  <span className="text-muted-foreground text-sm font-medium italic">Need data</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {student.stateAssessment === "TELPAS" && (
        <p className="text-xs text-muted-foreground font-medium text-center mt-8 italic">
          * TELPAS proficiency levels are composite estimates based on continuous practice scoring.
        </p>
      )}
    </PageContainer>
  );
}
