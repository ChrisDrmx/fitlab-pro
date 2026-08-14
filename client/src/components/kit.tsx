import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import type { Src } from "@/data/reference";

export function SectionCard({
  title, subtitle, icon, children, className, action,
}: {
  title: string; subtitle?: string; icon?: React.ReactNode;
  children: React.ReactNode; className?: string; action?: React.ReactNode;
}) {
  return (
    <Card className={cn("overflow-hidden border-card-border", className)}>
      <div className="flex flex-col gap-2 border-b border-card-border bg-secondary/40 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          {icon ? <span className="mt-0.5 shrink-0 text-primary">{icon}</span> : null}
          <div className="min-w-0">
            <h2 className="text-sm font-semibold leading-tight">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0 self-start">{action}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </Card>
  );
}

export function Field({
  label, hint, children, className, htmlFor,
}: { label: string; hint?: string; children: React.ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function NumField({
  label, value, onChange, unit, hint, step = "0.1", placeholder, testId, inputMode = "decimal",
}: {
  label: string; value: string; onChange: (v: string) => void; unit?: string;
  hint?: string; step?: string; placeholder?: string; testId?: string;
  inputMode?: "decimal" | "numeric";
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <Input
          type="number"
          inputMode={inputMode}
          step={step}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          data-testid={testId}
          className={cn("font-mono tabular-nums h-11 text-base md:h-9 md:text-sm", unit && "pr-12")}
        />
        {unit ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </div>
    </Field>
  );
}

export function Stat({
  label, value, sub, tone = "neutral", mono = true, testId,
}: {
  label: string; value: string; sub?: string;
  tone?: "neutral" | "ok" | "warn" | "bad" | "accent"; mono?: boolean; testId?: string;
}) {
  const tones = {
    neutral: "border-card-border bg-card",
    accent: "border-primary/30 bg-primary/5",
    ok: "border-primary/30 bg-primary/5",
    warn: "border-chart-2/40 bg-chart-2/10",
    bad: "border-destructive/40 bg-destructive/10",
  } as const;
  return (
    <div className={cn("rounded-md border px-3 py-2.5", tones[tone])} data-testid={testId}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-lg font-semibold leading-tight", mono && "font-mono tabular-nums")}>
        {value}
      </div>
      {sub ? <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

export function SourceLink({ src, className }: { src: Src | Src[]; className?: string }) {
  const list = Array.isArray(src) ? src : [src];
  return (
    <div className={cn("flex flex-wrap gap-x-3 gap-y-1", className)}>
      {list.map((s) => (
        <a
          key={s.url}
          href={s.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          {s.label}
          <ExternalLink className="h-3 w-3" />
        </a>
      ))}
    </div>
  );
}

export function VerdictDot({ v }: { v: "bas" | "ok" | "haut" | "na" }) {
  const map = {
    ok: "bg-primary",
    bas: "bg-chart-3",
    haut: "bg-chart-2",
    na: "bg-muted-foreground/40",
  } as const;
  const label = { ok: "Dans la fenêtre", bas: "Sous la fenêtre", haut: "Au-dessus", na: "Non évalué" }[v];
  return <span className={cn("inline-block h-2 w-2 rounded-full", map[v])} title={label} aria-label={label} />;
}
