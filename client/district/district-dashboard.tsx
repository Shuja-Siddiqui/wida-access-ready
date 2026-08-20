import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Users, GraduationCap, Upload, Loader2, ChevronDown, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useHasActivePlan } from "@/hooks/use-has-active-plan";
import { PlanGatedAction } from "@/components/plan-gated-action";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/loading-screen";
import { StatCard } from "@/components/stat-card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@/api-generated/custom-fetch";
import { useDistrict } from "@/contexts/district-context";
import { DistrictPlanCard } from "./district-plan-card";
import type { SchoolTeacher, SchoolStudent, DistrictPlanInfo, SchoolAllocation } from "./api";

const STALE_PANEL = 3 * 60 * 1000;
const STALE_PLAN = 60 * 1000;

interface SchoolPanel {
  teachers: SchoolTeacher[];
  students: (SchoolStudent & { guardianId?: string | null })[];
  loading: boolean;
}

export default function DistrictDashboard() {
  const [, setLocation] = useLocation();
  const { teacherId, ready, userType } = useAuth();
  const { hasPlan, isLoading: planLoading } = useHasActivePlan(teacherId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { district, schools, totalSchools, totalTeachers, totalStudents, isLoading } =
    useDistrict();

  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);

  useEffect(() => {
    if (ready && userType !== "district_admin") {
      setLocation("/");
    }
  }, [ready, userType, setLocation]);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [panels, setPanels] = useState<Record<string, SchoolPanel>>({});

  const planQuery = useQuery({
    queryKey: ["district-plan"],
    queryFn: () => customFetch<DistrictPlanInfo>("/api/district/plan"),
    enabled: ready && userType === "district_admin",
    staleTime: STALE_PLAN,
    retry: false,
  });

  const allocationsQuery = useQuery({
    queryKey: ["district-allocations"],
    queryFn: () => customFetch<SchoolAllocation[]>("/api/district/allocations"),
    enabled: ready && userType === "district_admin",
    staleTime: STALE_PLAN,
    retry: false,
  });

  function refreshPlan() {
    void queryClient.invalidateQueries({ queryKey: ["district-plan"] });
    void queryClient.invalidateQueries({ queryKey: ["district-allocations"] });
  }

  if (!ready || isLoading) return <LoadingScreen />;

  async function selectSchool(schoolId: string) {
    setSelectedSchool(schoolId);
    setSelectedTeacher(null);

    if (panels[schoolId]) return;

    setPanels((prev) => ({
      ...prev,
      [schoolId]: { teachers: [], students: [], loading: true },
    }));

    try {
      const [teachers, students] = await Promise.all([
        queryClient.fetchQuery<SchoolTeacher[]>({
          queryKey: ["school-panel-teachers", schoolId],
          queryFn: () =>
            customFetch<SchoolTeacher[]>(`/api/schools/${schoolId}/teachers`),
          staleTime: STALE_PANEL,
        }),
        queryClient.fetchQuery<(SchoolStudent & { guardianId?: string | null })[]>({
          queryKey: ["school-panel-students", schoolId],
          queryFn: () =>
            customFetch<(SchoolStudent & { guardianId?: string | null })[]>(
              `/api/schools/${schoolId}/students`,
            ),
          staleTime: STALE_PANEL,
        }),
      ]);
      setPanels((prev) => ({
        ...prev,
        [schoolId]: { teachers, students, loading: false },
      }));
    } catch {
      toast({ title: "Failed to load school data", variant: "destructive" });
      setPanels((prev) => ({
        ...prev,
        [schoolId]: { teachers: [], students: [], loading: false },
      }));
    }
  }

  const activePanel = selectedSchool ? panels[selectedSchool] : null;
  const planData = planQuery.data ?? null;
  const allocations = allocationsQuery.data ?? [];

  return (
    <PageContainer maxWidth="max-w-5xl" className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              {district?.name ?? "My District"}
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              {district?.state ? `${district.state} · District dashboard` : "District dashboard"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <Button
              onClick={() => setLocation("/district/schools")}
              className="bg-gradient-to-br from-primary to-[#e91e8c] text-white shadow-[0_4px_14px_rgba(255,77,141,0.4)] hover:shadow-[0_6px_20px_rgba(255,77,141,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-300 border-none font-bold rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" /> Add School
            </Button>
            <PlanGatedAction hasPlan={hasPlan} isLoading={planLoading} label="Import Students" icon={<Upload className="w-4 h-4" />} variant="outline" className="shadow-sm shrink-0">
              <Button onClick={() => setLocation("/district/import")} variant="outline" className="font-bold border border-border/40 shadow-sm  hover:-translate-y-1 hover:shadow-sm  active:translate-y-0 active:shadow-sm transition-all rounded-xl shrink-0 bg-card hover:bg-card">
                <Upload className="w-4 h-4 mr-2" /> Import Students
              </Button>
            </PlanGatedAction>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Building2} label="Schools" value={totalSchools} />
        <StatCard icon={Users} label="Teachers" value={totalTeachers} tone="warning" />
        <StatCard icon={GraduationCap} label="Students" value={totalStudents} tone="success" />
      </div>

      {/* Plan Card — always shown (handles no-plan state internally) */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wide text-muted-foreground px-1">
            District Plan
          </h2>
          {planQuery.isLoading ? (
            <div className="bg-card border border-border rounded-2xl px-5 py-6 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : planData ? (
            <DistrictPlanCard
              plan={planData}
              allocations={allocations}
              schools={schools}
              onRefresh={refreshPlan}
            />
          ) : (
            <div className="bg-card border border-border rounded-2xl px-5 py-4 text-sm text-muted-foreground">
              Unable to load plan information.
            </div>
          )}
        </div>
      </motion.div>

      {schools.length === 0 ? (
        <div className="bg-card border border-border/40 shadow-sm rounded-2xl py-16 flex flex-col items-center gap-2 text-muted-foreground">
          <Building2 className="w-10 h-10 mb-2" />
          <p className="font-bold">No schools in this district yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* School pill selector */}
          <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-hide px-1">
            {schools.map((school, i) => {
              const active = selectedSchool === school.id;
              return (
                <motion.button
                  key={school.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => void selectSchool(school.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 border border-border/40 ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm  -translate-y-1"
                      : "bg-card text-muted-foreground hover:text-foreground hover:shadow-sm hover: hover:-translate-y-0.5"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  {school.name}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-black border border-transparent ${
                    active ? "bg-white/20 border-white/30" : "bg-muted border-border/10"
                  }`}>
                    {school.teacherCount}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Content panel for selected school */}
          <AnimatePresence mode="wait">
            {selectedSchool && (
              <motion.div
                key={selectedSchool}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {activePanel?.loading ? (
                  <div className="py-16 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : !activePanel?.teachers.length ? (
                  <div className="bg-card border border-border/40 shadow-sm rounded-2xl py-12 flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="w-8 h-8 mb-2" />
                    <p className="font-bold text-sm">No teachers in this school yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activePanel.teachers.map((teacher, i) => {
                      const teacherStudents = activePanel.students.filter(
                        (s) => s.guardianId === teacher.id
                      );
                      const isOpen = selectedTeacher === teacher.id;

                      return (
                        <motion.div
                          key={teacher.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="bg-card border border-border/40 shadow-sm rounded-2xl overflow-hidden"
                        >
                          {/* Teacher row */}
                          <button
                            onClick={() => setSelectedTeacher(isOpen ? null : teacher.id)}
                            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors text-left group"
                          >
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-black text-primary flex-shrink-0">
                              {teacher.name[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-foreground truncate">{teacher.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{teacher.email}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="text-xs font-black bg-[hsl(150_62%_41%)]/10 border border-[hsl(150_62%_41%)]/20 text-[hsl(150_62%_41%)] px-3 py-1 rounded-full">
                                {teacherStudents.length} student{teacherStudents.length !== 1 ? "s" : ""}
                              </span>
                              <motion.div
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              </motion.div>
                            </div>
                          </button>

                          {/* Students drawer */}
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div className="border-t border-border/10 px-5 py-4 bg-muted/20">
                                  {teacherStudents.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4 font-bold">
                                      No students assigned to this teacher yet
                                    </p>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {teacherStudents.map((student, si) => (
                                        <motion.div
                                          key={student.id}
                                          initial={{ opacity: 0, x: -6 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: si * 0.03 }}
                                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/40 shadow-sm cursor-default"
                                        >
                                          <div className="w-10 h-10 rounded-xl bg-[hsl(286_70%_58%)]/10 border border-[hsl(286_70%_58%)]/20 flex items-center justify-center text-sm font-black text-[hsl(286_70%_58%)] flex-shrink-0">
                                            {student.name[0]?.toUpperCase()}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-foreground truncate">{student.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {student.stateAssessment} · Grade {student.gradeBand}
                                            </p>
                                          </div>
                                        </motion.div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </PageContainer>
  );
}
