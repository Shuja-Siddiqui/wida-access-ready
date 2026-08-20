import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@/api-generated/custom-fetch";
import { useUser } from "@/contexts/user-context";
import type { SchoolInfo, SchoolTeacher, SchoolStudent } from "@/principal/api";

const STALE_SCHOOL_INFO = 5 * 60 * 1000;
const STALE_ROSTER = 3 * 60 * 1000;

interface SchoolContextValue {
  school: SchoolInfo | null;
  schoolId: string | null;
  teachers: SchoolTeacher[];
  students: SchoolStudent[];
  teacherCount: number;
  studentCount: number;
  isLoading: boolean;
  invalidate: () => Promise<void>;
}

const SchoolContext = createContext<SchoolContextValue | null>(null);

export function SchoolProvider({ children }: { children: ReactNode }) {
  const { teacherId, teacher, userType } = useUser();
  const queryClient = useQueryClient();

  const schoolId =
    userType === "principal" ? (teacher?.schoolId ?? null) : null;

  const schoolQuery = useQuery({
    queryKey: ["school", schoolId],
    queryFn: () => customFetch<SchoolInfo>(`/api/schools/${schoolId}`),
    enabled: !!schoolId,
    staleTime: STALE_SCHOOL_INFO,
  });

  const teachersQuery = useQuery({
    queryKey: ["school-teachers", schoolId],
    queryFn: () =>
      customFetch<SchoolTeacher[]>(`/api/schools/${schoolId}/teachers`),
    enabled: !!schoolId,
    staleTime: STALE_ROSTER,
  });

  const studentsQuery = useQuery({
    queryKey: ["school-students", schoolId],
    queryFn: () =>
      customFetch<SchoolStudent[]>(`/api/schools/${schoolId}/students`),
    enabled: !!schoolId,
    staleTime: STALE_ROSTER,
  });

  const teachers = useMemo(
    () => (teachersQuery.data ?? []).filter((t) => t.id !== teacherId),
    [teachersQuery.data, teacherId],
  );

  const students = useMemo(
    () => studentsQuery.data ?? [],
    [studentsQuery.data],
  );

  const teacherCount = useMemo(() => teachers.length, [teachers]);
  const studentCount = useMemo(() => students.length, [students]);

  const invalidate = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["school-teachers", schoolId] }),
      queryClient.invalidateQueries({ queryKey: ["school-students", schoolId] }),
    ]);
  }, [queryClient, schoolId]);

  const value = useMemo<SchoolContextValue>(
    () => ({
      school: schoolQuery.data ?? null,
      schoolId,
      teachers,
      students,
      teacherCount,
      studentCount,
      isLoading:
        schoolQuery.isLoading ||
        teachersQuery.isLoading ||
        studentsQuery.isLoading,
      invalidate,
    }),
    [
      schoolQuery.data,
      schoolQuery.isLoading,
      schoolId,
      teachers,
      students,
      teacherCount,
      studentCount,
      teachersQuery.isLoading,
      studentsQuery.isLoading,
      invalidate,
    ],
  );

  return (
    <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>
  );
}

export function useSchool(): SchoolContextValue {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error("useSchool must be used inside SchoolProvider");
  return ctx;
}
