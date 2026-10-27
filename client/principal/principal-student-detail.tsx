import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Flame, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { PageBackLink, PageHeader, StudentMetaLine } from "@/components/page-header";

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
    </PageContainer>
  );
}
