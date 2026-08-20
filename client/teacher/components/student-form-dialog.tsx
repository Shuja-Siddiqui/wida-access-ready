import { useEffect, useState } from "react";
import {
  useCreateStudent,
  useUpdateStudent,
  CreateStudentBodyGradeBand,
  CreateStudentBodyStateAssessment,
  type Student,
} from "@/api-generated";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/input-field";
import { SelectField } from "@/components/select-field";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const CATEGORICAL_OPTIONS: Record<string, string[]> = {
  TELPAS: ["Beginning", "Intermediate", "Advanced", "Advanced High"],
  NYSESLAT: ["Entering", "Emerging", "Transitioning", "Expanding", "Commanding"],
};

const GRADE_BAND_OPTIONS = Object.values(CreateStudentBodyGradeBand).map((g) => ({
  value: g,
  label: `Grade ${g}`,
}));
const ASSESSMENT_OPTIONS = Object.values(CreateStudentBodyStateAssessment).map((a) => ({
  value: a,
  label: a,
}));

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
  student?: Pick<Student, "id" | "name" | "gradeBand" | "stateAssessment" | "homeLanguage"> | null;
  onSuccess?: () => void;
}

export function StudentFormDialog({
  open,
  onOpenChange,
  teacherId,
  student,
  onSuccess,
}: StudentFormDialogProps) {
  const { toast } = useToast();
  const isEdit = !!student;

  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const isPending = createStudent.isPending || updateStudent.isPending;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gradeBand, setGradeBand] = useState<string>(CreateStudentBodyGradeBand["6-8"]);
  const [stateAssessment, setStateAssessment] = useState<string>(
    CreateStudentBodyStateAssessment.WIDA,
  );
  const [homeLanguage, setHomeLanguage] = useState("");

  const [listening, setListening] = useState("");
  const [speaking, setSpeaking] = useState("");
  const [reading, setReading] = useState("");
  const [writing, setWriting] = useState("");
  const [composite, setComposite] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(student?.name ?? "");
    setEmail("");
    setGradeBand(student?.gradeBand ?? CreateStudentBodyGradeBand["6-8"]);
    setStateAssessment(student?.stateAssessment ?? CreateStudentBodyStateAssessment.WIDA);
    setHomeLanguage(student?.homeLanguage ?? "");
    setListening("");
    setSpeaking("");
    setReading("");
    setWriting("");
    setComposite("");
  }, [open, student]);

  const categoricalOptions = CATEGORICAL_OPTIONS[stateAssessment] ?? null;

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({ title: "Name required", description: "Please enter the student's name.", variant: "destructive" });
      return;
    }

    try {
      if (isEdit && student) {
        await updateStudent.mutateAsync({
          studentId: student.id,
          data: {
            name: trimmedName,
            gradeBand: gradeBand as CreateStudentBodyGradeBand,
            homeLanguage: homeLanguage.trim() || undefined,
          },
        });
        toast({ title: "Student updated", description: `${trimmedName}'s details were saved.` });
      } else {
        const trimmedEmail = email.trim() || undefined;

        let initialScores: Record<string, unknown> | undefined;
        if (categoricalOptions) {
          const scores: Record<string, string> = {};
          if (listening) scores.telpasListening = listening;
          if (speaking) scores.telpasSpeaking = speaking;
          if (reading) scores.telpasReading = reading;
          if (writing) scores.telpasWriting = writing;
          if (Object.keys(scores).length > 0) initialScores = scores;
        } else {
          const scores: Record<string, number> = {};
          if (listening) scores.listening = parseFloat(listening);
          if (speaking) scores.speaking = parseFloat(speaking);
          if (reading) scores.reading = parseFloat(reading);
          if (writing) scores.writing = parseFloat(writing);
          if (composite) scores.composite = parseFloat(composite);
          if (Object.keys(scores).length > 0) initialScores = scores;
        }

        await createStudent.mutateAsync({
          data: {
            teacherId,
            name: trimmedName,
            email: trimmedEmail,
            gradeBand: gradeBand as CreateStudentBodyGradeBand,
            stateAssessment: stateAssessment as CreateStudentBodyStateAssessment,
            homeLanguage: homeLanguage.trim() || undefined,
            initialScores,
          },
        });
        const added = trimmedEmail
          ? `${trimmedName} is on your roster. An invite was sent to ${trimmedEmail}.`
          : `${trimmedName} is now on your roster.`;
        toast({ title: "Student added", description: added });
      }
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast({
        title: "Something went wrong",
        description: "We couldn't save this student. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-border sm:max-w-md max-h-[90vh] grid-rows-[auto_1fr_auto] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-foreground">
            {isEdit ? "Edit Student" : "Add Student"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            {isEdit
              ? "Update this student's details."
              : "Add a new student to your roster."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto pr-1">
          <InputField
            label="Name"
            id="student-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
          />

          {!isEdit && (
            <InputField
              label={<>Email <span className="font-medium text-muted-foreground">(optional — sends invite)</span></>}
              id="student-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@school.edu"
            />
          )}

          <SelectField
            label="Grade band"
            value={gradeBand}
            onChange={setGradeBand}
            options={GRADE_BAND_OPTIONS}
          />

          {isEdit ? (
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-foreground">State assessment</p>
              <p className="text-sm font-bold text-muted-foreground bg-muted px-3 py-2 rounded-lg">
                {stateAssessment}
                <span className="block text-xs font-medium text-muted-foreground/80">
                  Assessment can't be changed after a student is created.
                </span>
              </p>
            </div>
          ) : (
            <SelectField
              label="State assessment"
              value={stateAssessment}
              onChange={setStateAssessment}
              options={ASSESSMENT_OPTIONS}
            />
          )}

          <InputField
            label={<>Home language <span className="font-medium text-muted-foreground">(optional)</span></>}
            id="student-home-language"
            value={homeLanguage}
            onChange={(e) => setHomeLanguage(e.target.value)}
            placeholder="e.g. Spanish"
          />

          {!isEdit && (
            <div className="space-y-3 pt-2 border-t border-border">
              <p className="text-sm font-bold text-foreground pt-3">
                Initial scores <span className="font-medium text-muted-foreground">(optional)</span>
              </p>
              <p className="text-xs text-muted-foreground -mt-2">
                Enter this student's most recent official score per domain to set their starting level. Leave blank to start at the assessment minimum.
              </p>
              {categoricalOptions ? (
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="Listening"
                    value={listening}
                    onChange={setListening}
                    options={categoricalOptions.map((o) => ({ value: o, label: o }))}
                    placeholder="Select..."
                  />
                  <SelectField
                    label="Speaking"
                    value={speaking}
                    onChange={setSpeaking}
                    options={categoricalOptions.map((o) => ({ value: o, label: o }))}
                    placeholder="Select..."
                  />
                  <SelectField
                    label="Reading"
                    value={reading}
                    onChange={setReading}
                    options={categoricalOptions.map((o) => ({ value: o, label: o }))}
                    placeholder="Select..."
                  />
                  <SelectField
                    label="Writing"
                    value={writing}
                    onChange={setWriting}
                    options={categoricalOptions.map((o) => ({ value: o, label: o }))}
                    placeholder="Select..."
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Listening" type="number" step="0.1" value={listening} onChange={(e) => setListening(e.target.value)} />
                  <InputField label="Speaking" type="number" step="0.1" value={speaking} onChange={(e) => setSpeaking(e.target.value)} />
                  <InputField label="Reading" type="number" step="0.1" value={reading} onChange={(e) => setReading(e.target.value)} />
                  <InputField label="Writing" type="number" step="0.1" value={writing} onChange={(e) => setWriting(e.target.value)} />
                  {stateAssessment === CreateStudentBodyStateAssessment.WIDA && (
                    <InputField label="Composite" type="number" step="0.1" value={composite} onChange={(e) => setComposite(e.target.value)} />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="font-bold border-border rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-gradient-to-br from-primary to-[#e91e8c] text-white shadow-[0_4px_14px_rgba(255,77,141,0.4)] hover:shadow-[0_6px_20px_rgba(255,77,141,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-300 border-none font-bold rounded-lg"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? "Save changes" : "Add student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
