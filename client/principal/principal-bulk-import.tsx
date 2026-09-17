import { useLocation } from "wouter";
import { BulkImportWizard } from "@/components/bulk-import-wizard";

export default function PrincipalBulkImport() {
  const [, setLocation] = useLocation();

  return (
    <BulkImportWizard
      mode="org"
      onBack={() => setLocation("/principal")}
    />
  );
}
