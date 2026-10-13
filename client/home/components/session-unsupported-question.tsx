import { AlertCircle } from "lucide-react";
import { SESSION_LABEL, SESSION_QUESTION } from "./session-ui-styles";

/** Shown when AI emits a type/shape the UI cannot render. */
export function SessionUnsupportedQuestion({
  question,
  type,
}: {
  question?: string;
  type?: string;
}) {
  return (
    <div className="space-y-3 py-2">
      {question && <h3 className={SESSION_QUESTION}>{question}</h3>}
      <div className="flex items-start gap-3 text-sm text-muted-foreground">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <div className="space-y-1">
          <p>This question type could not be displayed.</p>
          {type && (
            <p className={SESSION_LABEL}>
              Type: {type}
            </p>
          )}
          <p className="text-xs">Try starting a new practice session.</p>
        </div>
      </div>
    </div>
  );
}
