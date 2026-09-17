import { useLocation } from "wouter";
import { BulkImportWizard } from "@/components/bulk-import-wizard";

export default function DistrictBulkImport() {
  const [, setLocation] = useLocation();

  return (
    <BulkImportWizard
      mode="org"
      onBack={() => setLocation("/district")}
    />
  );
}
