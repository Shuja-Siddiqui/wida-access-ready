import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetStudentQueryKey,
  useUpdateStudent,
  UpdateStudentBodyGradeBand,
} from "@/api-generated";
import { useUser } from "@/contexts/user-context";
import { PageContainer } from "@/components/page-container";
import { LoadingScreen } from "@/components/loading-screen";
import { AppInput } from "@/components/app-input";
import { AppSelect } from "@/components/app-select";
import { useToast } from "@/hooks/use-toast";
import { AvatarUpload } from "@/profile/components/avatar-upload";
import { ProfilePreviewRow } from "@/profile/components/profile-preview-row";
import { Mail, Target, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const GRADE_OPTIONS = [
  { value: UpdateStudentBodyGradeBand["K-2"], label: "Grades K-2" },
  { value: UpdateStudentBodyGradeBand["3-5"], label: "Grades 3-5" },
  { value: UpdateStudentBodyGradeBand["6-8"], label: "Grades 6-8" },
  { value: UpdateStudentBodyGradeBand["9-12"], label: "Grades 9-12" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function StudentProfile({ studentId }: { studentId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = getGetStudentQueryKey(studentId);
  const { student, isStudentLoading: isLoading, refetchStudent } = useUser();
  const updateStudent = useUpdateStudent();

  const [name, setName] = useState("");
  const [gradeBand, setGradeBand] = useState<string>("");
  const [homeLanguage, setHomeLanguage] = useState("");

  useEffect(() => {
    if (student) {
      setName(student.name);
      setGradeBand(student.gradeBand);
      setHomeLanguage(student.homeLanguage ?? "");
    }
  }, [student]);

  if (isLoading || !student) {
    return <LoadingScreen />;
  }

  const dirty =
    name.trim() !== student.name ||
    gradeBand !== student.gradeBand ||
    (homeLanguage.trim() || "") !== (student.homeLanguage ?? "");

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Name required", description: "Please enter your name.", variant: "destructive" });
      return;
    }
    try {
      await updateStudent.mutateAsync({
        studentId,
        data: {
          name: name.trim(),
          gradeBand: gradeBand as UpdateStudentBodyGradeBand,
          homeLanguage: homeLanguage.trim() || undefined,
        },
      });
      await queryClient.invalidateQueries({ queryKey });
      refetchStudent();
      toast({ title: "Profile updated", description: "Your details were saved." });
    } catch {
      toast({
        title: "Something went wrong",
        description: "We couldn't save your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUploaded = async (objectPath: string) => {
    try {
      await updateStudent.mutateAsync({ studentId, data: { avatarUrl: objectPath } });
      await queryClient.invalidateQueries({ queryKey });
      refetchStudent();
      toast({ title: "Photo updated", description: "Your profile photo was saved." });
    } catch {
      toast({
        title: "Something went wrong",
        description: "We couldn't save your new photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const gradeLabel = GRADE_OPTIONS.find((opt) => opt.value === gradeBand)?.label ?? gradeBand;

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Your profile</p>
          <h1 className="text-2xl font-black text-foreground leading-tight mt-1">{student.name}</h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
          {/* ── Left column ──────────────────────────────────────── */}
          <div className="space-y-4 min-w-0">
            {/* Editable fields card */}
            <motion.div
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="bg-card border border-border/40 rounded-2xl p-6 space-y-5 shadow-sm"
            >
              <AppInput
                label="Name"
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <AppSelect
                label="Grade band"
                id="profile-grade"
                value={gradeBand}
                onChange={setGradeBand}
                options={GRADE_OPTIONS}
              />

              <AppInput
                label="Home language"
                id="profile-language"
                value={homeLanguage}
                onChange={(e) => setHomeLanguage(e.target.value)}
                placeholder="e.g. Spanish, Arabic..."
              />
            </motion.div>

            {/* Locked details card */}
            <motion.div
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="bg-muted/30 border border-border/40 rounded-2xl p-5 space-y-4"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                Locked details
              </p>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</p>
                  <p className="font-semibold text-foreground truncate text-sm">{student.email || "Not set"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">State assessment</p>
                  <p className="font-semibold text-foreground truncate text-sm">{student.stateAssessment}</p>
                </div>
              </div>
            </motion.div>

            {/* Save button */}
            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="flex justify-end pt-1"
            >
              <button
                onClick={handleSave}
                disabled={!dirty || updateStudent.isPending}
                className={cn(
                  "h-11 px-8 rounded-xl font-bold text-sm transition-all duration-200",
                  "bg-gradient-to-br from-primary to-[#c2185b] text-white",
                  "shadow-[0_4px_14px_0_rgba(219,39,119,0.35)]",
                  "hover:-translate-y-0.5 hover:shadow-[0_6px_20px_0_rgba(219,39,119,0.45)]",
                  "disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none",
                )}
              >
                {updateStudent.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </span>
                ) : "Save changes"}
              </button>
            </motion.div>
          </div>

          {/* ── Right column — avatar / preview card ─────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.42, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="bg-card border border-border/40 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center lg:sticky lg:top-6"
          >
            <AvatarUpload
              name={name || student.name}
              avatarUrl={student.avatarUrl}
              onUploaded={handleAvatarUploaded}
            />
            <h2 className="mt-4 text-lg font-black text-foreground truncate max-w-full">
              {name || student.name}
            </h2>
            <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary">
              Student
            </span>

            <div className="w-full mt-6 pt-5 border-t border-border/40 text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Preview</p>
              <ProfilePreviewRow label="Name" value={name} />
              <ProfilePreviewRow label="Grade band" value={gradeLabel} />
              <ProfilePreviewRow label="Home language" value={homeLanguage} />
            </div>
          </motion.div>
        </div>
      </div>
    </PageContainer>
  );
}
