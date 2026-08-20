// `useAuth` is now a thin alias over the shared `UserContext` — every
// component that calls `useAuth()` reads/writes the same context state
// instead of its own independent (and unsynced) copy. See
// `client/contexts/user-context.tsx` for the storage split
// (studentId/teacherId/userType in localStorage, authToken in sessionStorage)
// and the actual implementation.
export { useUser as useAuth } from "@/contexts/user-context";
