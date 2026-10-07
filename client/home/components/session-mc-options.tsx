import { cn } from "@/lib/utils";
import { OptionVisual } from "@/components/shape-glyph";
import {
  SESSION_ERROR,
  SESSION_MUTED_OPTION,
  SESSION_OPTION_BASE,
  SESSION_SUCCESS,
  type SessionTheme,
} from "./session-ui-styles";

/** Borderless multiple-choice list — shared across reading, listening, and tap sessions. */
export function SessionMcOptions({
  options,
  diagrams,
  correct,
  selectedIdx,
  showFeedback,
  onSelect,
  theme,
  disabled = false,
}: {
  options: string[];
  diagrams?: (string | null)[];
  correct: number;
  selectedIdx: number;
  showFeedback: boolean;
  onSelect: (i: number) => void;
  theme: SessionTheme;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      {options.map((opt, i) => {
        const isCorrect  = i === correct;
        const isSelected = i === selectedIdx;
        let style = `${SESSION_OPTION_BASE} ${theme.chip} ${theme.chipHover}`;
        if (showFeedback) {
          if (isCorrect) style = `${SESSION_OPTION_BASE} ${SESSION_SUCCESS}`;
          else if (isSelected && !isCorrect) style = `${SESSION_OPTION_BASE} ${SESSION_ERROR}`;
          else style = `${SESSION_OPTION_BASE} ${SESSION_MUTED_OPTION}`;
        } else if (isSelected) {
          style = `${SESSION_OPTION_BASE} ${theme.selected}`;
        }
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            disabled={disabled || showFeedback}
            className={cn(style, disabled && !showFeedback && "opacity-40 pointer-events-none")}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium tabular-nums",
                  isSelected && !showFeedback
                    ? "bg-foreground text-background"
                    : "text-muted-foreground",
                )}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm leading-relaxed text-inherit">
                <OptionVisual label={opt} diagram={diagrams?.[i]} />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
