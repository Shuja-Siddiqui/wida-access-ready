import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface AppSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface AppSelectProps {
  label?: ReactNode;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  triggerClassName?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
}

/**
 * AppSelect — the ONE canonical select field for this app.
 *
 * Renders an optional label, a styled Radix Select trigger, the options list,
 * an error message, and a hint. Disabled options are supported per-item.
 */
export function AppSelect({
  label,
  id,
  value,
  onChange,
  options,
  placeholder,
  triggerClassName,
  error,
  hint,
  disabled,
}: AppSelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <Label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block"
        >
          {label}
        </Label>
      )}

      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          className={cn(
            error && "border-destructive focus:border-destructive focus:ring-destructive/20",
            triggerClassName,
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-muted-foreground font-medium">{hint}</p>
      )}
    </div>
  );
}
