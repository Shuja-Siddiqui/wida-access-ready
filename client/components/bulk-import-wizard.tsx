import { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { useApi, extractErrorMessage } from "@/hooks/use-api";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, Download, Upload, CheckCircle, XCircle,
  FileSpreadsheet, AlertCircle, Mail,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageLoader } from "@/components/loading-screen";
import { useToast } from "@/hooks/use-toast";

const GRADE_BANDS = ["K-2", "3-5", "6-8", "9-12"] as const;
const ASSESSMENTS = ["WIDA", "OELPA", "TELPAS", "ELPAC", "ELPA21", "NYSESLAT"] as const;
const TELPAS_LEVELS = ["Beginning", "Intermediate", "Advanced", "Advanced High"] as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ParsedRow {
  rowNum: number;
  name: string;
  email: string;
  gradeBand: string;
  stateAssessment: string;
  homeLanguage: string;
  guardianId: string;
  schoolId: string;
  listening: string;
  speaking: string;
  reading: string;
  writing: string;
  errors: string[];
}

interface ImportResult {
  row: number;
  name: string;
  status: "created" | "failed";
  inviteSent?: boolean;
  error?: string;
}

function validateRow(raw: Record<string, string>, rowNum: number): ParsedRow {
  const get = (keys: string[]) => {
    for (const k of keys) {
      const v = raw[k]?.toString().trim();
      if (v) return v;
    }
    return "";
  };

  const name = get(["Name", "name", "Student Name", "Full Name"]);
  const email = get(["Email", "email", "Email Address"]);
  const gradeBand = get(["Grade Band", "grade_band", "Grade", "gradeBand"]);
  const stateAssessment = get(["State Assessment", "Assessment", "assessment", "stateAssessment"]);
  const homeLanguage = get(["Home Language", "homeLanguage", "Language"]);
  const guardianId = get(["Teacher ID", "Guardian ID", "teacherId", "guardianId", "Teacher Id"]);
  const schoolId = get(["School ID", "schoolId", "School Id"]);
  const listening = get(["Listening", "listening"]);
  const speaking = get(["Speaking", "speaking"]);
  const reading = get(["Reading", "reading"]);
  const writing = get(["Writing", "writing"]);

  const errors: string[] = [];
  if (!name) errors.push("Name is required");
  if (gradeBand && !(GRADE_BANDS as readonly string[]).includes(gradeBand))
    errors.push(`Grade Band must be one of: ${GRADE_BANDS.join(", ")}`);
  if (!stateAssessment)
    errors.push("State Assessment is required");
  else if (!(ASSESSMENTS as readonly string[]).includes(stateAssessment))
    errors.push(`Assessment must be one of: ${ASSESSMENTS.join(", ")}`);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push("Email format is invalid");
  if (guardianId && !UUID_RE.test(guardianId))
    errors.push("Teacher ID must be a valid UUID");
  if (schoolId && !UUID_RE.test(schoolId))
    errors.push("School ID must be a valid UUID");

  if (stateAssessment === "TELPAS") {
    for (const [domain, val] of [["Listening", listening], ["Speaking", speaking], ["Reading", reading], ["Writing", writing]] as const) {
      if (val && !(TELPAS_LEVELS as readonly string[]).includes(val))
        errors.push(`${domain} must be one of: ${TELPAS_LEVELS.join(", ")} for TELPAS`);
    }
  } else {
    for (const [domain, val] of [["Listening", listening], ["Speaking", speaking], ["Reading", reading], ["Writing", writing]] as const) {
      if (val && isNaN(parseFloat(val)))
        errors.push(`${domain} must be a number`);
    }
  }

  return { rowNum, name, email, gradeBand, stateAssessment, homeLanguage, guardianId, schoolId, listening, speaking, reading, writing, errors };
}

function buildStudentPayload(row: ParsedRow) {
  const isTelpas = row.stateAssessment === "TELPAS";
  return {
    name: row.name,
    email: row.email || undefined,
    gradeBand: row.gradeBand,
    stateAssessment: row.stateAssessment,
    homeLanguage: row.homeLanguage || undefined,
    guardianId: row.guardianId || undefined,
    schoolId: row.schoolId || undefined,
    ...(isTelpas
      ? {
          telpasListening: row.listening || undefined,
          telpasSpeaking: row.speaking || undefined,
          telpasReading: row.reading || undefined,
          telpasWriting: row.writing || undefined,
        }
      : {
          listening: row.listening ? parseFloat(row.listening) : undefined,
          speaking: row.speaking ? parseFloat(row.speaking) : undefined,
          reading: row.reading ? parseFloat(row.reading) : undefined,
          writing: row.writing ? parseFloat(row.writing) : undefined,
        }),
  };
}

export function downloadImportTemplate(showOrgColumns: boolean) {
  const headers = showOrgColumns
    ? ["Name", "Email", "Grade Band", "State Assessment", "Home Language", "Teacher ID", "School ID", "Listening", "Speaking", "Reading", "Writing"]
    : ["Name", "Email", "Grade Band", "State Assessment", "Home Language", "Listening", "Speaking", "Reading", "Writing"];
  const examples = showOrgColumns
    ? [
        ["Maria Garcia", "maria@school.edu", "6-8", "WIDA", "Spanish", "", "", "2.5", "2.0", "3.0", "2.5"],
        ["Ahmed Hassan", "ahmed@school.edu", "9-12", "TELPAS", "Arabic", "00000000-0000-4000-8000-000000000001", "", "Beginning", "Intermediate", "Beginning", "Beginning"],
        ["Linh Nguyen", "linh@school.edu", "3-5", "ELPAC", "Vietnamese", "", "00000000-0000-4000-8000-000000000002", "3", "2", "3", "2"],
        ["Fatou Diallo", "", "K-2", "WIDA", "French", "", "", "", "", "", ""],
      ]
    : [
        ["Maria Garcia", "maria@school.edu", "6-8", "WIDA", "Spanish", "2.5", "2.0", "3.0", "2.5"],
        ["Ahmed Hassan", "ahmed@school.edu", "9-12", "TELPAS", "Arabic", "Beginning", "Intermediate", "Beginning", "Beginning"],
        ["Linh Nguyen", "linh@school.edu", "3-5", "ELPAC", "Vietnamese", "3", "2", "3", "2"],
        ["Fatou Diallo", "", "K-2", "WIDA", "French", "", "", "", ""],
      ];
  const notes = [
    [""],
    ["NOTES:"],
    ["Grade Band options: K-2, 3-5, 6-8, 9-12"],
    ["Assessment options: WIDA, OELPA, TELPAS, ELPAC, ELPA21, NYSESLAT"],
    ...(showOrgColumns
      ? [
          ["Teacher ID and School ID are optional — leave blank to assign later in the app"],
          ["District imports: School ID assigns the student to a school"],
          ["Principal imports: school is set automatically; Teacher ID assigns to a teacher"],
        ]
      : []),
    ["TELPAS domain scores: Beginning, Intermediate, Advanced, Advanced High"],
    ["Other assessments use numeric scores (e.g. 2.5 for WIDA, 3 for ELPAC)"],
    ["Email is optional but required to send the student a password setup invite"],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...examples, ...notes]);
  ws["!cols"] = (showOrgColumns
    ? [22, 28, 14, 18, 16, 38, 38, 12, 12, 12, 12]
    : [22, 28, 14, 18, 16, 12, 12, 12, 12]
  ).map((w) => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  XLSX.writeFile(wb, "goELprep_Student_Import_Template.xlsx");
}

type Step = "upload" | "preview" | "importing" | "results";

interface BulkImportWizardProps {
  /** Solo teachers import to their own roster; org staff stamp school/district from their account. */
  mode: "teacher" | "org";
  onBack: () => void;
}

export function BulkImportWizard({ mode, onBack }: BulkImportWizardProps) {
  const showOrgColumns = mode === "org";
  const { request } = useApi();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [importSummary, setImportSummary] = useState({ created: 0, failed: 0 });

  const parseFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
        if (raw.length === 0) {
          toast({ title: "Empty file", description: "The spreadsheet has no data rows.", variant: "destructive" });
          return;
        }
        const parsed = raw.map((r, i) => validateRow(r, i + 2));
        setRows(parsed);
        setStep("preview");
      } catch {
        toast({ title: "Parse error", description: "Could not read the file. Make sure it is a valid .xlsx or .csv file.", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const validRows = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);

  const handleImport = async () => {
    setStep("importing");
    try {
      const data = await request<{ results: ImportResult[]; created: number; failed: number }>(
        "/api/students/bulk-import",
        {
          method: "POST",
          body: JSON.stringify({ students: validRows.map(buildStudentPayload) }),
        }
      );
      setResults(data.results);
      setImportSummary({ created: data.created, failed: data.failed });
      setStep("results");
    } catch (err) {
      toast({ title: "Import failed", description: extractErrorMessage(err), variant: "destructive" });
      setStep("preview");
    }
  };

  const reset = () => { setStep("upload"); setRows([]); setResults([]); setFileName(""); };

  return (
    <PageContainer maxWidth="max-w-5xl" className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-foreground bg-card border border-border/40 shadow-sm px-3 py-1.5 rounded-lg  hover:-translate-y-1 hover:shadow-xl active:translate-y-0 transition-all font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="space-y-1">
        <h1 className="heading-page text-3xl">Import Students</h1>
        <p className="text-sm text-muted-foreground font-medium">Upload a spreadsheet to add multiple students at once.</p>
      </div>

      <AnimatePresence mode="wait">
        {step === "upload" && (
          <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`relative group cursor-pointer rounded-3xl border-4 transition-all duration-200 shadow-sm bg-card  hover:-translate-y-1 hover:shadow-sm ${
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-border/40"
              }`}
            >
              <div className="flex flex-col items-center gap-6 py-24 px-8">
                {/* Icon */}
                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center transition-colors border border-border/40 shadow-sm ${
                  dragging ? "bg-primary text-primary-foreground" : "bg-muted text-foreground group-hover:bg-primary/20 group-hover:text-primary"
                }`}>
                  <FileSpreadsheet className="w-12 h-12" />
                </div>

                <div className="text-center space-y-1.5">
                  <p className="text-xl font-extrabold text-foreground">
                    {dragging ? "Drop it!" : "Drop your file here"}
                  </p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                </div>

                {/* Format badges */}
                <div className="flex items-center gap-2">
                  {[".xlsx", ".xls", ".csv"].map((ext) => (
                    <span key={ext} className="px-3 py-1 rounded-full bg-muted text-xs font-bold text-muted-foreground border border-border">
                      {ext}
                    </span>
                  ))}
                </div>
              </div>

              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
            </div>

            {/* Template download */}
            <div className="mt-5 flex items-center justify-center gap-1.5">
              <p className="text-sm text-muted-foreground">Need a template?</p>
              <button
                onClick={(e) => { e.stopPropagation(); downloadImportTemplate(showOrgColumns); }}
                className="text-sm font-bold text-primary hover:text-primary/80 underline underline-offset-2 transition-colors flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          </motion.div>
        )}

        {step === "preview" && (
          <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-0.5">
                <p className="font-extrabold text-foreground text-lg">Preview — {fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {validRows.length} valid · {invalidRows.length > 0 ? `${invalidRows.length} with errors (will be skipped)` : "no errors"}
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="font-bold border border-border/40 shadow-sm rounded-xl  hover:-translate-y-1 hover:shadow-sm  active:translate-y-0 active:shadow-sm transition-all">
                  Change file
                </Button>
                <Button
                  onClick={() => void handleImport()}
                  disabled={validRows.length === 0}
                  className="font-bold border border-border/40 shadow-sm rounded-xl btn-brand  hover:-translate-y-1 hover:shadow-sm  active:translate-y-0 active:shadow-sm transition-all disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import {validRows.length} Student{validRows.length !== 1 ? "s" : ""}
                </Button>
              </div>
            </div>

            {invalidRows.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 space-y-2">
                <p className="text-sm font-extrabold text-destructive flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {invalidRows.length} row{invalidRows.length !== 1 ? "s" : ""} with errors — these will be skipped
                </p>
                <ul className="space-y-1">
                  {invalidRows.map((r) => (
                    <li key={r.rowNum} className="text-xs text-destructive font-medium">
                      Row {r.rowNum} ({r.name || "unnamed"}): {r.errors.join(" · ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Card className="border border-border/40 shadow-sm overflow-hidden rounded-2xl bg-card">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50 border-b border-border/40">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="font-extrabold text-foreground h-12">Name</TableHead>
                      <TableHead className="font-extrabold text-foreground h-12">Email</TableHead>
                      <TableHead className="font-extrabold text-foreground h-12">Grade</TableHead>
                      <TableHead className="font-extrabold text-foreground h-12">Assessment</TableHead>
                      {showOrgColumns && (
                        <>
                          <TableHead className="font-extrabold text-foreground h-12">Teacher ID</TableHead>
                          <TableHead className="font-extrabold text-foreground h-12">School ID</TableHead>
                        </>
                      )}
                      <TableHead className="font-extrabold text-foreground h-12">Listening</TableHead>
                      <TableHead className="font-extrabold text-foreground h-12">Speaking</TableHead>
                      <TableHead className="font-extrabold text-foreground h-12">Reading</TableHead>
                      <TableHead className="font-extrabold text-foreground h-12">Writing</TableHead>
                      <TableHead className="font-extrabold text-foreground h-12 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow key={r.rowNum} className={`border-b border-border/10 last:border-none ${r.errors.length > 0 ? "bg-destructive/5 opacity-60" : ""}`}>
                        <TableCell className="font-black text-foreground">{r.name || <span className="text-destructive italic">missing</span>}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {r.email
                            ? <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{r.email}</span>
                            : <span className="text-muted-foreground/50 italic text-xs">no email</span>}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{r.gradeBand}</TableCell>
                        <TableCell>
                          {r.stateAssessment && <Badge variant="outline" className="font-bold text-xs border-border">{r.stateAssessment}</Badge>}
                        </TableCell>
                        {showOrgColumns && (
                          <>
                            <TableCell className="text-xs text-muted-foreground font-mono max-w-[120px] truncate">{r.guardianId || "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono max-w-[120px] truncate">{r.schoolId || "—"}</TableCell>
                          </>
                        )}
                        <TableCell className="text-sm text-muted-foreground">{r.listening || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.speaking || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.reading || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.writing || "—"}</TableCell>
                        <TableCell className="text-right">
                          {r.errors.length === 0
                            ? <CheckCircle className="w-5 h-5 text-growth-green ml-auto" />
                            : <XCircle className="w-5 h-5 text-destructive ml-auto" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </motion.div>
        )}

        {step === "importing" && (
          <motion.div key="importing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-24 gap-6">
            <PageLoader />
            <div className="text-center space-y-1">
              <p className="font-extrabold text-foreground text-xl">Importing students…</p>
              <p className="text-muted-foreground font-medium">Creating accounts and sending invite emails. This may take a moment.</p>
            </div>
          </motion.div>
        )}

        {step === "results" && (
          <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-growth-green/10 border border-border/40 shadow-sm rounded-2xl p-6 flex flex-col items-center gap-2">
                <CheckCircle className="w-12 h-12 text-growth-green" />
                <p className="text-5xl font-black text-growth-green">{importSummary.created}</p>
                <p className="text-sm font-bold text-foreground">Students created</p>
              </div>
              <div className={`rounded-2xl p-6 flex flex-col items-center gap-2 border border-border/40 shadow-sm ${importSummary.failed > 0 ? "bg-destructive/10" : "bg-card"}`}>
                <XCircle className={`w-12 h-12 ${importSummary.failed > 0 ? "text-destructive" : "text-muted-foreground"}`} />
                <p className={`text-5xl font-black ${importSummary.failed > 0 ? "text-destructive" : "text-muted-foreground"}`}>{importSummary.failed}</p>
                <p className="text-sm font-bold text-foreground">Failed</p>
              </div>
            </div>

            <Card className="border border-border/40 shadow-sm overflow-hidden rounded-2xl bg-card mt-6">
              <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                <CardTitle className="text-lg font-extrabold text-foreground">Import results</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-none">
                      <TableHead className="font-extrabold text-foreground h-12">Row</TableHead>
                      <TableHead className="font-extrabold text-foreground h-12">Name</TableHead>
                      <TableHead className="font-extrabold text-foreground h-12">Invite</TableHead>
                      <TableHead className="font-extrabold text-foreground h-12 text-right">Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r, i) => (
                      <TableRow key={r.row} className="border-b border-border/10 last:border-none">
                        <TableCell className="text-muted-foreground text-sm font-bold">{r.row}</TableCell>
                        <TableCell className="font-black text-foreground">{r.name}</TableCell>
                        <TableCell>
                          {r.status === "created"
                            ? r.inviteSent
                              ? <span className="text-xs text-growth-green font-bold flex items-center gap-1"><Mail className="w-3 h-3" /> Sent</span>
                              : <span className="text-xs text-muted-foreground font-medium">No email</span>
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.status === "created"
                            ? <span className="inline-flex items-center gap-1 text-xs font-bold text-growth-green"><CheckCircle className="w-4 h-4" /> Created</span>
                            : <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive"><XCircle className="w-4 h-4" /> {r.error ?? "Failed"}</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" className="font-bold border border-border/40 shadow-sm rounded-xl  hover:-translate-y-1 hover:shadow-sm  active:translate-y-0 active:shadow-sm transition-all">
                Import another file
              </Button>
              <Button onClick={onBack} className="font-bold border border-border/40 shadow-sm rounded-xl btn-brand  hover:-translate-y-1 hover:shadow-sm  active:translate-y-0 active:shadow-sm transition-all">
                Back to Dashboard
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
