import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Users, GraduationCap, UserPlus, ChevronRight, Loader2,
  UserCheck, Upload, GraduationCap as GradCap, AlertCircle,
  CheckCircle2, Info, Flame
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@/api-generated/custom-fetch";
import { useAuth } from "@/hooks/use-auth";
import { useApi, ApiError } from "@/hooks/use-api";
import { useHasActivePlan } from "@/hooks/use-has-active-plan";
import { PlanGatedAction } from "@/components/plan-gated-action";
import { LoadingScreen } from "@/components/loading-screen";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/input-field";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/page-container";
import { StudentFormDialog } from "@/teacher/components/student-form-dialog";
import { principalApi } from "./api";
import { useSchool } from "@/contexts/school-context";

export default function PrincipalDashboard() {
  const [, setLocation] = useLocation();
  const { teacherId, ready, userType } = useAuth();
  const { hasPlan, isLoading: planLoading } = useHasActivePlan(teacherId);
  const { request } = useApi();
  const { toast } = useToast();

  const { school, schoolId, teachers, students, teacherCount, studentCount, isLoading, invalidate } =
    useSchool();

  const [tab, setTab] = useState<"teachers" | "students">("teachers");

  useEffect(() => {
    if (ready && userType !== "principal") {
      setLocation("/");
    }
  }, [ready, userType, setLocation]);

  // ── Seat allocation ──────────────────────────────────────────────────────
  const seatQuery = useQuery({
    queryKey: ["school-seat-allocation", schoolId],
    queryFn: () => customFetch<typeof principalApi extends { fetchSeatAllocation: infer F } ? F extends (id: string, req: unknown) => Promise<infer R> ? R : never : never>(
      `/api/schools/${schoolId}/seat-allocation`,
    ),
    enabled: !!schoolId,
    staleTime: 60_000,
  });
  const seats = seatQuery.data as {
    seatsAllocated: number;
    seatsUsed: number;
    seatsRemaining: number | null;
    hasAllocation: boolean;
  } | undefined;
  const seatsExhausted = seats?.hasAllocation && (seats.seatsRemaining ?? 1) <= 0;

  // ── Invite teacher dialog ────────────────────────────────────────────────
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  // ── Add student dialog ───────────────────────────────────────────────────
  const [addStudentOpen, setAddStudentOpen] = useState(false);

  // ── Assign teacher dialog ────────────────────────────────────────────────
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignStudent, setAssignStudent] = useState<(typeof students)[0] | null>(null);
  const [assignTeacherId, setAssignTeacherId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  if (!ready || isLoading) return <LoadingScreen />;

  function openInviteDialog() {
    setInviteFirstName("");
    setInviteLastName("");
    setInviteEmail("");
    setInviteDialogOpen(true);
  }

  async function handleInviteTeacher(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteFirstName.trim() || !inviteLastName.trim() || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      await principalApi.inviteTeacher(
        { firstName: inviteFirstName.trim(), lastName: inviteLastName.trim(), email: inviteEmail.trim() },
        request,
      );
      toast({
        title: "Invitation sent!",
        description: `An email was sent to ${inviteEmail.trim()} with a link to set up their account.`,
      });
      setInviteDialogOpen(false);
      void invalidate();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast({ title: "An active invitation already exists for this email.", variant: "destructive" });
      } else {
        toast({ title: "Could not send invitation", variant: "destructive" });
      }
    } finally {
      setInviting(false);
    }
  }

  function openAssignDialog(student: (typeof students)[0]) {
    setAssignStudent(student);
    setAssignTeacherId(student.guardianId ?? "");
    setAssignDialogOpen(true);
  }

  async function handleAssignTeacher(e: React.FormEvent) {
    e.preventDefault();
    if (!assignStudent || !assignTeacherId) return;
    setAssigning(true);
    try {
      await principalApi.assignStudentTeacher(
        assignStudent.id,
        assignTeacherId || null,
        request,
      );
      toast({ title: "Student reassigned successfully" });
      setAssignDialogOpen(false);
      void invalidate();
    } catch {
      toast({ title: "Could not reassign student", variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  }

  const teacherName = (id: string) =>
    teachers.find((t) => t.id === id)?.name ?? "Unassigned";

  return (
    <PageContainer maxWidth="max-w-5xl" className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              {school?.name ?? "My School"}
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              {school?.districtName ?? "School dashboard"}
            </p>
          </div>
          <PlanGatedAction hasPlan={hasPlan} isLoading={planLoading} label="Import Students" icon={<Upload className="w-4 h-4" />} variant="outline" className="shadow-sm shrink-0">
            <Button
              onClick={() => {
                if (seatsExhausted) {
                  toast({
                    title: "Seat limit reached",
                    description: "All district-allocated seats for your school are in use. Contact your district admin to increase the allocation.",
                    variant: "destructive",
                  });
                  return;
                }
                setLocation("/principal/import");
              }}
              variant="outline"
              className="font-bold border border-border/40 shadow-sm  hover:-translate-y-1 hover:shadow-sm  active:translate-y-0 active:shadow-sm transition-all rounded-xl shrink-0 bg-card hover:bg-card"
            >
              <Upload className="w-4 h-4 mr-2" /> Import Students
            </Button>
          </PlanGatedAction>
        </div>
      </motion.div>

      {/* Stats — 3 columns when allocation exists, 2 otherwise */}
      <div className={`grid gap-4 ${seats ? "grid-cols-3" : "grid-cols-2"}`}>
        <StatCard icon={Users} label="Teachers" value={teacherCount} />
        <StatCard icon={GraduationCap} label="Students" value={studentCount} tone="success" />
        {seats && (
          <div
            className={`bg-card border shadow-sm rounded-2xl px-5 py-5 flex flex-col gap-1 ${
              seatsExhausted
                ? "border-destructive"
                : (seats.seatsRemaining ?? 1) <= 3 && seats.hasAllocation
                  ? "border-[hsl(40_94%_52%)]"
                  : "border-border/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                Seats
              </p>
              {seats.hasAllocation ? (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    seatsExhausted
                      ? "bg-destructive/10 text-destructive"
                      : (seats.seatsRemaining ?? 1) <= 3
                        ? "bg-[hsl(40_94%_52%)]/10 text-[hsl(40_94%_52%)]"
                        : "bg-[hsl(150_62%_41%)]/10 text-[hsl(150_62%_41%)]"
                  }`}
                >
                  {seatsExhausted ? "FULL" : `${seats.seatsRemaining} left`}
                </span>
              ) : (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  No limit
                </span>
              )}
            </div>

            {seats.hasAllocation ? (
              <>
                <p className="text-2xl font-black text-foreground leading-none">
                  {seats.seatsUsed}
                  <span className="text-base font-bold text-muted-foreground ml-1">
                    / {seats.seatsAllocated}
                  </span>
                </p>
                {/* Progress bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, Math.round((seats.seatsUsed / seats.seatsAllocated) * 100))}%`,
                    }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      seatsExhausted
                        ? "bg-destructive"
                        : (seats.seatsRemaining ?? 1) <= 3
                          ? "bg-[hsl(40_94%_52%)]"
                          : "bg-[hsl(150_62%_41%)]"
                    }`}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  district-allocated
                </p>
              </>
            ) : (
              <p className="text-2xl font-black text-foreground leading-none">
                {seats.seatsUsed}
                <span className="text-sm font-medium text-muted-foreground ml-1">enrolled</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Seat-exhausted warning strip */}
      {seatsExhausted && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3"
        >
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm font-bold text-destructive">
            All {seats?.seatsAllocated} district-allocated seats are in use.{" "}
            <span className="font-medium text-destructive/80">
              Contact your district admin to increase the school's seat allocation.
            </span>
          </p>
        </motion.div>
      )}

      {/* Tab bar */}
      <div className="flex gap-3">
        {(["teachers", "students"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all capitalize border border-border/40 ${
              tab === t
                ? "bg-primary text-primary-foreground shadow-sm  -translate-y-1"
                : "bg-card text-muted-foreground hover:text-foreground hover:shadow-sm hover: hover:-translate-y-0.5"
            }`}
          >
            {t}
          </button>
        ))}

        {tab === "teachers" && (
          <Button
            size="sm"
            onClick={openInviteDialog}
            className="ml-auto rounded-xl font-bold border border-border/40 shadow-sm  hover:-translate-y-1 hover:shadow-sm  active:translate-y-0 active:shadow-sm transition-all h-auto px-4"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Teacher
          </Button>
        )}

        {tab === "students" && (
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setAddStudentOpen(true)}
              disabled={seatsExhausted}
              title={seatsExhausted ? "All allocated seats are in use" : "Add a new student"}
              className="rounded-xl font-bold border border-border/40 shadow-sm  hover:-translate-y-1 hover:shadow-sm  active:translate-y-0 active:shadow-sm transition-all h-auto px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GradCap className="w-4 h-4 mr-1.5" />
              Add Student
            </Button>
          </div>
        )}
      </div>

      {/* Add student dialog (reuses teacher's StudentFormDialog) */}
      {teacherId && (
        <StudentFormDialog
          open={addStudentOpen}
          onOpenChange={setAddStudentOpen}
          teacherId={teacherId}
          onSuccess={() => {
            void invalidate();
            void seatQuery.refetch();
          }}
        />
      )}

      {/* Invite teacher dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black">Invite a Teacher</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void handleInviteTeacher(e)} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="First name"
                id="inv-first"
                value={inviteFirstName}
                onChange={(e) => setInviteFirstName(e.target.value)}
                placeholder="Jane"
                autoFocus
              />
              <InputField
                label="Last name"
                id="inv-last"
                value={inviteLastName}
                onChange={(e) => setInviteLastName(e.target.value)}
                placeholder="Smith"
              />
            </div>
            <InputField
              label="Email address"
              id="inv-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teacher@school.edu"
            />
            <p className="text-xs text-muted-foreground">
              They'll receive an email with a link to set up their password and join your school.
              They will <strong>not</strong> be billed — your plan covers their access.
            </p>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={inviting || !inviteFirstName.trim() || !inviteLastName.trim() || !inviteEmail.trim()} className="rounded-xl font-bold">
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign teacher dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-black">Assign Teacher</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void handleAssignTeacher(e)} className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground">
              Assigning a teacher to <strong>{assignStudent?.name}</strong>. Choose who should manage this student's progress.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Teacher
              </label>
              <select
                value={assignTeacherId}
                onChange={(e) => setAssignTeacherId(e.target.value)}
                className="w-full h-12 rounded-xl border border-border/40 bg-card px-4 text-base font-medium text-foreground shadow-sm transition-all duration-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-md"
              >
                <option value="">— Unassigned —</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={assigning} className="rounded-xl font-bold">
                {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* List */}
      <div className="bg-card border border-border/40 shadow-sm rounded-2xl overflow-hidden">
        {tab === "teachers" ? (
          teachers.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2 text-muted-foreground">
              <Users className="w-8 h-8" />
              <p className="font-medium">No teachers yet</p>
              <Button size="sm" onClick={openInviteDialog} className="mt-2 rounded-xl font-bold border border-border/40 shadow-sm">
                Add the first teacher
              </Button>
            </div>
          ) : (
            <ul>
              {teachers.map((t, i) => (
                <li key={t.id}>
                  <button
                    onClick={() => setLocation(`/principal/teacher/${t.id}`)}
                    className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/50 transition-colors group ${
                      i !== 0 ? "border-t border-border/10" : ""
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-black text-primary flex-shrink-0">
                      {t.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{t.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{t.email}</p>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full flex-shrink-0">
                      {t.role}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : students.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-muted-foreground">
            <GraduationCap className="w-8 h-8" />
            <p className="font-medium">No students enrolled yet</p>
            {!seatsExhausted && (
              <Button
                size="sm"
                onClick={() => setAddStudentOpen(true)}
                className="mt-2 rounded-xl font-bold border border-border/40 shadow-sm"
              >
                Add the first student
              </Button>
            )}
          </div>
        ) : (
          <ul>
            {students.map((s, i) => (
              <li key={s.id} className={`flex items-center gap-4 px-5 py-4 ${i !== 0 ? "border-t border-border/10" : ""}`}>
                <button
                  onClick={() => setLocation(`/principal/student/${s.id}`)}
                  className="flex items-center gap-4 flex-1 min-w-0 text-left group"
                >
                  <div className="w-9 h-9 rounded-full bg-[hsl(150_62%_41%)]/10 border border-[hsl(150_62%_41%)]/20 flex items-center justify-center text-sm font-black text-[hsl(150_62%_41%)] flex-shrink-0">
                    {s.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate group-hover:text-primary transition-colors">{s.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.stateAssessment} · Grade {s.gradeBand}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-medium text-muted-foreground hidden sm:block">
                      {s.guardianId ? teacherName(s.guardianId) : <span className="italic">Unassigned</span>}
                    </span>
                    <span className="text-sm font-black text-streak-gold flex items-center gap-1"><Flame className="w-4 h-4 fill-streak-gold" /> {s.currentStreak}</span>
                    <span className="text-sm font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg">{s.totalXp} XP</span>
                  </div>
                </button>
                <button
                  onClick={() => openAssignDialog(s)}
                  title="Assign teacher"
                  className="flex-shrink-0 w-9 h-9 rounded-xl border border-transparent hover:border-border/20 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all hover:shadow-sm"
                >
                  <UserCheck className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}
