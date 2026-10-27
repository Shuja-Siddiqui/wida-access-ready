import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Users,
  GraduationCap,
  Upload,
  ChevronDown,
  Plus,
  Shield,
  UserCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { LoadingScreen, PageLoader } from "@/components/loading-screen";
import { StatCard } from "@/components/stat-card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@/api-generated/custom-fetch";
import { useDistrict } from "@/contexts/district-context";
import type { SchoolTeacher, SchoolStudent } from "./api";
import { districtApi } from "./api";
import { DistrictPlanCard } from "./district-plan-card";
import { MemberActiveToggle } from "./member-active-toggle";
import { cn } from "@/lib/utils";
import { DASHBOARD_OUTLINE_BTN, DASHBOARD_PANEL, DASHBOARD_PANEL_OVERFLOW } from "@/components/dashboard-ui-styles";
import { PageHeader } from "@/components/page-header";

const STALE_PANEL = 3 * 60 * 1000;

interface SchoolPanel {
  principals: SchoolTeacher[];
  teachers: SchoolTeacher[];
  students: (SchoolStudent & { guardianId?: string | null })[];
  loading: boolean;
}

function splitSchoolStaff(staff: SchoolTeacher[]) {
  return {
    principals: staff.filter((s) => s.role === "principal"),
    teachers: staff.filter((s) => s.role === "teacher"),
  };
}

function unassignedStudents(
  students: (SchoolStudent & { guardianId?: string | null })[],
  teachers: SchoolTeacher[],
) {
  const teacherIds = new Set(teachers.map((t) => t.id));
  return students.filter((s) => !s.guardianId || !teacherIds.has(s.guardianId));
}

function DistrictStudentCard({
  student,
  onSelect,
  onActiveChange,
}: {
  student: SchoolStudent & { guardianId?: string | null };
  onSelect: () => void;
  onActiveChange?: (isActive: boolean) => void;
}) {
  const isActive = student.isActive ?? true;
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 shadow-sm bg-gradient-to-br from-card via-card to-primary/[0.06]",
        isActive ? "hover:shadow-md hover:-translate-y-0.5 transition-all" : "opacity-70",
      )}
    >
      <button type="button" onClick={onSelect} className="flex items-center gap-3 min-w-0 flex-1 text-left">
        <div className="w-10 h-10 rounded-xl bg-[hsl(286_70%_58%)]/10 border border-[hsl(286_70%_58%)]/20 flex items-center justify-center text-sm font-black text-[hsl(286_70%_58%)] flex-shrink-0">
          {student.name[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{student.name}</p>
          <p className="text-xs text-muted-foreground">
            {student.stateAssessment} · Grade {student.gradeBand}
          </p>
        </div>
      </button>
      <MemberActiveToggle
        kind="student"
        studentId={student.id}
        isActive={isActive}
        onUpdated={onActiveChange}
        className="shrink-0"
      />
    </div>
  );
}

export default function DistrictDashboard() {
  const [, setLocation] = useLocation();
  const { ready, userType } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { district, schools, totalSchools, totalTeachers, totalStudents, isLoading, invalidate } =
    useDistrict();

  const planQuery = useQuery({
    queryKey: ["district-plan"],
    queryFn: () => districtApi.fetchPlan(customFetch),
    enabled: userType === "district_admin" && ready,
    staleTime: STALE_PANEL,
  });

  const allocationsQuery = useQuery({
    queryKey: ["district-allocations"],
    queryFn: () => districtApi.fetchAllocations(customFetch),
    enabled: userType === "district_admin" && ready,
    staleTime: STALE_PANEL,
  });

  async function refreshPlanData() {
    await Promise.all([
      planQuery.refetch(),
      allocationsQuery.refetch(),
      invalidate(),
    ]);
  }

  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);

  useEffect(() => {
    if (ready && userType !== "district_admin") {
      setLocation("/");
    }
  }, [ready, userType, setLocation]);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [panels, setPanels] = useState<Record<string, SchoolPanel>>({});

  async function selectSchool(schoolId: string) {
    setSelectedSchool(schoolId);
    setSelectedTeacher(null);

    setPanels((prev) => ({
      ...prev,
      [schoolId]: {
        ...(prev[schoolId] ?? { principals: [], teachers: [], students: [] }),
        loading: true,
      },
    }));

    try {
      await queryClient.invalidateQueries({ queryKey: ["school-panel-teachers", schoolId] });
      await queryClient.invalidateQueries({ queryKey: ["school-panel-students", schoolId] });

      const [staff, students] = await Promise.all([
        queryClient.fetchQuery<SchoolTeacher[]>({
          queryKey: ["school-panel-teachers", schoolId],
          queryFn: () =>
            customFetch<SchoolTeacher[]>(`/api/schools/${schoolId}/teachers`),
          staleTime: 0,
        }),
        queryClient.fetchQuery<SchoolStudent[]>({
          queryKey: ["school-panel-students", schoolId],
          queryFn: () =>
            customFetch<SchoolStudent[]>(`/api/schools/${schoolId}/students`),
          staleTime: 0,
        }),
      ]);
      const { principals, teachers } = splitSchoolStaff(staff);
      setPanels((prev) => ({
        ...prev,
        [schoolId]: { principals, teachers, students, loading: false },
      }));
    } catch {
      toast({ title: "Failed to load school data", variant: "destructive" });
      setPanels((prev) => ({
        ...prev,
        [schoolId]: { principals: [], teachers: [], students: [], loading: false },
      }));
    }
  }

  useEffect(() => {
    if (!ready || isLoading || schools.length === 0) return;
    const stillValid = selectedSchool && schools.some((s) => s.id === selectedSchool);
    if (!stillValid) {
      void selectSchool(schools[0].id);
    }
  }, [ready, isLoading, schools, selectedSchool]);

  useEffect(() => {
    if (ready && userType === "district_admin") {
      void invalidate();
    }
  }, [ready, userType, invalidate]);

  if (!ready || isLoading) return <LoadingScreen />;

  const activePanel = selectedSchool ? panels[selectedSchool] : null;

  function patchStudentActive(studentId: string, isActive: boolean) {
    if (!selectedSchool) return;
    setPanels((prev) => {
      const panel = prev[selectedSchool];
      if (!panel) return prev;
      return {
        ...prev,
        [selectedSchool]: {
          ...panel,
          students: panel.students.map((s) => (s.id === studentId ? { ...s, isActive } : s)),
        },
      };
    });
  }

  function patchStaffActive(profileId: string, isActive: boolean) {
    if (!selectedSchool) return;
    setPanels((prev) => {
      const panel = prev[selectedSchool];
      if (!panel) return prev;
      const mapStaff = (list: SchoolTeacher[]) =>
        list.map((t) => (t.id === profileId ? { ...t, isActive } : t));
      return {
        ...prev,
        [selectedSchool]: {
          ...panel,
          principals: mapStaff(panel.principals),
          teachers: mapStaff(panel.teachers),
        },
      };
    });
  }
  return (
    <PageContainer className="space-y-8" themeWash>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader
          eyebrow="District"
          title={district?.name ?? "My District"}
          description={
            district?.state
              ? `${district.state} · Schools, staff, billing, and roster across your district.`
              : "Schools, staff, billing, and roster across your district."
          }
          actions={
            <>
              <Button
                onClick={() => setLocation("/district/schools")}
                className="btn-brand font-bold rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" /> Add School
              </Button>
              <Button
                onClick={() => setLocation("/district/import")}
                variant="outline"
                className={cn(DASHBOARD_OUTLINE_BTN, "shrink-0")}
              >
                <Upload className="w-4 h-4 mr-2" /> Import Students
              </Button>
            </>
          }
        />
      </motion.div>

      {planQuery.data && (
        <DistrictPlanCard
          plan={planQuery.data}
          allocations={allocationsQuery.data ?? []}
          schools={schools}
          onRefresh={() => void refreshPlanData()}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Building2} label="Schools" value={totalSchools} />
        <StatCard icon={Users} label="Teachers" value={totalTeachers} tone="warning" />
        <StatCard icon={GraduationCap} label="Students" value={totalStudents} tone="success" />
      </div>

      {schools.length === 0 ? (
        <div className={cn(DASHBOARD_PANEL, "py-16 flex flex-col items-center gap-2 text-muted-foreground")}>
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
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-black border border-transparent ${
                      active ? "bg-white/20 border-white/30" : "bg-muted border-border/10"
                    }`}
                    title={`${school.studentCount} students · ${school.teacherCount} staff`}
                  >
                    {school.studentCount}
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
                    <PageLoader />
                  </div>
                ) : activePanel ? (
                  (() => {
                    const rosterUnassigned = unassignedStudents(
                      activePanel.students,
                      activePanel.teachers,
                    );
                    const isEmpty =
                      activePanel.principals.length === 0 &&
                      activePanel.teachers.length === 0 &&
                      activePanel.students.length === 0;

                    if (isEmpty) {
                      return (
                        <div className={cn(DASHBOARD_PANEL, "py-12 flex flex-col items-center gap-2 text-muted-foreground")}>
                          <Users className="w-8 h-8 mb-2" />
                          <p className="font-bold text-sm">No staff or students in this school yet</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-8">
                        {activePanel.principals.length > 0 && (
                          <div className="space-y-2">
                            <h2 className="text-xs font-black uppercase tracking-wide text-muted-foreground px-1 flex items-center gap-2">
                              <Shield className="w-3.5 h-3.5" />
                              Principal
                            </h2>
                            {activePanel.principals.map((principal) => (
                              <div
                                key={principal.id}
                                className={cn(DASHBOARD_PANEL, "px-5 py-4 flex items-center gap-4")}
                              >
                                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-sm font-black text-amber-700 dark:text-amber-400 flex-shrink-0">
                                  {principal.name[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-foreground truncate">{principal.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{principal.email}</p>
                                  {principal.invitePending && (
                                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                                      Invite sent — awaiting password setup
                                    </p>
                                  )}
                                </div>
                                <MemberActiveToggle
                                  kind="staff"
                                  schoolId={selectedSchool!}
                                  profileId={principal.id}
                                  isActive={principal.isActive ?? true}
                                  onUpdated={(isActive) => patchStaffActive(principal.id, isActive)}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {activePanel.teachers.length > 0 && (
                          <div className="space-y-2">
                            <h2 className="text-xs font-black uppercase tracking-wide text-muted-foreground px-1 flex items-center gap-2">
                              <UserCircle className="w-3.5 h-3.5" />
                              Teachers &amp; students
                            </h2>
                            {activePanel.teachers.map((teacher, i) => {
                              const teacherStudents = activePanel.students.filter(
                                (s) => s.guardianId === teacher.id,
                              );
                              const isOpen = selectedTeacher === teacher.id;

                              return (
                                <motion.div
                                  key={teacher.id}
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.04 }}
                                  className={DASHBOARD_PANEL_OVERFLOW}
                                >
                                  <button
                                    type="button"
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
                                      <MemberActiveToggle
                                        kind="staff"
                                        schoolId={selectedSchool!}
                                        profileId={teacher.id}
                                        isActive={teacher.isActive ?? true}
                                        onUpdated={(isActive) => patchStaffActive(teacher.id, isActive)}
                                      />
                                      <span className="text-xs font-black bg-[hsl(150_62%_41%)]/10 border border-[hsl(150_62%_41%)]/20 text-[hsl(150_62%_41%)] px-3 py-1 rounded-full">
                                        {teacherStudents.length} student
                                        {teacherStudents.length !== 1 ? "s" : ""}
                                      </span>
                                      <motion.div
                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                      </motion.div>
                                    </div>
                                  </button>

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
                                              {teacherStudents.map((student) => (
                                                <DistrictStudentCard
                                                  key={student.id}
                                                  student={student}
                                                  onSelect={() =>
                                                    setLocation(`/district/student/${student.id}`)
                                                  }
                                                  onActiveChange={(isActive) =>
                                                    patchStudentActive(student.id, isActive)
                                                  }
                                                />
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

                        {rosterUnassigned.length > 0 && (
                          <div className="space-y-3">
                            <h2 className="text-xs font-black uppercase tracking-wide text-muted-foreground px-1 flex items-center gap-2">
                              <GraduationCap className="w-3.5 h-3.5" />
                              Not assigned to a teacher ({rosterUnassigned.length})
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {rosterUnassigned.map((student) => (
                                <DistrictStudentCard
                                  key={student.id}
                                  student={student}
                                  onSelect={() => setLocation(`/district/student/${student.id}`)}
                                  onActiveChange={(isActive) => patchStudentActive(student.id, isActive)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </PageContainer>
  );
}
