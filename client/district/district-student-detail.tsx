import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetStudent, getGetStudentQueryKey } from "@/api-generated";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, AlertCircle, Mail, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { DeleteStudentDialog } from "@/teacher/components/delete-student-dialog";
import { useApi, extractErrorMessage } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { MemberActiveToggle } from "./member-active-toggle";
import { motion } from "framer-motion";
import { PageContainer } from "@/components/page-container";
import { PageBackLink, PageHeader, StudentMetaLine } from "@/components/page-header";
import { LoadingScreen } from "@/components/loading-screen";
import { StudentDomainProgressBars } from "@/components/student-domain-progress-bars";
import { StudentDomainChart } from "@/components/student-domain-chart";
import { StudentAiUsageChart } from "@/components/student-ai-usage-chart";
import { useAuth } from "@/hooks/use-auth";
import { DASHBOARD_PANEL, DASHBOARD_PANEL_HOVER } from "@/components/dashboard-ui-styles";
import { cn } from "@/lib/utils";

export default function DistrictStudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const [, setLocation] = useLocation();
  const { ready, userType } = useAuth();
  const { request } = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [verifying, setVerifying] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (ready && userType !== "district_admin") setLocation("/");
  }, [ready, userType, setLocation]);

  const { data, isLoading, isError } = useGetStudent(studentId || "", {
    query: { enabled: !!studentId && userType === "district_admin", queryKey: getGetStudentQueryKey(studentId || "") },
  });

  if (!ready || isLoading) return <LoadingScreen />;

  if (isError || !data) {
    return (
      <PageContainer className="space-y-8" themeWash>
        <PageHeader
          leading={<PageBackLink onClick={() => setLocation("/district")}>Back to district</PageBackLink>}
          eyebrow="Student profile"
          title="Student not found"
          description="Could not load this student. They may have been removed or you may not have access."
        />
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
    <PageContainer className="space-y-8" themeWash>
      <PageHeader
        leading={<PageBackLink onClick={() => setLocation("/district")}>Back to district</PageBackLink>}
        eyebrow="Student profile"
        title={student.name}
        description={<StudentMetaLine assessment={student.stateAssessment} gradeBand={student.gradeBand} />}
        actions={
          <Button
            type="button"
            variant="outline"
            className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10 font-semibold rounded-xl"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete student
          </Button>
        }
      />

      <DeleteStudentDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        student={{ id: student.id, name: student.name }}
        successDescription="was permanently removed from the district."
        onSuccess={() => setLocation("/district")}
      />

      {studentAccount.email && (
        <Card className={DASHBOARD_PANEL}>
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
        <Card className={DASHBOARD_PANEL}>
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
            <Card className={DASHBOARD_PANEL_HOVER}>
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

      <Card className={DASHBOARD_PANEL}>
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
