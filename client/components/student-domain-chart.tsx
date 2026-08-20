import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface SessionForChart {
  domain: string;
  levelStart: number;
}

interface StudentDomainChartProps {
  sessions: SessionForChart[];
  title?: string;
}

const DOMAIN_COLORS: Record<string, string> = {
  listening: "var(--color-trust-blue)",
  speaking:  "var(--color-growth-green)",
  reading:   "var(--color-energy-orange)",
  writing:   "var(--color-achieve-purple)",
};

const DOMAIN_LABELS: Record<string, string> = {
  listening: "Listening",
  speaking:  "Speaking",
  reading:   "Reading",
  writing:   "Writing",
};

const DOMAINS = ["listening", "speaking", "reading", "writing"] as const;

const tooltipStyle = {
  background:   "var(--color-card)",
  border:       "1px solid hsl(var(--border) / 0.4)",
  borderRadius: 10,
  fontSize:     12,
  fontWeight:   700,
  color:        "var(--color-foreground)",
  boxShadow:    "0 4px 12px rgb(0 0 0 / 0.08)",
  padding:      "10px 14px",
};
const tooltipLabelStyle = { color: "var(--color-muted-foreground)", fontWeight: 600, marginBottom: 4 };

export function StudentDomainChart({ sessions, title = "Progress History" }: StudentDomainChartProps) {
  const chartData = [...sessions].reverse().map((s, i) => ({
    name: `S${i + 1}`,
    listening: s.domain === "listening" ? s.levelStart : null,
    speaking:  s.domain === "speaking"  ? s.levelStart : null,
    reading:   s.domain === "reading"   ? s.levelStart : null,
    writing:   s.domain === "writing"   ? s.levelStart : null,
  }));

  const isEmpty = sessions.length === 0;

  return (
    <Card className="rounded-2xl border border-border/40 shadow-sm bg-card overflow-hidden">
      <CardHeader className="pb-0 pt-6 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-black text-foreground flex items-center gap-2 tracking-tight">
            <TrendingUp className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>

          {/* Inline legend */}
          {!isEmpty && (
            <div className="flex items-center gap-3 flex-wrap justify-end">
              {DOMAINS.map((d) => (
                <span key={d} className="flex items-center gap-1.5 text-[11px] font-bold">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: DOMAIN_COLORS[d] }}
                  />
                  <span className="text-muted-foreground">{DOMAIN_LABELS[d]}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 pb-6 px-2">
        {isEmpty ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <TrendingUp className="w-10 h-10 opacity-20" />
            <p className="text-sm font-bold">No practice sessions yet</p>
            <p className="text-xs opacity-70">Chart will appear after the first session</p>
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: -8 }}>
                <defs>
                  {DOMAINS.map((d) => (
                    <linearGradient key={d} id={`grad-hist-${d}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={DOMAIN_COLORS[d]} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={DOMAIN_COLORS[d]} stopOpacity={0}    />
                    </linearGradient>
                  ))}
                </defs>

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis
                  domain={[1, 6]}
                  ticks={[1, 2, 3, 4, 5, 6]}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  formatter={(value: number, name: string) => [
                    value.toFixed(1),
                    DOMAIN_LABELS[name as keyof typeof DOMAIN_LABELS] ?? name,
                  ]}
                />
                <ReferenceLine y={5} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity={0.25} />

                {DOMAINS.map((d) => (
                  <Area
                    key={d}
                    type="monotone"
                    dataKey={d}
                    stroke={DOMAIN_COLORS[d]}
                    strokeWidth={2.5}
                    fill={`url(#grad-hist-${d})`}
                    dot={{ r: 4, fill: "var(--color-card)", strokeWidth: 2, stroke: DOMAIN_COLORS[d] }}
                    activeDot={{ r: 6, fill: DOMAIN_COLORS[d], strokeWidth: 2, stroke: "var(--color-card)" }}
                    connectNulls
                    isAnimationActive
                    animationDuration={900}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
