import { createContext, Fragment, useContext, useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CreditCard,
  Headphones,
  Home,
  LayoutDashboard,
  School,
  Scan,
  Upload,
  User,
  Users,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  useGetStudent,
  getGetStudentQueryKey,
  useGetTeacher,
  getGetTeacherQueryKey,
} from "@/api-generated";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DOMAIN_CONFIG, domainLabel } from "@/home/home-types";

export type Crumb = { label: string; path?: string; icon?: LucideIcon; onClick?: () => void };

type UserType = string | null;

const TrailContext = createContext<{
  trail?: Crumb[];
  setTrail: (items?: Crumb[]) => void;
}>({ setTrail: () => {} });

export function BreadcrumbTrailProvider({ children }: { children: React.ReactNode }) {
  const [trail, setTrail] = useState<Crumb[] | undefined>();
  return (
    <TrailContext.Provider value={{ trail, setTrail }}>
      {children}
    </TrailContext.Provider>
  );
}

export function useOptionalTrail() {
  return useContext(TrailContext).trail;
}

/** Override the URL-based trail (in-page views that stay on the same route). */
export function useBreadcrumbTrail(items?: Crumb[]) {
  const { setTrail } = useContext(TrailContext);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const key = items?.map((c) => `${c.label}\0${c.path ?? ""}\0${c.onClick ? "1" : "0"}`).join("\n") ?? "";

  useEffect(() => {
    if (!key) {
      setTrail(undefined);
      return;
    }
    setTrail(itemsRef.current);
    return () => setTrail(undefined);
  }, [key, setTrail]);
}

function homeCrumb(userType: UserType, withPath = false): Crumb {
  switch (userType) {
    case "teacher":
      return { label: "My Students", icon: LayoutDashboard, ...(withPath ? { path: "/teacher" } : {}) };
    case "principal":
      return { label: "My School", icon: School, ...(withPath ? { path: "/principal" } : {}) };
    case "district_admin":
      return { label: "My District", icon: Building2, ...(withPath ? { path: "/district" } : {}) };
    case "student":
      return { label: "Practice", icon: Home, ...(withPath ? { path: "/home" } : {}) };
    default:
      return { label: "Home", icon: Home, ...(withPath ? { path: "/" } : {}) };
  }
}

function prettifySegment(segment: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(segment) || /^[0-9a-f-]{36}$/i.test(segment)) {
    return "Details";
  }
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildCrumbs(
  location: string,
  userType: UserType,
  names: { studentName: string; teacherName: string },
): Crumb[] {
  const home = (withPath = true) => homeCrumb(userType, withPath);

  if (location === "/" || location === "") {
    return [{ label: "Home", icon: Home }];
  }
  if (location === "/home") {
    return [home(false)];
  }
  if (location === "/teacher") {
    return [home(false)];
  }
  if (location === "/principal") {
    return [home(false)];
  }
  if (location === "/district") {
    return [home(false)];
  }
  if (location === "/contact") {
    return [{ label: "Home", icon: Home, path: "/" }, { label: "Contact" }];
  }
  if (location === "/listening") {
    return [home(), { label: "Listening", icon: Headphones }];
  }
  if (location === "/demo/listening") {
    return [{ label: "Home", icon: Home, path: "/" }, { label: "Listening demo", icon: Headphones }];
  }
  if (location === "/detect") {
    return [home(), { label: "Box testing", icon: Scan }];
  }
  if (location === "/profile") {
    return [home(), { label: "Profile", icon: User }];
  }
  if (location === "/billing") {
    return [home(), { label: "Billing", icon: CreditCard }];
  }
  if (location === "/billing/checkout") {
    return [home(), { label: "Billing", path: "/billing", icon: CreditCard }, { label: "Checkout" }];
  }
  if (location === "/session/complete") {
    return [home(), { label: "Session complete" }];
  }
  const sessionMatch = location.match(/^\/session\/([^/]+)$/);
  if (sessionMatch) {
    const key = decodeURIComponent(sessionMatch[1]);
    return [home(), { label: domainLabel(key), icon: DOMAIN_CONFIG[key]?.icon ?? Headphones }];
  }
  if (location === "/teacher/import") {
    return [home(), { label: "Import students", icon: Upload }];
  }
  if (location === "/principal/import") {
    return [home(), { label: "Import students", icon: Upload }];
  }
  if (location === "/district/import") {
    return [home(), { label: "Import students", icon: Upload }];
  }
  if (location === "/district/schools") {
    return [home(), { label: "Schools", icon: School }];
  }
  if (/^\/teacher\/student\/[^/]+\/scores$/.test(location)) {
    const id = location.split("/")[3];
    return [
      home(),
      { label: names.studentName, path: `/teacher/student/${id}`, icon: Users },
      { label: "Enter scores" },
    ];
  }
  if (/^\/teacher\/student\/[^/]+$/.test(location)) {
    return [home(), { label: names.studentName, icon: Users }];
  }
  if (/^\/principal\/teacher\/[^/]+$/.test(location)) {
    return [home(), { label: names.teacherName, icon: User }];
  }
  if (/^\/principal\/student\/[^/]+$/.test(location)) {
    return [home(), { label: names.studentName, icon: Users }];
  }

  const parts = location.split("/").filter(Boolean);
  const crumbs: Crumb[] = [home()];
  let acc = "";
  for (let i = 0; i < parts.length; i++) {
    acc += `/${parts[i]}`;
    crumbs.push({
      label: prettifySegment(decodeURIComponent(parts[i])),
      ...(i < parts.length - 1 ? { path: acc } : {}),
    });
  }
  return crumbs;
}

export function Breadcrumbs({ userType, items }: { userType: UserType; items?: Crumb[] }) {
  const [rawLocation] = useLocation();
  const location = rawLocation.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";

  const studentMatch = location.match(/^\/(?:teacher|principal)\/student\/([^/]+)/);
  const teacherMatch = location.match(/^\/principal\/teacher\/([^/]+)/);
  const detailStudentId = studentMatch?.[1] ?? "";
  const detailTeacherId = teacherMatch?.[1] ?? "";

  const { data: studentData } = useGetStudent(detailStudentId, {
    query: {
      enabled: !!detailStudentId,
      queryKey: getGetStudentQueryKey(detailStudentId),
    },
  });
  const { data: teacherData } = useGetTeacher(detailTeacherId, {
    query: {
      enabled: !!detailTeacherId,
      queryKey: getGetTeacherQueryKey(detailTeacherId),
    },
  });

  const studentName = studentData?.student?.name || "Student";
  const teacherName = teacherData?.name || "Teacher";

  const crumbs = items ?? buildCrumbs(location, userType, { studentName, teacherName });
  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList className="gap-1 sm:gap-1.5 text-sm">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          const label = <span className="truncate max-w-[140px] sm:max-w-[220px]">{crumb.label}</span>;
          return (
            <Fragment key={`${crumb.label}-${i}`}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="font-medium text-foreground/70">
                    {label}
                  </BreadcrumbPage>
                ) : crumb.onClick ? (
                  <BreadcrumbLink
                    asChild
                    className="font-normal text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                  >
                    <button type="button" onClick={crumb.onClick}>
                      {label}
                    </button>
                  </BreadcrumbLink>
                ) : crumb.path ? (
                  <BreadcrumbLink
                    asChild
                    className="font-normal text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                  >
                    <Link href={crumb.path}>{label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="font-medium text-foreground/70">
                    {label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
