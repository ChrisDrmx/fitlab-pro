import { SectionCard, Stat, SourceLink } from "@/components/kit";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { FileDown, Stethoscope, ListChecks } from "lucide-react";
import type { FittingData } from "@/lib/types";
import { buildDiagnosis } from "@/lib/engine";
import { FLEX_DRIVER_SRC, FLEX_IRON_SRC, PING_SRC, GRIP_SIZE_SRC } from "@/data/reference";

const PRIORITY: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  haute: { label: "Priorité haute", variant: "default" },
  moyenne: { label: "Priorité moyenne", variant: "secondary" },
  basse: { label: "Confort", variant: "outline" },
};

export function StepDiagnosis({
  d, set, onExport, exporting,
}: {
  d: FittingData;
  set: (fn: (p: FittingData) => void) => void;
  onExport: () => void;
  exporting: boolean;
}) {
  const dx = buildDiagnosis(d);
  const excluded = d.excludedInsights ?? [];
  const isOn = (id: string) => !excluded.includes(id);
  const nOn = dx.insights.filter((it) => isOn(it.id)).length;
  const toggle = (id: string) =>
    set((x) => {
      const cur = x.excludedInsights ?? [];
      x.excludedInsights = cur.includes(id) ? cur.filter((v) => v !== id) : [...cur, id];
    });
  const setAll = (on: boolean) =>
    set((x) => { x.excludedInsights = on ? [] : dx.insights.map((it) => it.id); });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Lie recommandé" value={dx.summary.lie} sub={dx.summary.lieSource} mono={false} tone="accent" testId="stat-dx-lie" />
        <Stat label="Longueur" value={dx.summary.length} sub={dx.summary.lengthSource} mono={false} tone="accent" testId="stat-dx-length" />
        <Stat label="Shaft" value={dx.summary.shaft} sub={dx.summary.shaftSource} mono={false} tone="accent" testId="stat-dx-shaft" />
        <Stat label="Grip / gant" value={dx.summary.grip} sub={dx.summary.gripSource} mono={false} tone="accent" testId="stat-dx-grip" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Constats du diagnostic"
          subtitle={`${nOn} constat${nOn > 1 ? "s" : ""} sur ${dx.insights.length} seront imprimés dans le rapport client. Décochez ceux à ne pas transmettre.`}
          icon={<Stethoscope className="h-4 w-4" />}
          action={
            dx.insights.length ? (
              <div className="flex gap-1 -ml-2 sm:ml-0">
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setAll(true)} data-testid="button-insights-all">
                  Tout cocher
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setAll(false)} data-testid="button-insights-none">
                  Tout décocher
                </Button>
              </div>
            ) : undefined
          }
        >
          {!dx.insights.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun constat pour l'instant. Complète les mesures statiques, le test de lie et au moins une ligne Trackman.
            </p>
          ) : (
            <div className="space-y-3">
              {dx.insights.map((it, i) => (
                <div
                  key={it.id}
                  className={`rounded-md border p-3 transition-opacity ${isOn(it.id) ? "border-card-border bg-secondary/30" : "border-dashed border-card-border bg-transparent opacity-55"}`}
                  data-testid={`insight-${i}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Checkbox
                      checked={isOn(it.id)}
                      onCheckedChange={() => toggle(it.id)}
                      aria-label={`Inclure « ${it.title} » dans le rapport`}
                      data-testid={`checkbox-insight-${i}`}
                    />
                    <Badge variant={PRIORITY[it.priority]?.variant ?? "outline"} className="text-[11px]">
                      {PRIORITY[it.priority]?.label ?? it.priority}
                    </Badge>
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{it.area}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium leading-snug">{it.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{it.detail}</p>
                  {it.action ? (
                    <p className="mt-2 text-xs leading-relaxed">
                      <span className="font-medium">Action. </span>{it.action}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <div className="space-y-4">
          <SectionCard
            title="Prescription de série"
            subtitle="À transposer dans le bon de commande constructeur."
            icon={<ListChecks className="h-4 w-4" />}
          >
            <dl className="divide-y divide-border text-sm">
              {dx.spec.map((s) => (
                <div key={s.label} className="flex items-start justify-between gap-4 py-2" data-testid={`spec-${s.label.slice(0, 10)}`}>
                  <dt className="text-muted-foreground">{s.label}</dt>
                  <dd className="text-right font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
            <SourceLink src={[FLEX_IRON_SRC, FLEX_DRIVER_SRC, PING_SRC, GRIP_SIZE_SRC]} className="mt-3" />
          </SectionCard>

          <SectionCard title="Notes du fitter" subtitle="Reprises telles quelles dans le rapport PDF remis au joueur.">
            <Textarea
              value={d.fitterNotes}
              onChange={(e) => set((x) => { x.fitterNotes = e.target.value; })}
              rows={7}
              placeholder="Observations de séance, essais de têtes et de shafts, ressenti du joueur, plan de suivi…"
              data-testid="input-fitter-notes"
            />
            <Separator className="my-4" />
            <Button onClick={onExport} disabled={exporting} className="w-full gap-2" data-testid="button-export-pdf">
              <FileDown className="h-4 w-4" />
              {exporting ? "Génération du rapport…" : "Exporter le rapport client (PDF)"}
            </Button>
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
              Le rapport reprend l'identité du joueur, les mesures, la synthèse du lie, les données Trackman, le gapping,
              la prescription de série et tes notes.
            </p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
