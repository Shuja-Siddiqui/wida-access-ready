import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Flame, Star } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/page-container";
import { LoadingScreen } from "@/components/loading-screen";
import { StatCard } from "@/components/stat-card";
import { StudentDomainProgressBars } from "@/components/student-domain-progress-bars";
import { StudentDomainChart } from "@/components/student-domain-chart";
import { StudentAiUsageChart } from "@/components/student-ai-usage-chart";
import { principalApi, type StudentDetailResponse } from "./api";

export default function PrincipalStudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const [, setLocation] = useLocation();
  const { request } = useApi();
  const { toast } = useToast();

  const [detail, setDetail] = useState<StudentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

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
    <PageContainer maxWidth="max-w-5xl" className="space-y-6">
      {/* Back */}
      <button
        onClick={() => setLocation("/principal")}
        className="flex items-center gap-2 text-sm text-foreground bg-card border border-border/40 shadow-sm px-3 py-1.5 rounded-lg  hover:-translate-y-1 hover:shadow-xl active:translate-y-0 transition-all font-bold w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to school
      </button>

      {/* Student header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border/40 shadow-sm rounded-2xl p-6 flex items-start gap-5"
      >
        <div className="w-16 h-16 rounded-2xl bg-[hsl(150_62%_41%)]/10 border border-[hsl(150_62%_41%)]/20 flex items-center justify-center text-2xl font-black text-[hsl(150_62%_41%)] flex-shrink-0">
          {student.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-black tracking-tight">{student.name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="font-bold text-foreground bg-muted border border-border/40 shadow-sm px-2 py-0.5 rounded-lg text-sm">
              {student.stateAssessment}
            </span>
            <span className="text-sm font-bold text-muted-foreground">Grade {student.gradeBand}</span>
          </div>
        </div>
      </motion.div>

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
