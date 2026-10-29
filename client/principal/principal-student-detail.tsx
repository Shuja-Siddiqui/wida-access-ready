import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Flame, Star, Trash2, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteStudentDialog } from "@/teacher/components/delete-student-dialog";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/page-container";
import { LoadingScreen } from "@/components/loading-screen";
import { StatCard } from "@/components/stat-card";
import { StudentDomainProgressBars } from "@/components/student-domain-progress-bars";
import { StudentDomainChart } from "@/components/student-domain-chart";
import { StudentAiUsageChart } from "@/components/student-ai-usage-chart";
import { principalApi, type StudentDetailResponse } from "./api";
import { DASHBOARD_PANEL, DASHBOARD_PANEL_HOVER } from "@/components/dashboard-ui-styles";
import { PageBackLink, PageHeader, StudentProfileDescription } from "@/components/page-header";

export default function PrincipalStudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const [, setLocation] = useLocation();
  const { request } = useApi();
  const { toast } = useToast();

  const [detail, setDetail] = useState<StudentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    void loadData(studentId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  async function loadData(id: string) {
    setLoading(true);
    try {
      const data = await principalApi.fetchStudentDetail(id, request);
      setDetail(data);
    } catch {
      toast({ title: "Failed to load student profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  if (loading || !detail) return <LoadingScreen />;

  const { student, progress, recentSessions } = detail;

  const chartSessions = recentSessions
    .filter((s) => s.levelStart != null)
    .map((s) => ({ domain: s.domain, levelStart: s.levelStart }));

  return (
    <PageContainer className="space-y-8" themeWash>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader
          leading={<PageBackLink onClick={() => setLocation("/principal")}>Back to school</PageBackLink>}
          eyebrow="Student profile"
          title={student.name}
          description={
            <StudentProfileDescription
              email={student.email}
              assessment={student.stateAssessment}
              gradeBand={student.gradeBand}
            />
          }
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
      </motion.div>

      <DeleteStudentDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        student={{ id: student.id, name: student.name }}
        successDescription="was permanently removed from your school."
        onSuccess={() => setLocation("/principal")}
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Flame} label="Day streak" value={student.currentStreak} tone="warning" />
        <StatCard icon={Star} label="Total XP" value={(student.totalXp ?? 0).toLocaleString()} />
      </div>

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

      {studentId && <StudentAiUsageChart studentId={studentId} />}

      {/* Large screen: line chart */}
      <div className="hidden lg:block">
        <StudentDomainChart sessions={chartSessions} />
      </div>

      {/* Small / medium screen: animated progress bars */}
      <div className="lg:hidden">
        <h2 className="text-lg font-black mb-3 text-foreground">Domain progress</h2>
        <StudentDomainProgressBars domains={progress.domains} />
      </div>

      {(progress.exitProjections?.length ?? 0) > 0 && (
        <Card className={DASHBOARD_PANEL}>
          <CardHeader className="border-b border-border/10 pb-4">
            <CardTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Exit Projections
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-1">
              {progress.exitProjections!.map((ep, i) => (
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
      )}
    </PageContainer>
  );
}
