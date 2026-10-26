import { useLocation } from "wouter";
import { GraduationCap, BookOpen, Building2, Users } from "lucide-react";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { AuthFormHeader, AuthRoleCard } from "@/components/auth-signup-ui";

const ROLES = [
  {
    id: "student",
    icon: GraduationCap,
    title: "Student",
    description: "Daily practice toward your exit exam",
    href: "/onboarding",
  },
  {
    id: "educator",
    icon: BookOpen,
    title: "Teacher / Educator",
    description: "Track progress across listening, reading, speaking, and writing",
    href: "/signup/educator",
  },
  {
    id: "district",
    icon: Building2,
    title: "District admin",
    description: "District-wide visibility and ELL program oversight",
    href: "/signup/district",
  },
  {
    id: "parent",
    icon: Users,
    title: "Parent / Guardian",
    description: "Stay connected to your child's learning path",
    href: "/signup/parent",
  },
];

const FEATURES = [
  "Adaptive practice aligned to WIDA and state exit goals",
  "About ten focused minutes per day",
  "Clear progress you can act on",
];

export default function Signup() {
  const [, setLocation] = useLocation();

  return (
    <AuthSplitLayout
      panelTitle="Create your ACCESS Ready account"
      panelSubtitle="Personalized English proficiency prep—for students, educators, and families."
      panelFeatures={FEATURES}
      backTo="/login"
    >
      <div className="w-full max-w-md">
        <AuthFormHeader
          eyebrow="Get started"
          title="Who are you signing up as?"
          subtitle="Pick the role that fits you. You can always switch accounts later."
        />

        <div className="space-y-2.5">
          {ROLES.map((role, i) => (
            <AuthRoleCard
              key={role.id}
              icon={role.icon}
              title={role.title}
              description={role.description}
              index={i}
              onClick={() => setLocation(role.href)}
            />
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => setLocation("/login")}
            className="font-semibold text-primary hover:underline underline-offset-4"
          >
            Log in
          </button>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
