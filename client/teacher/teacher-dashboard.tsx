import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useGetTeacherDashboard, getGetTeacherDashboardQueryKey, useExportStudentsCsv, type Student } from "@/api-generated";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/page-container";
import { LoadingScreen } from "@/components/loading-screen";
import { StatCard } from "@/components/stat-card";
import { DomainLevelBadge } from "@/teacher/components/domain-level-badge";
import { StudentStatusBadge } from "@/teacher/components/student-status-badge";
import { StudentFormDialog } from "@/teacher/components/student-form-dialog";
import { DeleteStudentDialog } from "@/teacher/components/delete-student-dialog";
import { Download, Flame, Users, Activity, AlertTriangle, Target, Plus, Pencil, Trash2, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { useHasActivePlan } from "@/hooks/use-has-active-plan";
import { PlanGatedAction } from "@/components/plan-gated-action";

export default function TeacherDashboard() {
  const { teacherId, ready: authReady, teacher } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  useEffect(() => {
    if (authReady && !teacherId) {
      setLocation("/");
    }
  }, [authReady, teacherId, setLocation]);

  const { data: dashboard, isLoading } = useGetTeacherDashboard(teacherId || "", {
    query: { enabled: !!teacherId, queryKey: getGetTeacherDashboardQueryKey(teacherId || "") }
  });

  const { hasPlan, isLoading: planLoading } = useHasActivePlan(teacherId);

  // Solo teachers (schoolId = null) manage their own billing + roster.
  // School-managed teachers (schoolId set) are read-only — principal manages everything.
  const isSoloTeacher = !teacher?.schoolId;

  const refreshRoster = () => {
    queryClient.invalidateQueries({ queryKey: getGetTeacherDashboardQueryKey(teacherId || "") });
  };

  const handleExport = async () => {
    if (!teacherId) return;
    try {
      // In real implementation this would trigger download from useExportStudentsCsv
    } catch (e) {}
  };

  if (!teacherId || isLoading || !dashboard) {
    return <LoadingScreen />;
  }

  const stalledCount = dashboard.allStudents.filter((s) => s.isStalled).length;

  return (
    <PageContainer className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-sm font-medium text-muted-foreground">
              Track every learner's progress toward their exit goal.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleExport} variant="outline" className="font-bold border border-border/40 shadow-sm  hover:-translate-y-1 hover:shadow-sm  active:translate-y-0 active:shadow-sm transition-all rounded-xl bg-card hover:bg-card">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            {isSoloTeacher && (
              <>
                <PlanGatedAction hasPlan={hasPlan} isLoading={planLoading} label="Import Students" icon={<Upload className="w-4 h-4" />} variant="outline" className="shadow-sm">
                  <Button onClick={() => setLocation("/teacher/import")} variant="outline" className="font-bold border border-border/40 shadow-sm  hover:-translate-y-1 hover:shadow-sm  active:translate-y-0 active:shadow-sm transition-all rounded-xl bg-card hover:bg-card">
                    <Upload className="w-4 h-4 mr-2" /> Import Students
                  </Button>
                </PlanGatedAction>
                <PlanGatedAction hasPlan={hasPlan} isLoading={planLoading} label="Add Student" icon={<Plus className="w-4 h-4" />} className="btn-brand shadow-sm">
                  <Button
                    onClick={() => { setEditingStudent(null); setFormOpen(true); }}
                    className="btn-brand font-bold border border-border/40 shadow-sm  hover:-translate-y-1 hover:shadow-sm  active:translate-y-0 active:shadow-sm transition-all rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Student
                  </Button>
                </PlanGatedAction>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Students" value={dashboard.totalStudents} />
          <StatCard icon={Activity} label="Active today" value={dashboard.activeToday} tone="success" />
          <StatCard icon={Target} label="Close to exit" value={dashboard.exitWatchList.length} tone="warning" />
          <StatCard icon={AlertTriangle} label="Stalled" value={stalledCount} tone="danger" />
        </div>

        {dashboard.exitWatchList.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-streak-gold/10 border border-border/40 shadow-sm p-5 rounded-2xl">
            <h2 className="text-streak-gold font-black flex items-center gap-2 mb-3 text-lg">
              <Flame className="w-5 h-5 fill-streak-gold" /> Close to Exit
            </h2>
            <div className="flex gap-2 flex-wrap">
              {dashboard.exitWatchList.map(s => (
                <Badge key={s.student.id} variant="outline" className="bg-card text-foreground font-bold border border-border/40 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-streak-gold/20  hover:-translate-y-1 hover:bg-muted/60 shadow-sm transition-all active:translate-y-0" onClick={() => setLocation(`/teacher/student/${s.student.id}`)}>
                  {s.student.name}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        <div className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border/40">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="font-extrabold text-foreground h-12">Student</TableHead>
                <TableHead className="font-extrabold text-foreground h-12">Assessment</TableHead>
                <TableHead className="font-extrabold text-trust-blue text-center h-12">Listening</TableHead>
                <TableHead className="font-extrabold text-growth-green text-center h-12">Speaking</TableHead>
                <TableHead className="font-extrabold text-energy-orange text-center h-12">Reading</TableHead>
                <TableHead className="font-extrabold text-achieve-purple text-center h-12">Writing</TableHead>
                <TableHead className="font-extrabold text-foreground text-center h-12">Streak</TableHead>
                <TableHead className="font-extrabold text-foreground text-right h-12">Status</TableHead>
                <TableHead className="font-extrabold text-foreground text-right h-12 pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.allStudents.map((s) => {
                const l = s.domains.find(d => d.domain === "listening");
                const sp = s.domains.find(d => d.domain === "speaking");
                const r = s.domains.find(d => d.domain === "reading");
                const w = s.domains.find(d => d.domain === "writing");
                
                return (
                  <TableRow key={s.student.id} className="cursor-pointer hover:bg-muted/30 transition-colors border-b border-border/10 last:border-none group" onClick={() => setLocation(`/teacher/student/${s.student.id}`)}>
                    <TableCell className="font-black text-foreground group-hover:text-primary transition-colors">{s.student.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm font-medium">{s.student.stateAssessment}</TableCell>
                    <TableCell className="text-center"><DomainLevelBadge level={l?.currentLevel} domain="listening" /></TableCell>
                    <TableCell className="text-center"><DomainLevelBadge level={sp?.currentLevel} domain="speaking" /></TableCell>
                    <TableCell className="text-center"><DomainLevelBadge level={r?.currentLevel} domain="reading" /></TableCell>
                    <TableCell className="text-center"><DomainLevelBadge level={w?.currentLevel} domain="writing" /></TableCell>
                    <TableCell className="text-center">
                       <span className="font-black text-streak-gold flex items-center justify-center gap-1">
                         {s.student.currentStreak > 0 && <Flame className="w-3.5 h-3.5 fill-streak-gold" />}
                         {s.student.currentStreak}
                       </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <StudentStatusBadge isInactive={s.isInactive} isActive={s.isActive} isStalled={s.isStalled} />
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${s.student.name}`}
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                          onClick={(e) => { e.stopPropagation(); setEditingStudent(s.student); setFormOpen(true); }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${s.student.name}`}
                          className="h-8 w-8 text-muted-foreground hover:text-energy-orange hover:bg-energy-orange/10 rounded-lg"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(s.student); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <StudentFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          teacherId={teacherId}
          student={editingStudent}
          onSuccess={refreshRoster}
        />
        <DeleteStudentDialog
          open={!!deleteTarget}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
          student={deleteTarget}
          onSuccess={refreshRoster}
        />
    </PageContainer>
  );
}
