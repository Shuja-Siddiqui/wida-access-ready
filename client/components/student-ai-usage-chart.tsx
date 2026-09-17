import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { customFetch } from "@/api-generated/custom-fetch";

export type StudentAiUsageDay = {
  date: string;
  total: number;
  generate: number;
  coaching: number;
  speech: number;
};

export type StudentAiUsage = {
  days: number;
  total: number;
  series: StudentAiUsageDay[];
};

const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid hsl(var(--border) / 0.4)",
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 700,
  color: "var(--color-foreground)",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
  padding: "10px 14px",
};

function shortDate(iso: string) {
  const [, month, day] = iso.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function StudentAiUsageChart({ studentId, days = 30 }: { studentId: string; days?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/students/${studentId}/ai-usage`, days],
    queryFn: () =>
      customFetch<StudentAiUsage>(`/api/students/${studentId}/ai-usage?days=${days}`),
    enabled: !!studentId,
  });

  const series = data?.series ?? [];
  const isEmpty = !isLoading && (data?.total ?? 0) === 0;
  const tickEvery = Math.max(1, Math.ceil(series.length / 8));

  return (
    <Card className="rounded-2xl border border-border/40 shadow-sm bg-card overflow-hidden">
      <CardHeader className="pb-0 pt-6 px-6">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xl font-black text-foreground flex items-center gap-2 tracking-tight">
            <Activity className="w-5 h-5 text-primary" />
            Practice activity
          </CardTitle>
          {data && data.total > 0 && (
            <span className="text-xs font-bold text-muted-foreground">
              {data.total} AI {data.total === 1 ? "call" : "calls"} in {data.days} days
            </span>
          )}
        </div>
        <p className="text-xs font-medium text-muted-foreground pt-1">
          Daily practice requests (questions, coaching, and speech).
        </p>
      </CardHeader>
      <CardContent className="pt-4 pb-6 px-2">
        {isLoading ? (
          <div className="h-56 flex items-center justify-center text-sm font-bold text-muted-foreground">
            Loading activity…
          </div>
        ) : isEmpty ? (
          <div className="h-56 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Activity className="w-10 h-10 opacity-20" />
            <p className="text-sm font-bold">No practice activity yet</p>
            <p className="text-xs opacity-70">This graph fills in as the student practices</p>
          </div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
                <XAxis
                  dataKey="date"
                  interval={tickEvery - 1}
                  tickFormatter={(value) => shortDate(String(value))}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                  contentStyle={tooltipStyle}
                  labelFormatter={(label) => String(label)}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      generate: "Questions",
                      coaching: "Coaching",
                      speech: "Speech",
                    };
                    return [value, labels[name] ?? name];
                  }}
                />
                <Bar dataKey="generate" stackId="a" fill="var(--color-trust-blue)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="coaching" stackId="a" fill="var(--color-growth-green)" />
                <Bar dataKey="speech" stackId="a" fill="var(--color-energy-orange)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
