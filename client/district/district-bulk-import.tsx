import { useLocation } from "wouter";
import { BulkImportWizard } from "@/components/bulk-import-wizard";
import { useDistrict } from "@/contexts/district-context";
import { LoadingScreen } from "@/components/loading-screen";

export default function DistrictBulkImport() {
  const [, setLocation] = useLocation();
  const { schools, isLoading } = useDistrict();

  if (isLoading) return <LoadingScreen />;

  return (
    <BulkImportWizard
      mode="org"
      districtSchools={schools.map((s) => ({ id: s.id, name: s.name }))}
      onBack={() => setLocation("/district")}
    />
  );
}
