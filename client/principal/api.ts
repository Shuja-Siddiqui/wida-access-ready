// Principal-specific API calls — no mixing with teacher/district/student API files.
// Shared school endpoints live here because principals call them exclusively in this context.

type Req = <T>(url: string, opts?: RequestInit) => Promise<T>;

export interface PrincipalProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId: string | null;
  school?: { id: string; name: string; districtId?: string; districtName?: string | null } | null;
  avatarUrl?: string | null;
}

export interface SchoolInfo {
  id: string;
  name: string;
  state: string | null;
  schoolCode: string | null;
  districtName?: string | null;
}

export interface SchoolTeacher {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId: string | null;
  avatarUrl?: string | null;
}

export interface SchoolStudent {
  id: string;
  name: string;
  gradeBand: string;
  stateAssessment: string;
  currentStreak: number;
  totalXp: number;
  guardianId: string;
}

export interface TeacherStudent {
  id: string;
  name: string;
  gradeBand: string;
  stateAssessment: string;
  currentStreak: number;
  totalXp: number;
}

export interface StudentDomain {
  domain: string;
  currentLevel: number;
  exitThreshold: number;
  gap: number;
  sessionsToExit: number;
}

export interface StudentDetailResponse {
  student: {
    id: string;
    name: string;
    gradeBand: string;
    stateAssessment: string;
    currentStreak: number;
    totalXp: number;
  };
  progress: { domains: StudentDomain[] };
  recentSessions: Array<{ id: string; domain: string; levelStart: number; score?: number; completedAt?: string; createdAt?: string }>;
}

export interface SeatAllocation {
  schoolId: string;
  seatsAllocated: number;
  seatsUsed: number;
  seatsRemaining: number | null;
  hasAllocation: boolean;
}

export const principalApi = {
  fetchMyProfile: (principalId: string, req: Req) =>
    req<PrincipalProfile>(`/api/teachers/${principalId}`),

  fetchSchool: (schoolId: string, req: Req) =>
    req<SchoolInfo>(`/api/schools/${schoolId}`),

  fetchSeatAllocation: (schoolId: string, req: Req) =>
    req<SeatAllocation>(`/api/schools/${schoolId}/seat-allocation`),

  fetchSchoolTeachers: (schoolId: string, req: Req) =>
    req<SchoolTeacher[]>(`/api/schools/${schoolId}/teachers`),

  fetchSchoolStudents: (schoolId: string, req: Req) =>
    req<SchoolStudent[]>(`/api/schools/${schoolId}/students`),

  fetchTeacherProfile: (teacherId: string, req: Req) =>
    req<PrincipalProfile>(`/api/teachers/${teacherId}`),

  fetchTeacherStudents: async (teacherId: string, req: Req) => {
    // The endpoint returns { student: {...}, domains: [...], ... }[] — flatten to TeacherStudent[].
    const raw = await req<Array<{ student: TeacherStudent }>>(
      `/api/teachers/${teacherId}/students`,
    );
    return raw.map((item) => item.student);
  },

  fetchStudentDetail: (studentId: string, req: Req) =>
    req<StudentDetailResponse>(`/api/students/${studentId}`),

  addTeacherToSchool: (schoolId: string, teacherId: string, req: Req) =>
    req<void>(`/api/schools/${schoolId}/teachers/${teacherId}`, { method: "PUT" }),

  searchTeachersByEmail: (email: string, req: Req) =>
    req<Array<{ id: string; name: string; email: string }>>(
      `/api/teachers?email=${encodeURIComponent(email)}`
    ),

  inviteTeacher: (
    params: { firstName: string; lastName: string; email: string },
    req: Req,
  ) =>
    req<{ ok: boolean }>("/api/auth/invite/educator", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  assignStudentTeacher: (
    studentId: string,
    assignedTeacherId: string | null,
    req: Req,
  ) =>
    req<{ id: string; teacherId: string | null }>(`/api/students/${studentId}`, {
      method: "PATCH",
      body: JSON.stringify({ assignedTeacherId }),
    }),

  bulkAssignStudents: (
    teacherId: string,
    studentIds: string[],
    req: Req,
  ) =>
    req<{ assigned: number }>(`/api/teachers/${teacherId}/students/bulk-assign`, {
      method: "POST",
      body: JSON.stringify({ studentIds }),
    }),
};
