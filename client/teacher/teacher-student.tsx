import { useParams, useLocation } from "wouter";
import { useGetStudent, getGetStudentQueryKey } from "@/api-generated";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit3, Calendar, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { PageContainer } from "@/components/page-container";
import { LoadingScreen } from "@/components/loading-screen";
import { StudentDomainProgressBars } from "@/components/student-domain-progress-bars";
import { StudentDomainChart } from "@/components/student-domain-chart";

export default function TeacherStudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const [, setLocation] = useLocation();

  const { data, isLoading } = useGetStudent(studentId || "", {
    query: { enabled: !!studentId, queryKey: getGetStudentQueryKey(studentId || "") }
  });

  if (isLoading || !data) {
    return <LoadingScreen />;
  }

  const { student, progress, recentSessions } = data;

  const chartSessions = recentSessions.map((s) => ({
    domain: s.domain,
    levelStart: s.levelStart ?? 0,
  }));

  return (
    <PageContainer maxWidth="max-w-5xl" className="space-y-8">
      <Button variant="ghost" onClick={() => setLocation("/teacher")} className="mb-2 text-muted-foreground hover:text-foreground -ml-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Roster
      </Button>

      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-foreground tracking-tight">{student.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2 font-medium text-sm">
            <span className="font-bold text-foreground bg-muted border border-border/40 shadow-sm px-2 py-0.5 rounded-lg">{student.stateAssessment}</span>
            <span className="font-bold text-foreground">Grade {student.gradeBand}</span>
          </p>
        </div>
        <Button onClick={() => setLocation(`/teacher/student/${student.id}/scores`)} className="font-bold rounded-xl h-11 px-6 border border-border/40 shadow-sm  hover:-translate-y-1 hover:shadow-sm  active:translate-y-0 active:shadow-sm transition-all">
          <Edit3 className="w-4 h-4 mr-2" /> Update Scores
        </Button>
      </div>

      {/* Current level tiles — always visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {progress.domains.map((d, i) => (
          <motion.div key={d.domain} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="rounded-2xl border border-border/40 shadow-sm transition-all  hover:-translate-y-1 hover:shadow-sm bg-card">
              <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-1">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{d.domain}</span>
                <span className="text-5xl font-black text-foreground">{d.currentLevel.toFixed(1)}</span>
                <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">Target: {d.exitThreshold}</span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Large screen: line chart */}
      <div className="hidden lg:block">
        <StudentDomainChart sessions={chartSessions} />
      </div>

      {/* Small / medium screen: animated progress bars */}
      <div className="lg:hidden">
        <h2 className="text-lg font-black mb-3 text-foreground">Domain progress</h2>
        <StudentDomainProgressBars domains={progress.domains} />
      </div>

      {/* Exit projections — always visible */}
      <Card className="rounded-2xl border border-border/40 shadow-sm bg-card">
        <CardHeader className="border-b border-border/10 pb-4">
          <CardTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Exit Projections
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-1">
            {progress.exitProjections.map((ep, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-transparent hover:border-border/10 hover:bg-muted/30 transition-all hover:shadow-sm">
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
