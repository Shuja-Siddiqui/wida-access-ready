import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetTeacherQueryKey, useUpdateTeacher } from "@/api-generated";
import { useUser } from "@/contexts/user-context";
import { PageContainer } from "@/components/page-container";
import { LoadingScreen } from "@/components/loading-screen";
import { AppInput } from "@/components/app-input";
import { useToast } from "@/hooks/use-toast";
import { AvatarUpload } from "@/profile/components/avatar-upload";
import { ProfilePreviewRow } from "@/profile/components/profile-preview-row";
import { Mail, Loader2, Lock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

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
    <PageContainer>
      <div className="space-y-6">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Your profile</p>
          <h1 className="text-2xl font-black text-foreground leading-tight mt-1">{teacher.name}</h1>
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

              <AppInput
                label="School / Organization"
                id="profile-school"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="e.g. Lincoln Middle School"
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
                  <p className="font-semibold text-foreground truncate text-sm">{teacher.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Account type</p>
                  <p className="font-semibold text-foreground truncate text-sm">Parent / Teacher</p>
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
                disabled={!dirty || updateTeacher.isPending}
                className={cn(
                  "h-11 px-8 rounded-xl font-bold text-sm transition-all duration-200",
                  "bg-gradient-to-br from-primary to-[#c2185b] text-white",
                  "shadow-[0_4px_14px_0_rgba(219,39,119,0.35)]",
                  "hover:-translate-y-0.5 hover:shadow-[0_6px_20px_0_rgba(219,39,119,0.45)]",
                  "disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none",
                )}
              >
                {updateTeacher.isPending ? (
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
              name={name || teacher.name}
              avatarUrl={teacher.avatarUrl}
              onUploaded={handleAvatarUploaded}
            />
            <h2 className="mt-4 text-lg font-black text-foreground truncate max-w-full">
              {name || teacher.name}
            </h2>
            <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-600">
              Educator
            </span>

            <div className="w-full mt-6 pt-5 border-t border-border/40 text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Preview</p>
              <ProfilePreviewRow label="Name" value={name} />
              <ProfilePreviewRow label="School" value={school} />
            </div>
          </motion.div>
        </div>
      </div>
    </PageContainer>
  );
}
