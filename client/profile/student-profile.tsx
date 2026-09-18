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
import { ProfilePageShell } from "@/profile/components/profile-page-shell";
import { Mail, Target, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const GRADE_OPTIONS = [
  { value: UpdateStudentBodyGradeBand["K-2"], label: "Grades K-2" },
  { value: UpdateStudentBodyGradeBand["3-5"], label: "Grades 3-5" },
  { value: UpdateStudentBodyGradeBand["6-8"], label: "Grades 6-8" },
  { value: UpdateStudentBodyGradeBand["9-12"], label: "Grades 9-12" },
];

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

  return (
    <PageContainer maxWidth="max-w-5xl">
      <ProfilePageShell
        displayName={name || student.name}
        roleLabel="Student"
        roleTone="student"
        avatar={
          <AvatarUpload
            name={name || student.name}
            avatarUrl={student.avatarUrl}
            onUploaded={handleAvatarUploaded}
          />
        }
        lockedDetails={[
          { icon: Mail, label: "Email", value: student.email || "Not set" },
          { icon: Target, label: "State assessment", value: student.stateAssessment },
        ]}
        footer={
          <button
            onClick={handleSave}
            disabled={!dirty || updateStudent.isPending}
            className={cn("btn-brand h-11 w-full sm:w-auto px-8 rounded-xl text-sm")}
          >
            {updateStudent.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </span>
            ) : (
              "Save changes"
            )}
          </button>
        }
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
      </ProfilePageShell>
    </PageContainer>
  );
}
