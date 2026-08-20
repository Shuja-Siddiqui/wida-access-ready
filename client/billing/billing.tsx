import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LoadingScreen } from "@/components/loading-screen";
import { StudentBilling } from "@/billing/student-billing";
import { EducatorBilling } from "@/billing/educator-billing";

export default function Billing() {
  const { studentId, teacherId, ready } = useAuth();
  const [, setLocation] = useLocation();

  const isEducator = !studentId && !!teacherId;

  useEffect(() => {
    if (ready && !studentId && !teacherId) {
      setLocation("/login");
    }
  }, [ready, studentId, teacherId, setLocation]);

  if (!ready) {
    return <LoadingScreen />;
  }
  if (isEducator) {
    return <EducatorBilling teacherId={teacherId!} />;
  }
  if (studentId) {
    return <StudentBilling studentId={studentId} />;
  }
  return <LoadingScreen />;
}
