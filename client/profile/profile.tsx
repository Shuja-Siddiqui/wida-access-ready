import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/contexts/user-context";
import { StudentProfile } from "@/profile/student-profile";
import { EducatorProfile } from "@/profile/educator-profile";
import { PrincipalProfile } from "@/profile/principal-profile";
import { LoadingScreen } from "@/components/loading-screen";

export default function Profile() {
  const { studentId, teacherId, userType, role, ready } = useAuth();
  const { teacher, isTeacherLoading } = useUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!ready) return;
    if (!studentId && !teacherId) {
      setLocation("/login");
      return;
    }
    // district_admins don't have a guardian-backed teacher profile —
    // redirect them to their dashboard instead.
    if (userType === "district_admin") {
      setLocation("/district");
    }
  }, [ready, studentId, teacherId, userType, setLocation]);

  if (!ready) {
    return <LoadingScreen />;
  }
  if (studentId) {
    return <StudentProfile studentId={studentId} />;
  }
  if (teacherId && userType !== "district_admin") {
    const isPrincipal =
      role === "principal" || userType === "principal" || teacher?.role === "principal";
    if (isTeacherLoading && !teacher) {
      return <LoadingScreen />;
    }
    if (isPrincipal) {
      return <PrincipalProfile teacherId={teacherId} />;
    }
    return <EducatorProfile teacherId={teacherId} />;
  }
  return <LoadingScreen />;
}
