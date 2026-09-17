import { useLocation } from "wouter";
import { BulkImportWizard } from "@/components/bulk-import-wizard";

export default function TeacherBulkImport() {
  const [, setLocation] = useLocation();

  return (
    <BulkImportWizard
      mode="teacher"
      onBack={() => setLocation("/teacher")}
    />
  );
}
