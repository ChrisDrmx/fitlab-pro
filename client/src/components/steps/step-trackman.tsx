import { SectionCard, Field, VerdictDot, SourceLink, Stat } from "@/components/kit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Radar } from "lucide-react";
import { CLUB_LABEL, IRON_CLUBS, WOOD_CLUBS } from "@/lib/types";
import type { ClubKey, FittingData, TrackmanRow } from "@/lib/types";
import { evalTrackmanRow, spinLoftCheck, computeGapping, flexFromIron7, flexFromDriver, num, fmt } from "@/lib/engine";
import { TrackmanPhotoImport } from "./trackman-photo";
import { TOUR_SRC, WINDOW_SRC, FLEX_IRON_SRC } from "@/data/reference";

const ALL: ClubKey[] = [...WOOD_CLUBS, ...IRON_CLUBS];

const FIELDS: { key: keyof TrackmanRow; label: string; unit: string; step?: string }[] = [
  { key: "clubSpeed", label: "Vit. club", unit: "mph" },
  { key: "ballSpeed", label: "Vit. balle", unit: "mph" },
  { key: "smash", label: "Smash", unit: "", step: "0.01" },
  { key: "launch", label: "Départ", unit: "°" },
  { key: "spin", label: "Backspin", unit: "tr/min", step: "10" },
  { key: "attackAngle", label: "Angle d'attaque", unit: "°" },
  { key: "dynamicLoft", label: "Loft dyn.", unit: "°" },
  { key: "spinLoft", label: "Spin loft", unit: "°" },
  { key: "clubPath", label: "Club path", unit: "°" },
  { key: "faceAngle", label: "Face angle", unit: "°" },
  { key: "faceToPath", label: "Face-to-path", unit: "°" },
  { key: "height", label: "Hauteur max", unit: "m" },
  { key: "landingAngle", label: "Angle de chute", unit: "°" },
  { key: "carry", label: "Carry", unit: "m" },
  { key: "total", label: "Total", unit: "m" },
  { key: "sideCarry", label: "Écart latéral", unit: "m" },
];

export function StepTrackman({ d, set }: { d: FittingData; set: (fn: (p: FittingData) => void) => void }) {
  const add = () => set((x) => {
    const used = new Set(x.trackman.map((t) => t.club));
    const next = ALL.find((c) => !used.has(c)) ?? "7i";
    x.trackman.push({
      club: next, clubSpeed: "", ballSpeed: "", smash: "", launch: "", spin: "",
      attackAngle: "", dynamicLoft: "", spinLoft: "", faceAngle: "", clubPath: "",
      faceToPath: "", height: "", landingAngle: "", carry: "", total: "", sideCarry: "",
      impactHoriz: "", impactVert: "",
    });
  });

  const gaps = computeGapping(d.trackman);
  const iron7 = d.trackman.find((r) => r.club === "7i");
  const driver = d.trackman.find((r) => r.club === "DR");
  const flexIron = flexFromIron7(num(iron7?.clubSpeed ?? null));
  const flexDriver = flexFromDriver(num(driver?.clubSpeed ?? null));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Flex d'après le fer 7" value={flexIron ?? "—"}
          sub={iron7?.clubSpeed ? `${iron7.clubSpeed} mph de vitesse de tête` : "Saisir la vitesse de club du fer 7"}
          mono={false} tone={flexIron ? "accent" : "neutral"} testId="stat-flex-iron"
        />
        <Stat
          label="Flex d'après le driver" value={flexDriver ?? "—"}
          sub={driver?.clubSpeed ? `${driver.clubSpeed} mph — table driver True Spec` : "Saisir la vitesse de club du driver"}
          mono={false} tone={flexDriver ? "accent" : "neutral"} testId="stat-flex-driver"
        />
        <Stat
          label="Clubs mesurés" value={String(d.trackman.length)}
          sub="Ajouter le driver, un fer long, un fer médian et un wedge"
          testId="stat-club-count"
        />
      </div>

      <SectionCard
        title="Données Trackman par club"
        subtitle="Photographiez l’écran Trackman pour un remplissage automatique, ou saisissez la moyenne des coups retenus. Les valeurs hors fenêtre cible sont signalées."
        icon={<Radar className="h-4 w-4" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <TrackmanPhotoImport
              onImport={(rows) =>
                set((x) => {
                  for (const r of rows) {
                    const i = x.trackman.findIndex((t) => t.club === r.club);
                    if (i >= 0) x.trackman[i] = { ...x.trackman[i], ...r };
                    else x.trackman.push(r);
                  }
                })
              }
            />
            <Button size="sm" variant="outline" className="gap-1.5" onClick={add} data-testid="button-add-tm"><Plus className="h-3.5 w-3.5" /> Club</Button>
          </div>
        }
      >
        {!d.trackman.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucune mesure. Ajoute un club pour saisir la session.
          </p>
        ) : (
          <div className="space-y-4">
            {d.trackman.map((row, i) => {
              const metrics = evalTrackmanRow(row);
              const sl = spinLoftCheck(row);
              const byKey = Object.fromEntries(metrics.map((m) => [m.key, m]));
              const verdictFor = (k: keyof TrackmanRow) => {
                const map: Record<string, string> = {
                  clubSpeed: "clubSpeed", ballSpeed: "ballSpeed", smash: "smash", launch: "launch",
                  spin: "spin", attackAngle: "attack", height: "height", landingAngle: "landing",
                  faceToPath: "faceToPath", carry: "carry",
                };
                const m = byKey[map[k as string] ?? ""];
                return m?.verdict ?? "na";
              };

              return (
                <div key={i} className="rounded-md border border-card-border bg-secondary/30 p-3" data-testid={`row-tm-${i}`}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <Select value={row.club} onValueChange={(v) => set((x) => { x.trackman[i].club = v as ClubKey; })}>
                      <SelectTrigger className="h-9 w-[150px] font-medium" data-testid={`select-tm-club-${i}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{ALL.map((k) => <SelectItem key={k} value={k}>{CLUB_LABEL[k]}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="flex flex-wrap items-center gap-2">
                      {sl.computed !== null ? (
                        <Badge variant="outline" className="font-mono text-[11px]">
                          spin loft calculé {fmt(sl.computed)}°
                        </Badge>
                      ) : null}
                      <Select value={row.impactHoriz} onValueChange={(v) => set((x) => { x.trackman[i].impactHoriz = v as TrackmanRow["impactHoriz"]; })}>
                        <SelectTrigger className="h-9 w-[130px] text-xs" data-testid={`select-impact-h-${i}`}><SelectValue placeholder="Impact latéral" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="talon">Impact talon</SelectItem>
                          <SelectItem value="centre">Impact centré</SelectItem>
                          <SelectItem value="toe">Impact toe</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={row.impactVert} onValueChange={(v) => set((x) => { x.trackman[i].impactVert = v as TrackmanRow["impactVert"]; })}>
                        <SelectTrigger className="h-9 w-[130px] text-xs" data-testid={`select-impact-v-${i}`}><SelectValue placeholder="Impact vertical" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bas">Impact bas</SelectItem>
                          <SelectItem value="centre">Impact centré</SelectItem>
                          <SelectItem value="haut">Impact haut</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => set((x) => { x.trackman.splice(i, 1); })}
                        data-testid={`button-remove-tm-${i}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {FIELDS.map((f) => {
                      const v = verdictFor(f.key) as "bas" | "ok" | "haut" | "na";
                      const m = byKey[({ clubSpeed: "clubSpeed", ballSpeed: "ballSpeed", smash: "smash", launch: "launch", spin: "spin", attackAngle: "attack", height: "height", landingAngle: "landing", faceToPath: "faceToPath", carry: "carry" } as Record<string, string>)[f.key as string] ?? ""];
                      return (
                        <Field
                          key={String(f.key)}
                          label={f.label}
                          hint={m?.window ? `cible ${m.window[0]}–${m.window[1]}${f.unit}` : m?.tour ? `Tour ${m.tour}${f.unit}` : undefined}
                        >
                          <div className="relative">
                            <Input
                              type="number" inputMode="decimal" step={f.step ?? "0.1"}
                              value={String(row[f.key] ?? "")}
                              onChange={(e) => set((x) => { (x.trackman[i] as unknown as Record<string, unknown>)[f.key as string] = e.target.value; })}
                              className="h-10 pr-6 font-mono tabular-nums md:h-9"
                              data-testid={`input-tm-${i}-${String(f.key)}`}
                            />
                            {v !== "na" ? (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2"><VerdictDot v={v} /></span>
                            ) : null}
                          </div>
                        </Field>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <SourceLink src={[TOUR_SRC, WINDOW_SRC, FLEX_IRON_SRC]} className="mt-4" />
      </SectionCard>

      {gaps.length ? (
        <SectionCard title="Gapping des distances" subtitle="Écart de carry entre clubs consécutifs. Cible : 10 à 15 m.">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Transition</th>
                  <th className="pb-2 pr-3 font-medium">Carry</th>
                  <th className="pb-2 pr-3 font-medium">Écart</th>
                  <th className="pb-2 font-medium">Lecture</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {gaps.map((g, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0" data-testid={`row-gap-${i}`}>
                    <td className="py-2 pr-3 font-sans">{g.from} → {g.to}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{g.carryFrom.toFixed(0)} → {g.carryTo.toFixed(0)} m</td>
                    <td className="py-2 pr-3 font-semibold">{g.gap.toFixed(0)} m</td>
                    <td className="py-2 font-sans">
                      <Badge variant={g.verdict === "ok" ? "secondary" : "destructive"} className="text-[11px]">
                        {g.verdict === "ok" ? "Correct" : g.verdict === "trou" ? "Trou de distance" : "Écart trop serré"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
