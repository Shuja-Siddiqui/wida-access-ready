import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useApi, extractErrorMessage } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type StaffToggleProps = {
  kind: "staff";
  schoolId: string;
  profileId: string;
  isActive: boolean;
  onUpdated?: (isActive: boolean) => void;
  className?: string;
};

type StudentToggleProps = {
  kind: "student";
  studentId: string;
  isActive: boolean;
  onUpdated?: (isActive: boolean) => void;
  className?: string;
};

export function MemberActiveToggle(props: StaffToggleProps | StudentToggleProps) {
  const { request } = useApi();
  const { toast } = useToast();
  const [active, setActive] = useState(props.isActive);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setActive(props.isActive);
  }, [props.isActive]);

  async function onCheckedChange(checked: boolean) {
    setSaving(true);
    try {
      if (props.kind === "staff") {
        await request(`/api/schools/${props.schoolId}/teachers/${props.profileId}/active`, {
          method: "PATCH",
          body: JSON.stringify({ isActive: checked }),
        });
      } else {
        await request(`/api/students/${props.studentId}/active`, {
          method: "PATCH",
          body: JSON.stringify({ isActive: checked }),
        });
      }
      setActive(checked);
      props.onUpdated?.(checked);
      toast({
        title: checked ? "Account activated" : "Account deactivated",
      });
    } catch (err) {
      toast({ title: extractErrorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={cn("flex items-center gap-2", props.className)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Switch
        checked={active}
        disabled={saving}
        onCheckedChange={(v) => void onCheckedChange(v)}
        aria-label={active ? "Active" : "Inactive"}
      />
      <span className={cn("text-xs font-bold", active ? "text-growth-green" : "text-muted-foreground")}>
        {active ? "Active" : "Inactive"}
      </span>
    </div>
  );
}
