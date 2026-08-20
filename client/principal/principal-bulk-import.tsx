import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { BulkImportWizard } from "@/components/bulk-import-wizard";

export default function PrincipalBulkImport() {
  const [, setLocation] = useLocation();
  const { teacherId } = useAuth();

  if (!teacherId) return null;

  return (
    <BulkImportWizard
      guardianId={teacherId}
      onBack={() => setLocation("/principal")}
    />
  );
}
