import { useEffect, useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Users, GraduationCap, ChevronRight, Mail,
  UserPlus, Search, CheckSquare, Square, Loader2, X,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/page-container";
import { LoadingScreen } from "@/components/loading-screen";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { principalApi, type PrincipalProfile, type TeacherStudent, type SchoolStudent } from "./api";

const DOMAIN_COLORS: Record<string, string> = {
  listening: "text-primary bg-primary/10",
  speaking: "text-[hsl(150_62%_41%)] bg-[hsl(150_62%_41%)]/10",
  reading: "text-[hsl(14_86%_57%)] bg-[hsl(14_86%_57%)]/10",
  writing: "text-[hsl(286_70%_58%)] bg-[hsl(286_70%_58%)]/10",
};

export default function PrincipalTeacherDetail() {
  const { teacherId } = useParams<{ teacherId: string }>();
  const [, setLocation] = useLocation();
  const { request } = useApi();
  const { toast } = useToast();

  const [teacher, setTeacher] = useState<PrincipalProfile | null>(null);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Assign Students modal ──────────────────────────────────────────────────
  const [assignOpen, setAssignOpen] = useState(false);
  const [allSchoolStudents, setAllSchoolStudents] = useState<SchoolStudent[]>([]);
  const [loadingSchoolStudents, setLoadingSchoolStudents] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!teacherId) return;
    void loadData(teacherId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  async function loadData(id: string) {
    setLoading(true);
    try {
      const [profile, studentList] = await Promise.all([
        principalApi.fetchTeacherProfile(id, request),
        principalApi.fetchTeacherStudents(id, request),
      ]);
      setTeacher(profile);
      setStudents(studentList);
    } catch {
      toast({ title: "Failed to load teacher profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // Soft-reload: only refreshes the student list, no loading screen flash
  async function reloadStudents(id: string) {
    try {
      const studentList = await principalApi.fetchTeacherStudents(id, request);
      setStudents(studentList);
    } catch {
      // already shown in save handler; keep stale list visible
    }
  }

  async function openAssignModal() {
    if (!teacher?.schoolId || !teacherId) return;
    setAssignOpen(true);
    setSearch("");
    setLoadingSchoolStudents(true);
    try {
      const all = await principalApi.fetchSchoolStudents(teacher.schoolId, request);
      setAllSchoolStudents(all);
      // pre-select students already assigned to this teacher
      const alreadyAssigned = new Set(
        all.filter((s) => s.guardianId === teacherId).map((s) => s.id),
      );
      setSelected(alreadyAssigned);
    } catch {
      toast({ title: "Failed to load school students", variant: "destructive" });
      setAssignOpen(false);
    } finally {
      setLoadingSchoolStudents(false);
    }
  }

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allSchoolStudents;
    return allSchoolStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.stateAssessment.toLowerCase().includes(q) ||
        s.gradeBand.toLowerCase().includes(q),
    );
  }, [allSchoolStudents, search]);

  const allFilteredSelected =
    filteredStudents.length > 0 && filteredStudents.every((s) => selected.has(s.id));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredStudents.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredStudents.forEach((s) => next.add(s.id));
        return next;
      });
    }
  }

  function toggleStudent(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function saveAssignments() {
    if (!teacherId) return;
    setSaving(true);
    try {
      const result = await principalApi.bulkAssignStudents(teacherId, [...selected], request);
      toast({
        title: `${result.assigned} student${result.assigned !== 1 ? "s" : ""} assigned`,
        description: `Students assigned to ${teacher?.name ?? "teacher"}.`,
      });
      setAssignOpen(false);
      // Refresh only the student list — avoids blanking the page
      void reloadStudents(teacherId);
    } catch {
      toast({ title: "Failed to save assignments", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingScreen />;
  if (!teacher) return <LoadingScreen />;

  return (
    <PageContainer maxWidth="max-w-5xl" className="space-y-6">
      {/* Back */}
      <button
        onClick={() => setLocation("/principal")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to school
      </button>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6 flex items-start gap-5"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-black text-primary flex-shrink-0">
          {teacher.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black tracking-tight">{teacher.name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Mail className="w-3.5 h-3.5" />
              {teacher.email}
            </span>
            <span className="text-xs font-bold uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {teacher.role}
            </span>
          </div>
          {teacher.school?.name && (
            <p className="text-sm text-muted-foreground mt-1">{teacher.school.name}</p>
          )}
        </div>

        {/* Assign Students button */}
        <Button
          onClick={() => void openAssignModal()}
          className="shrink-0 gap-2"
          size="sm"
        >
          <UserPlus className="w-4 h-4" />
          Assign Students
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={GraduationCap} label="Students" value={students.length} tone="success" />
        <StatCard icon={Users} label="Total XP earned" value={students.reduce((sum, s) => sum + s.totalXp, 0).toLocaleString()} />
      </div>

      {/* Student roster */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black">Students</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void openAssignModal()}
            className="gap-1.5 text-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Assign Students
          </Button>
        </div>

        {students.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl py-14 flex flex-col items-center gap-3 text-muted-foreground">
            <GraduationCap className="w-7 h-7" />
            <p className="font-medium">No students assigned yet</p>
            <Button
              size="sm"
              onClick={() => void openAssignModal()}
              className="gap-2 mt-1"
            >
              <UserPlus className="w-4 h-4" />
              Assign Students
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <ul>
              {students.map((s, i) => (
                <li key={s.id}>
                  <button
                    onClick={() => setLocation(`/principal/student/${s.id}`)}
                    className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/50 transition-colors group ${
                      i !== 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-[hsl(150_62%_41%)]/10 flex items-center justify-center text-sm font-black text-[hsl(150_62%_41%)] flex-shrink-0">
                      {s.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{s.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.stateAssessment} · Grade {s.gradeBand}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm text-muted-foreground"> {s.currentStreak}</span>
                      <span className="text-sm font-bold text-primary">{s.totalXp} XP</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Domain colour key */}
      {students.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(DOMAIN_COLORS).map(([domain, cls]) => (
            <span key={domain} className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${cls}`}>
              {domain}
            </span>
          ))}
        </div>
      )}

      {/* ── Assign Students Modal ── */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <DialogTitle className="text-lg font-black">
              Assign Students to {teacher.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Select students from your school to assign to this teacher.
            </p>
          </DialogHeader>

          {loadingSchoolStudents ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Search + select-all bar */}
              <div className="px-6 py-3 border-b border-border shrink-0 space-y-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search students…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-10 pl-9 pr-9 text-sm font-medium bg-card border border-border/40 rounded-xl shadow-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-md transition-all duration-200"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Select-all row */}
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary transition-colors w-full"
                >
                  {allFilteredSelected ? (
                    <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  {allFilteredSelected ? "Deselect all" : "Select all"}
                  <span className="ml-auto text-xs font-medium text-muted-foreground">
                    {selected.size} selected · {filteredStudents.length} shown
                  </span>
                </button>
              </div>

              {/* Student list */}
              <div className="flex-1 overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                    <GraduationCap className="w-6 h-6" />
                    <p className="text-sm font-medium">
                      {allSchoolStudents.length === 0
                        ? "No students in this school yet"
                        : "No students match your search"}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {filteredStudents.map((s) => {
                      const isSelected = selected.has(s.id);
                      const isAlreadyThisTeacher = s.guardianId === teacherId;
                      return (
                        <li key={s.id}>
                          <button
                            onClick={() => toggleStudent(s.id)}
                            className={`w-full flex items-center gap-3 px-6 py-3.5 text-left transition-colors ${
                              isSelected ? "bg-primary/5" : "hover:bg-muted/50"
                            }`}
                          >
                            {/* Checkbox */}
                            <div className="shrink-0">
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-primary" />
                              ) : (
                                <Square className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>

                            {/* Avatar */}
                            <div className="w-8 h-8 rounded-full bg-[hsl(150_62%_41%)]/10 flex items-center justify-center text-xs font-black text-[hsl(150_62%_41%)] shrink-0">
                              {s.name[0]}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">{s.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {s.stateAssessment} · Grade {s.gradeBand}
                              </p>
                            </div>

                            {/* Badge: already assigned to this teacher */}
                            {isAlreadyThisTeacher && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-[hsl(150_62%_41%)]/10 text-[hsl(150_62%_41%)] shrink-0">
                                Assigned
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Footer */}
              <DialogFooter className="px-6 py-4 border-t border-border shrink-0 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAssignOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void saveAssignments()}
                  disabled={saving || selected.size === 0}
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Assign {selected.size > 0 ? `${selected.size} ` : ""}Student{selected.size !== 1 ? "s" : ""}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
