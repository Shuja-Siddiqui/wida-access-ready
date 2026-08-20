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
import type { DistrictInfo, DistrictSchool } from "@/district/api";

const STALE_DISTRICT = 5 * 60 * 1000;

interface DistrictContextValue {
  district: DistrictInfo | null;
  schools: DistrictSchool[];
  totalSchools: number;
  totalTeachers: number;
  totalStudents: number;
  isLoading: boolean;
  invalidate: () => Promise<void>;
}

const DistrictContext = createContext<DistrictContextValue | null>(null);

export function DistrictProvider({ children }: { children: ReactNode }) {
  const { districtId, userType } = useUser();
  const queryClient = useQueryClient();

  const enabled = !!districtId && userType === "district_admin";

  const districtQuery = useQuery({
    queryKey: ["district", districtId],
    queryFn: () => customFetch<DistrictInfo>(`/api/districts/${districtId}`),
    enabled,
    staleTime: STALE_DISTRICT,
  });

  const schoolsQuery = useQuery({
    queryKey: ["district-schools", districtId],
    queryFn: () =>
      customFetch<DistrictSchool[]>(
        `/api/schools?districtId=${districtId}`,
      ),
    enabled,
    staleTime: STALE_DISTRICT,
  });

  const schools = useMemo(() => schoolsQuery.data ?? [], [schoolsQuery.data]);

  const totalSchools = useMemo(() => schools.length, [schools]);
  const totalTeachers = useMemo(
    () => schools.reduce((sum, s) => sum + (s.teacherCount ?? 0), 0),
    [schools],
  );
  const totalStudents = useMemo(
    () => schools.reduce((sum, s) => sum + (s.studentCount ?? 0), 0),
    [schools],
  );

  const invalidate = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["district", districtId] }),
      queryClient.invalidateQueries({
        queryKey: ["district-schools", districtId],
      }),
    ]);
  }, [queryClient, districtId]);

  const value = useMemo<DistrictContextValue>(
    () => ({
      district: districtQuery.data ?? null,
      schools,
      totalSchools,
      totalTeachers,
      totalStudents,
      isLoading: districtQuery.isLoading || schoolsQuery.isLoading,
      invalidate,
    }),
    [
      districtQuery.data,
      districtQuery.isLoading,
      schools,
      totalSchools,
      totalTeachers,
      totalStudents,
      schoolsQuery.isLoading,
      invalidate,
    ],
  );

  return (
    <DistrictContext.Provider value={value}>{children}</DistrictContext.Provider>
  );
}

export function useDistrict(): DistrictContextValue {
  const ctx = useContext(DistrictContext);
  if (!ctx) throw new Error("useDistrict must be used inside DistrictProvider");
  return ctx;
}
