import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetTeacherQueryKey, useUpdateTeacher } from "@/api-generated";
import { useUser } from "@/contexts/user-context";
import { PageContainer } from "@/components/page-container";
import { LoadingScreen } from "@/components/loading-screen";
import { AppInput } from "@/components/app-input";
import { useToast } from "@/hooks/use-toast";
import { AvatarUpload } from "@/profile/components/avatar-upload";
import { ProfilePageShell } from "@/profile/components/profile-page-shell";
import { Mail, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function EducatorProfile({ teacherId }: { teacherId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = getGetTeacherQueryKey(teacherId);
  const { teacher, isTeacherLoading: isLoading, refetchTeacher } = useUser();
  const updateTeacher = useUpdateTeacher();

  const [name, setName] = useState("");
  const [school, setSchool] = useState("");

  useEffect(() => {
    if (teacher) {
      setName(teacher.name);
      setSchool(teacher.school ?? "");
    }
  }, [teacher]);

  if (isLoading || !teacher) {
    return <LoadingScreen />;
  }

  const dirty =
    name.trim() !== teacher.name || (school.trim() || "") !== (teacher.school ?? "");

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Name required", description: "Please enter your name.", variant: "destructive" });
      return;
    }
    try {
      await updateTeacher.mutateAsync({
        teacherId,
        data: {
          name: name.trim(),
          school: school.trim() || null,
        },
      });
      await queryClient.invalidateQueries({ queryKey });
      refetchTeacher();
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
      await updateTeacher.mutateAsync({ teacherId, data: { avatarUrl: objectPath } });
      await queryClient.invalidateQueries({ queryKey });
      refetchTeacher();
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
        displayName={name || teacher.name}
        roleLabel="Educator"
        roleTone="educator"
        avatar={
          <AvatarUpload
            name={name || teacher.name}
            avatarUrl={teacher.avatarUrl}
            onUploaded={handleAvatarUploaded}
          />
        }
        lockedDetails={[
          { icon: Mail, label: "Email", value: teacher.email },
          { icon: User, label: "Account type", value: "Parent / Teacher" },
        ]}
        footer={
          <button
            onClick={handleSave}
            disabled={!dirty || updateTeacher.isPending}
            className={cn("btn-brand h-11 w-full sm:w-auto px-8 rounded-xl text-sm")}
          >
            {updateTeacher.isPending ? (
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

        <AppInput
          label="School / Organization"
          id="profile-school"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          placeholder="e.g. Lincoln Middle School"
        />
      </ProfilePageShell>
    </PageContainer>
  );
}
