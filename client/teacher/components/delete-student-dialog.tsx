import { useDeleteStudent } from "@/api-generated";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface DeleteStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: { id: string; name: string } | null;
  onSuccess?: () => void;
}

export function DeleteStudentDialog({
  open,
  onOpenChange,
  student,
  onSuccess,
}: DeleteStudentDialogProps) {
  const { toast } = useToast();
  const deleteStudent = useDeleteStudent();

  const handleDelete = async () => {
    if (!student) return;
    try {
      await deleteStudent.mutateAsync({ studentId: student.id });
      toast({ title: "Student deleted", description: `${student.name} was removed from your roster.` });
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast({
        title: "Couldn't delete student",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-black text-foreground">
            Delete {student?.name}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground font-medium">
            This permanently removes {student?.name} along with all scores, levels, sessions, and
            progress history. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            disabled={deleteStudent.isPending}
            className="font-bold border-border rounded-lg"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={deleteStudent.isPending}
            className="font-bold rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteStudent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
