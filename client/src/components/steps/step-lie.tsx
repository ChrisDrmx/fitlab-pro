import { SectionCard, Field, Stat, SourceLink } from "@/components/kit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Gauge } from "lucide-react";
import { CLUB_LABEL, IRON_CLUBS, WOOD_CLUBS } from "@/lib/types";
import type { ClubKey, FittingData, LieMark } from "@/lib/types";
import { LIE_MARKS, LIE_LOGIC_NOTE, STATIC_LIE_SRC } from "@/data/reference";
import { computeDynamicLie, dynamicLieConsensus, computeStatic, fmt } from "@/lib/engine";

const ALL: ClubKey[] = [...IRON_CLUBS, ...WOOD_CLUBS];

/** Schéma de semelle avec la zone de contact mise en évidence. */
function SoleDiagram({ mark }: { mark: LieMark }) {
  const zone =
    mark === "toe" ? { x: 104, w: 26 } :
    mark === "toe_slight" ? { x: 88, w: 26 } :
    mark === "center" ? { x: 62, w: 26 } :
    mark === "heel_slight" ? { x: 36, w: 26 } :
    mark === "heel" ? { x: 18, w: 26 } : null;

  return (
    <svg viewBox="0 0 150 44" className="h-11 w-full" role="img" aria-label="Schéma de semelle de fer">
      <defs>
        <linearGradient id="soleg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.10" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.22" />
        </linearGradient>
      </defs>
      <path d="M14 30 Q16 14 40 12 L118 12 Q134 13 136 24 Q137 32 126 32 L24 32 Q14 32 14 30 Z" fill="url(#soleg)" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.5" />
      {zone ? (
        <rect x={zone.x} y={13} width={zone.w} height={18} rx={3} className="fill-primary" opacity="0.85" />
      ) : null}
      <text x="18" y="42" className="fill-current text-[8px]" opacity="0.55">talon</text>
      <text x="118" y="42" className="fill-current text-[8px]" opacity="0.55">toe</text>
    </svg>
  );
}

export function StepLie({ d, set }: { d: FittingData; set: (fn: (p: FittingData) => void) => void }) {
  const rows = computeDynamicLie(d);
  const consensus = dynamicLieConsensus(rows);
  const stat = computeStatic(d);

  const add = () => set((x) => {
    const used = new Set(x.lieTests.map((t) => t.club));
    // Ordre de séance : fer médian d'abord, puis fer long et wedge.
    const order = ["7i", "6i", "4i", "PW", "SW", "5i", "8i", "9i", "3i", "GW", "LW", "DR", "3W", "5W", "7W", "H3", "H4", "H5"] as const;
    const next = (order.find((c) => !used.has(c as never)) ?? ALL.find((c) => !used.has(c)) ?? "7i") as never;
    x.lieTests.push({ club: next, mark: "", shotsHitLeft: "", correctionDeg: "", note: "" });
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
      <SectionCard
        title="Test de lie dynamique (lie board)"
        subtitle="Frappe 5 à 8 balles par club sur la lie board avec du ruban sur la semelle, puis relève la position de la trace."
        icon={<Gauge className="h-4 w-4" />}
        action={<Button size="sm" variant="outline" className="gap-1.5" onClick={add} data-testid="button-add-lie"><Plus className="h-3.5 w-3.5" /> Club</Button>}
      >
        {!d.lieTests.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Ajoute au moins un fer médian (fer 6 ou 7) : c'est la référence du réglage de lie pour toute la série.
          </p>
        ) : (
          <div className="space-y-3">
            {d.lieTests.map((t, i) => {
              const res = rows[i];
              return (
                <div key={i} className="rounded-md border border-card-border bg-secondary/30 p-3" data-testid={`row-lie-${i}`}>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <Select value={t.club} onValueChange={(v) => set((x) => { x.lieTests[i].club = v as ClubKey; })}>
                      <SelectTrigger className="h-9 w-[150px] font-medium" data-testid={`select-lie-club-${i}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{ALL.map((k) => <SelectItem key={k} value={k}>{CLUB_LABEL[k]}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Badge variant={res.correction === 0 ? "secondary" : "default"} className="font-mono" data-testid={`badge-lie-${i}`}>
                        {res.correctionLabel}
                      </Badge>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => set((x) => { x.lieTests.splice(i, 1); })}
                        data-testid={`button-remove-lie-${i}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Position de la trace sur la semelle</div>
                      <div className="grid grid-cols-5 gap-1">
                        {LIE_MARKS.map((mk) => (
                          <button
                            key={mk.key}
                            type="button"
                            data-testid={`button-mark-${i}-${mk.key}`}
                            onClick={() => set((x) => { x.lieTests[i].mark = mk.key as LieMark; })}
                            title={mk.label}
                            className={`rounded-md border px-1 py-2 text-[10px] leading-tight transition-colors ${
                              t.mark === mk.key
                                ? "border-primary bg-primary/10 font-medium text-foreground"
                                : "border-border text-muted-foreground hover:bg-secondary"
                            }`}
                          >
                            {mk.key === "toe" ? "Toe ++" : mk.key === "toe_slight" ? "Toe +" : mk.key === "center" ? "Centre" : mk.key === "heel_slight" ? "Talon +" : "Talon ++"}
                          </button>
                        ))}
                      </div>
                      <div className="text-muted-foreground"><SoleDiagram mark={t.mark} /></div>
                      {res.hint ? <p className="text-[11px] leading-snug text-muted-foreground">{res.hint}</p> : null}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Correction manuelle" hint="Écrase la lecture automatique (°, + = upright)">
                        <Input
                          type="number" step="0.5" inputMode="decimal"
                          value={t.correctionDeg}
                          onChange={(e) => set((x) => { x.lieTests[i].correctionDeg = e.target.value; })}
                          className="h-10 font-mono md:h-9"
                          data-testid={`input-lie-manual-${i}`}
                        />
                      </Field>
                      <Field label="Balles à gauche / 8" hint="Nombre de départs à gauche observés">
                        <Input
                          type="number" inputMode="numeric"
                          value={t.shotsHitLeft}
                          onChange={(e) => set((x) => { x.lieTests[i].shotsHitLeft = e.target.value; })}
                          className="h-10 font-mono md:h-9"
                        />
                      </Field>
                      <Field label="Note" className="sm:col-span-2">
                        <Input
                          value={t.note}
                          onChange={(e) => set((x) => { x.lieTests[i].note = e.target.value; })}
                          className="h-10 md:h-9"
                        />
                      </Field>
                      <div className="sm:col-span-2 font-mono text-[11px] text-muted-foreground">
                        Lie standard {CLUB_LABEL[t.club]} : {fmt(res.standardLie)}° → cible {fmt(res.targetLie)}°
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <div className="space-y-4">
        <SectionCard title="Synthèse du lie">
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat
              label="Lie dynamique retenu"
              value={consensus === null ? "—" : consensus === 0 ? "Standard" : `${Math.abs(consensus)}° ${consensus > 0 ? "UPRIGHT" : "FLAT"}`}
              sub="Moyenne des clubs testés, arrondie au demi-degré"
              tone={consensus === null ? "neutral" : "accent"}
              testId="stat-lie-dyn"
            />
            <Stat
              label="Lie statique (table)"
              value={stat.lieCorrectionLabel}
              sub="Wrist-to-floor × taille"
              tone="neutral"
              testId="stat-lie-static"
            />
          </div>
          {consensus !== null && stat.lieCorrection !== null && Math.abs(consensus - stat.lieCorrection) >= 1 ? (
            <div className="mt-3 rounded-md border border-chart-2/40 bg-chart-2/10 p-3 text-xs leading-relaxed">
              <span className="font-medium">Écart statique / dynamique. </span>
              La table statique donne {stat.lieCorrectionLabel} alors que la lie board mesure{" "}
              {consensus === 0 ? "standard" : `${Math.abs(consensus)}° ${consensus > 0 ? "UPRIGHT" : "FLAT"}`}. Le lie dynamique prime :
              il reflète la position réelle du club à l'impact, une fois la posture et la libération du joueur prises en compte.
            </div>
          ) : null}
          <SourceLink src={STATIC_LIE_SRC} className="mt-3" />
        </SectionCard>

        <SectionCard title="Méthode de lecture">
          <p className="text-xs leading-relaxed text-muted-foreground">{LIE_LOGIC_NOTE}</p>
          <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <li>· Utiliser une lie board rigide et du ruban adhésif frais sur la semelle à chaque club.</li>
            <li>· Ne retenir que les impacts propres, centrés sur la face : un contact au talon ou au toe fausse la lecture.</li>
            <li>· Valider la correction sur le fer 6 ou 7, puis contrôler sur un fer long et un wedge.</li>
            <li>· Sur les têtes en fonte ou en acier inoxydable non ajustable, vérifier la plage de flexion tolérée par le fabricant avant réglage.</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
