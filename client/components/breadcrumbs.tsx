import { Fragment } from "react";
import type { LucideIcon } from "lucide-react";
import { Building2, CreditCard, Home, LayoutDashboard, School, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useGetStudent, getGetStudentQueryKey } from "@/api-generated";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type Crumb = { label: string; path?: string; icon?: LucideIcon; onClick?: () => void };

type UserType = string | null;

function homeCrumb(userType: UserType, withPath = false): Crumb {
  switch (userType) {
    case "teacher":
      return { label: "My Students", icon: LayoutDashboard, ...(withPath ? { path: "/teacher" } : {}) };
    case "principal":
      return { label: "My School", icon: School, ...(withPath ? { path: "/principal" } : {}) };
    case "district_admin":
      return { label: "My District", icon: Building2, ...(withPath ? { path: "/district" } : {}) };
    default:
      return { label: "Practice", icon: Home, ...(withPath ? { path: "/home" } : {}) };
  }
}

function buildCrumbs(
  location: string,
  userType: UserType,
  studentId: string,
  studentName: string,
): Crumb[] {
  if (location === "/home") {
    return [{ label: "Practice", icon: Home }];
  }
  if (location === "/teacher") {
    return [{ label: "My Students", icon: LayoutDashboard }];
  }
  if (location === "/principal") {
    return [{ label: "My School", icon: School }];
  }
  if (location === "/district") {
    return [{ label: "My District", icon: Building2 }];
  }
  if (location === "/profile") {
    return [homeCrumb(userType, true), { label: "Profile", icon: User }];
  }
  if (location === "/billing") {
    return [homeCrumb(userType, true), { label: "Billing", icon: CreditCard }];
  }
  if (location === "/billing/checkout") {
    return [
      homeCrumb(userType, true),
      { label: "Billing", path: "/billing", icon: CreditCard },
      { label: "Checkout" },
    ];
  }
  if (/^\/teacher\/student\/[^/]+\/scores$/.test(location)) {
    return [
      { label: "My Students", path: "/teacher", icon: LayoutDashboard },
      { label: studentName, path: `/teacher/student/${studentId}` },
      { label: "Enter Scores" },
    ];
  }
  if (/^\/teacher\/student\/[^/]+$/.test(location)) {
    return [
      { label: "My Students", path: "/teacher", icon: LayoutDashboard },
      { label: studentName },
    ];
  }
  if (/^\/principal\/teacher\/[^/]+$/.test(location)) {
    return [
      { label: "My School", path: "/principal", icon: School },
      { label: studentName || "Teacher" },
    ];
  }
  if (/^\/principal\/student\/[^/]+$/.test(location)) {
    return [
      { label: "My School", path: "/principal", icon: School },
      { label: studentName || "Student" },
    ];
  }
  return [homeCrumb(userType)];
}

export function Breadcrumbs({ userType, items }: { userType: UserType; items?: Crumb[] }) {
  const [rawLocation] = useLocation();
  const location =
    rawLocation.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";

  const studentMatch = location.match(/^\/teacher\/student\/([^/]+)/);
  const detailStudentId = studentMatch?.[1] ?? "";

  const { data: studentData } = useGetStudent(detailStudentId, {
    query: {
      enabled: !!detailStudentId,
      queryKey: getGetStudentQueryKey(detailStudentId),
    },
  });
  const studentName = studentData?.student?.name || "Student";

  const crumbs = items ?? buildCrumbs(location, userType, detailStudentId, studentName);
  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList className="gap-1 sm:gap-1.5 text-sm">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          const label = <span className="truncate max-w-[140px]">{crumb.label}</span>;
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
