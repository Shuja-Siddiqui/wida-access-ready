import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setAuthTokenGetter } from "@/api-generated/custom-fetch";
import { useAuthRefresh, writeRefreshToken, clearRefreshToken } from "@/hooks/use-auth-refresh";
import {
  useGetStudent,
  getGetStudentQueryKey,
  useGetTeacher,
  getGetTeacherQueryKey,
  type StudentDetail,
  type Teacher,
} from "@/api-generated";

// ---------------------------------------------------------------------------
// Storage split:
//  - studentId / teacherId / userType — small, non-sensitive identifiers that
//    should survive across browser tabs and restarts → localStorage.
//  - authToken (the session/"refresh" token) — sensitive, and only ever
//    needed for API calls originating from the current tab → sessionStorage.
// ---------------------------------------------------------------------------
const STORAGE_KEYS = {
  studentId: "studentId",
  teacherId: "teacherId",
  userType: "userType",
  districtId: "districtId",
  role: "role",
} as const;
const TOKEN_KEY = "authToken";

function readToken(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

// Registered once at module scope so every `customFetch` call (generated
// hooks and `useApi`) automatically attaches the current session token.
setAuthTokenGetter(readToken);

export type StudentSummary = StudentDetail["student"];

interface LoginWithTokenOptions {
  studentId?: string;
  teacherId?: string;
  userType?: string;
  districtId?: string;
  role?: string;
  refreshToken?: string;
}

interface UserContextValue {
  studentId: string | null;
  teacherId: string | null;
  token: string | null;
  userType: string | null;
  districtId: string | null;
  role: string | null;
  ready: boolean;
  student: StudentSummary | undefined;
  studentData: StudentDetail | undefined;
  isStudentLoading: boolean;
  refetchStudent: () => void;
  teacher: Teacher | undefined;
  isTeacherLoading: boolean;
  refetchTeacher: () => void;
  loginStudent: (id: string) => void;
  loginTeacher: (id: string) => void;
  loginWithToken: (token: string, opts: LoginWithTokenOptions) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

/**
 * Identity resolved server-side for the two SSR'd routes (`/` and
 * `/billing`, see `entry-server.tsx`) from the browser's session cookie.
 * Passed into `UserProvider` so its very first render — both on the server
 * and during client hydration — already reflects the logged-in user instead
 * of a `null`/loading state that only gets filled in after a `useEffect`
 * reads localStorage. Without this, `/billing` could never truly be
 * server-rendered: the server has no `useEffect`, so it would always render
 * the loading screen while the client would (a moment later) render real
 * content — a guaranteed hydration mismatch.
 */
export interface InitialAuth {
  ready: boolean;
  studentId: string | null;
  teacherId: string | null;
  userType: string | null;
  districtId?: string | null;
}

export function UserProvider({
  children,
  initialAuth,
}: {
  children: ReactNode;
  /** Only provided by the SSR server / SSR-hydrated client entry — see `InitialAuth` above. */
  initialAuth?: InitialAuth;
}) {
  const [studentId, setStudentId] = useState<string | null>(initialAuth?.studentId ?? null);
  const [teacherId, setTeacherId] = useState<string | null>(initialAuth?.teacherId ?? null);
  const [token, setToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(initialAuth?.userType ?? null);
  const [districtId, setDistrictId] = useState<string | null>(initialAuth?.districtId ?? null);
  const [role, setRole] = useState<string | null>(null);
  const [ready, setReady] = useState(initialAuth?.ready ?? false);

  useEffect(() => {
    // On SSR'd routes, `initialAuth` already reflects the real session (read
    // from the cookie server-side), so localStorage is only consulted here
    // to pick up the sensitive `authToken` (never sent to the server) and to
    // reconcile edge cases (e.g. the user logged out in another tab). On
    // non-SSR'd routes `initialAuth` is undefined and this behaves exactly
    // as before.
    //
    // `initialAuth` can also be present-but-unauthenticated (no studentId/
    // teacherId) even though the browser holds a valid client-side session —
    // e.g. the auth cookie is missing/stale for a reason unrelated to actual
    // login state. Falling back to localStorage here (instead of trusting
    // `initialAuth`'s "logged out" verdict as final) prevents SSR routes from
    // force-logging-out a user who is really still signed in.
    const initialAuthHasIdentity = !!(initialAuth?.studentId || initialAuth?.teacherId);
    if (!initialAuth || !initialAuthHasIdentity) {
      const storedStudentId = localStorage.getItem(STORAGE_KEYS.studentId);
      const storedTeacherId = localStorage.getItem(STORAGE_KEYS.teacherId);
      const storedUserType = localStorage.getItem(STORAGE_KEYS.userType);
      const storedDistrictId = localStorage.getItem(STORAGE_KEYS.districtId);
      const storedRole = localStorage.getItem(STORAGE_KEYS.role);
      if (storedStudentId || storedTeacherId) {
        setStudentId(storedStudentId);
        setTeacherId(storedTeacherId);
        setUserType(storedUserType);
        setDistrictId(storedDistrictId);
        setRole(storedRole);
      }
    }
    setToken(readToken());
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    data: studentData,
    isLoading: isStudentLoading,
    refetch: refetchStudent,
  } = useGetStudent(studentId || "", {
    query: { enabled: !!studentId, queryKey: getGetStudentQueryKey(studentId || "") },
  });

  // district_admin sessions are backed by district_admins, not guardians —
  // their teacherId is a district_admins.id and GET /api/teachers/:id would
  // 404. Skip the fetch entirely for that role.
  const canFetchTeacher = !!teacherId && userType !== "district_admin";
  const {
    data: teacherData,
    isLoading: isTeacherLoading,
    refetch: refetchTeacher,
  } = useGetTeacher(teacherId || "", {
    query: { enabled: canFetchTeacher, queryKey: getGetTeacherQueryKey(teacherId || "") },
  });

  const loginStudent = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEYS.studentId, id);
    localStorage.setItem(STORAGE_KEYS.userType, "student");
    setStudentId(id);
    setUserType("student");
  }, []);

  const loginTeacher = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEYS.teacherId, id);
    localStorage.setItem(STORAGE_KEYS.userType, "teacher");
    setTeacherId(id);
    setUserType("teacher");
  }, []);

  const loginWithToken = useCallback((tok: string, opts: LoginWithTokenOptions) => {
    sessionStorage.setItem(TOKEN_KEY, tok);
    setToken(tok);
    if (opts.refreshToken) writeRefreshToken(opts.refreshToken);
    if (opts.studentId) {
      localStorage.setItem(STORAGE_KEYS.studentId, opts.studentId);
      setStudentId(opts.studentId);
    }
    if (opts.teacherId) {
      localStorage.setItem(STORAGE_KEYS.teacherId, opts.teacherId);
      setTeacherId(opts.teacherId);
    }
    if (opts.userType) {
      localStorage.setItem(STORAGE_KEYS.userType, opts.userType);
      setUserType(opts.userType);
    }
    if (opts.districtId) {
      localStorage.setItem(STORAGE_KEYS.districtId, opts.districtId);
      setDistrictId(opts.districtId);
    }
    if (opts.role) {
      localStorage.setItem(STORAGE_KEYS.role, opts.role);
      setRole(opts.role);
    }
  }, []);

  const logout = useCallback(() => {
    const tok = readToken();
    if (tok) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${tok}` },
      }).catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEYS.studentId);
    localStorage.removeItem(STORAGE_KEYS.teacherId);
    localStorage.removeItem(STORAGE_KEYS.userType);
    localStorage.removeItem(STORAGE_KEYS.districtId);
    localStorage.removeItem(STORAGE_KEYS.role);
    sessionStorage.removeItem(TOKEN_KEY);
    clearRefreshToken();
    setStudentId(null);
    setTeacherId(null);
    setToken(null);
    setUserType(null);
    setDistrictId(null);
    setRole(null);
  }, []);

  // Wire refresh callbacks AFTER logout is defined so the closure is valid.
  useAuthRefresh({
    onRefreshed: (accessToken) => {
      sessionStorage.setItem(TOKEN_KEY, accessToken);
      setToken(accessToken);
    },
    onLogout: logout,
  });

  const value = useMemo<UserContextValue>(
    () => ({
      studentId,
      teacherId,
      token,
      userType,
      districtId,
      role,
      ready,
      student: studentData?.student,
      studentData,
      isStudentLoading,
      refetchStudent: () => void refetchStudent(),
      teacher: teacherData,
      isTeacherLoading,
      refetchTeacher: () => void refetchTeacher(),
      loginStudent,
      loginTeacher,
      loginWithToken,
      logout,
    }),
    [
      studentId,
      teacherId,
      token,
      userType,
      districtId,
      role,
      ready,
      studentData,
      isStudentLoading,
      refetchStudent,
      teacherData,
      isTeacherLoading,
      refetchTeacher,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
