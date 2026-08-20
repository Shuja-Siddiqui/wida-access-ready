import { Switch, Route, Router as WouterRouter } from "wouter";
import {
  QueryClient,
  QueryClientProvider,
  HydrationBoundary,
  type DehydratedState,
} from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/app-shell";
import { UserProvider, type InitialAuth } from "@/contexts/user-context";
import { SchoolProvider } from "@/contexts/school-context";
import { DistrictProvider } from "@/contexts/district-context";
import NotFound from "@/not-found/not-found";
import Landing from "@/landing/landing";
import Contact from "@/contact/contact";
import Login from "@/login/login";
import Home from "@/home/home";
import Onboarding from "@/onboarding/onboarding";
import AuthCallback from "@/auth-callback/auth-callback";
import ForgotPassword from "@/forgot-password/forgot-password";
import ResetPassword from "@/reset-password/reset-password";
import Profile from "@/profile/profile";
import Billing from "@/billing/billing";
import Checkout from "@/billing/checkout";
import Session from "@/session/session";
import SessionComplete from "@/session/session-complete";
import TeacherDashboard from "@/teacher/teacher-dashboard";
import TeacherStudentDetail from "@/teacher/teacher-student";
import TeacherStudentScores from "@/teacher/teacher-student-scores";
import TeacherBulkImport from "@/teacher/teacher-bulk-import";
import PrincipalDashboard from "@/principal/principal-dashboard";
import PrincipalTeacherDetail from "@/principal/principal-teacher-detail";
import PrincipalStudentDetail from "@/principal/principal-student-detail";
import PrincipalBulkImport from "@/principal/principal-bulk-import";
import DistrictDashboard from "@/district/district-dashboard";
import DistrictBulkImport from "@/district/district-bulk-import";
import DistrictSchools from "@/district/district-schools";
import VerifyEmail from "@/verify-email/verify-email";
import AcceptInvite from "@/accept-invite/accept-invite";
import Signup from "@/signup/signup";
import SignupEducator from "@/signup/signup-educator";
import SignupDistrict from "@/signup/signup-district";
import SignupParent from "@/signup/signup-parent";
import ListeningDemo from "@/demo/listening-demo";
import DetectPage from "@/detect/detect-page";
import ListeningPage from "@/listening/listening-page";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/contact" component={Contact} />
      <Route path="/login" component={Login} />
      <Route path="/home" component={Home} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/accept-invite" component={AcceptInvite} />
      <Route path="/profile" component={Profile} />
      <Route path="/billing" component={Billing} />
      <Route path="/billing/checkout" component={Checkout} />
      <Route path="/session/complete" component={SessionComplete} />
      <Route path="/session/:domain" component={Session} />
      <Route path="/teacher" component={TeacherDashboard} />
      <Route path="/teacher/import" component={TeacherBulkImport} />
      <Route path="/teacher/student/:studentId" component={TeacherStudentDetail} />
      <Route path="/teacher/student/:studentId/scores" component={TeacherStudentScores} />
      <Route path="/principal" component={PrincipalDashboard} />
      <Route path="/principal/import" component={PrincipalBulkImport} />
      <Route path="/principal/teacher/:teacherId" component={PrincipalTeacherDetail} />
      <Route path="/principal/student/:studentId" component={PrincipalStudentDetail} />
      <Route path="/district" component={DistrictDashboard} />
      <Route path="/district/schools" component={DistrictSchools} />
      <Route path="/district/import" component={DistrictBulkImport} />
      <Route path="/signup" component={Signup} />
      <Route path="/signup/educator" component={SignupEducator} />
      <Route path="/signup/district" component={SignupDistrict} />
      <Route path="/signup/parent" component={SignupParent} />
      <Route path="/listening" component={ListeningPage} />
      <Route path="/demo/listening" component={ListeningDemo} />
      <Route path="/detect" component={DetectPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

interface AppProps {
  queryClient: QueryClient;
  /** Set only by the SSR server to tell wouter which path to match on the server render pass. */
  ssrPath?: string;
  /** Set only by the SSR server: prefetched query data to seed the client cache with, avoiding a refetch flash. */
  dehydratedState?: DehydratedState;
  /** Set only for the SSR'd routes (`/`, `/billing`): identity resolved server-side from the session cookie. See `InitialAuth`. */
  initialAuth?: InitialAuth;
}

function App({ queryClient, ssrPath, dehydratedState, initialAuth }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        <UserProvider initialAuth={initialAuth}>
          <SchoolProvider>
          <DistrictProvider>
          <TooltipProvider>
            {/*
              Toaster is rendered BEFORE the routed tree so its subscribing
              effect (see `useToast`) mounts first. React runs effects in
              tree order on initial mount, so a page that fires `toast()`
              from its own mount-time `useEffect` (e.g. an immediate info
              toast) would otherwise dispatch before Toaster has subscribed
              to the listener list, silently dropping the toast.
            */}
            <Toaster />
            <WouterRouter
              base={import.meta.env.BASE_URL.replace(/\/$/, "")}
              ssrPath={ssrPath}
            >
              <AppShell>
                <Router />
              </AppShell>
            </WouterRouter>
          </TooltipProvider>
          </DistrictProvider>
          </SchoolProvider>
        </UserProvider>
      </HydrationBoundary>
    </QueryClientProvider>
  );
}

export default App;
