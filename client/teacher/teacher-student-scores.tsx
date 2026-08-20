import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetStudent, getGetStudentQueryKey, useEnterStudentScores } from "@/api-generated";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/input-field";
import { SelectField } from "@/components/select-field";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { PageContainer } from "@/components/page-container";
import { LoadingScreen } from "@/components/loading-screen";

export default function TeacherStudentScores() {
  const { studentId } = useParams<{ studentId: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useGetStudent(studentId || "", {
    query: { enabled: !!studentId, queryKey: getGetStudentQueryKey(studentId || "") }
  });

  const enterScores = useEnterStudentScores();

  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [listening, setListening] = useState<string>("");
  const [speaking, setSpeaking] = useState<string>("");
  const [reading, setReading] = useState<string>("");
  const [writing, setWriting] = useState<string>("");
  const [composite, setComposite] = useState<string>("");

  if (isLoading || !data) {
    return <LoadingScreen />;
  }

  const { student } = data;
  const assessment = student.stateAssessment;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId) return;

    try {
      const body: any = { assessmentYear: year };
      
      if (assessment === 'TELPAS' || assessment === 'NYSESLAT') {
        if (listening) body.telpasListening = listening;
        if (speaking) body.telpasSpeaking = speaking;
        if (reading) body.telpasReading = reading;
        if (writing) body.telpasWriting = writing;
      } else {
        if (listening) body.listening = parseFloat(listening);
        if (speaking) body.speaking = parseFloat(speaking);
        if (reading) body.reading = parseFloat(reading);
        if (writing) body.writing = parseFloat(writing);
        if (composite) body.composite = parseFloat(composite);
      }

      await enterScores.mutateAsync({
        studentId,
        data: body
      });

      queryClient.invalidateQueries({ queryKey: getGetStudentQueryKey(studentId) });
      
      toast({
        title: "Scores Saved",
        description: "Student progress has been recalculated.",
      });
      
      setLocation(`/teacher/student/${studentId}`);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save scores.",
      });
    }
  };

  const renderInputs = () => {
    const categoricalOptions =
      assessment === 'TELPAS'
        ? ["Beginning", "Intermediate", "Advanced", "Advanced High"]
        : assessment === 'NYSESLAT'
          ? ["Entering", "Emerging", "Transitioning", "Expanding", "Commanding"]
          : null;

    if (categoricalOptions) {
      const options = categoricalOptions.map((o) => ({ value: o, label: o }));
      const triggerClassName = "h-12 rounded-xl text-base";
      const placeholder = "Select level...";
      return (
        <>
          <SelectField label="Listening" value={listening} onChange={setListening} options={options} placeholder={placeholder} triggerClassName={triggerClassName} />
          <SelectField label="Speaking" value={speaking} onChange={setSpeaking} options={options} placeholder={placeholder} triggerClassName={triggerClassName} />
          <SelectField label="Reading" value={reading} onChange={setReading} options={options} placeholder={placeholder} triggerClassName={triggerClassName} />
          <SelectField label="Writing" value={writing} onChange={setWriting} options={options} placeholder={placeholder} triggerClassName={triggerClassName} />
        </>
      );
    }

    // Default numeric inputs (WIDA, ELPAC, ELPA21, OELPA)
    return (
      <>
        <InputField label="Listening (Numeric)" type="number" step="0.1" value={listening} onChange={e => setListening(e.target.value)} />
        <InputField label="Speaking (Numeric)" type="number" step="0.1" value={speaking} onChange={e => setSpeaking(e.target.value)} />
        <InputField label="Reading (Numeric)" type="number" step="0.1" value={reading} onChange={e => setReading(e.target.value)} />
        <InputField label="Writing (Numeric)" type="number" step="0.1" value={writing} onChange={e => setWriting(e.target.value)} />
        {assessment === 'WIDA' && (
          <InputField label="Composite Score" type="number" step="0.1" value={composite} onChange={e => setComposite(e.target.value)} />
        )}
      </>
    );
  };

  return (
    <PageContainer maxWidth="max-w-2xl" className="space-y-6">
        <Button variant="ghost" onClick={() => setLocation(`/teacher/student/${studentId}`)} className="mb-2 text-muted-foreground hover:text-foreground -ml-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Student
        </Button>

        <div className="space-y-1">
          <h1 className="text-4xl font-black text-foreground tracking-tight">Enter Scores</h1>
          <p className="text-muted-foreground text-lg font-medium">For <span className="font-bold text-foreground">{student.name}</span> ({student.stateAssessment})</p>
        </div>

        <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border shadow-sm p-8 space-y-8">
          <InputField label="Assessment Year" type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} required className="sm:w-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderInputs()}
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full h-14 font-bold text-lg rounded-xl shadow-sm" disabled={enterScores.isPending}>
              <Save className="w-5 h-5 mr-2" /> {enterScores.isPending ? "Saving..." : "Save Scores"}
            </Button>
          </div>
        </motion.form>
    </PageContainer>
  );
}
