// District-admin API calls — separate from principal, teacher and student API files.

type Req = <T>(url: string, opts?: RequestInit) => Promise<T>;

export interface DistrictInfo {
  id: string;
  name: string;
  state: string | null;
  districtCode: string | null;
}

export interface DistrictSchool {
  id: string;
  name: string;
  state: string | null;
  schoolCode: string | null;
  teacherCount: number;
  studentCount: number;
}

export interface SchoolTeacher {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

export interface SchoolStudent {
  id: string;
  name: string;
  gradeBand: string;
  stateAssessment: string;
  currentStreak: number;
  totalXp: number;
}

export interface DistrictPlanInfo {
  hasActivePlan: boolean;
  seatsPurchased: number;
  seatsAllocated: number;
  seatsRemaining: number;
  subscription: {
    status: string;
    seatCount: number;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
}

export interface SchoolAllocation {
  id: string;
  schoolId: string;
  schoolName: string;
  seatsAllocated: number;
  updatedAt: string;
}

export const districtApi = {
  fetchDistrict: (districtId: string, req: Req) =>
    req<DistrictInfo>(`/api/districts/${districtId}`),

  fetchDistrictSchools: (districtId: string, req: Req) =>
    req<DistrictSchool[]>(`/api/schools?districtId=${districtId}`),

  fetchSchoolTeachers: (schoolId: string, req: Req) =>
    req<SchoolTeacher[]>(`/api/schools/${schoolId}/teachers`),

  fetchSchoolStudents: (schoolId: string, req: Req) =>
    req<SchoolStudent[]>(`/api/schools/${schoolId}/students`),

  fetchPlan: (req: Req) =>
    req<DistrictPlanInfo>("/api/district/plan"),

  fetchAllocations: (req: Req) =>
    req<SchoolAllocation[]>("/api/district/allocations"),
};
