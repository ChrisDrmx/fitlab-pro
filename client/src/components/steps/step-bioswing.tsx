import { useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field, NumField, SectionCard, Stat } from "@/components/kit";
import { AlertTriangle, CheckCircle2, Ruler, ScanLine, Sparkles } from "lucide-react";
import type { BioSwingGroundForce, BioSwingPlane, FittingData } from "@/lib/types";
import {
  ARM_LABEL, BIOSWING_CHECKLIST, GROUND_FORCE_LABEL, PLANE_LABEL, PLANE_MATCHUPS,
  POSTURE_BY_PLANE, computeBioSwing, recommendedGroundForce,
} from "@/lib/bioswing";

const planeOptions: { value: BioSwingPlane; label: string }[] = [
  { value: "Shoulder", label: "Shoulder Plane" },
  { value: "Torso", label: "Torso Plane" },
  { value: "Hip", label: "Hip / Shaft Plane" },
];

const groundOptions: { value: BioSwingGroundForce; label: string }[] = [
  { value: "RearPost", label: "Rear Post · Glide" },
  { value: "CenterPost", label: "Center Post · Spin" },
  { value: "FrontPost", label: "Front Post · Launch" },
];

export function StepBioSwing({ d, set }: { d: FittingData; set: (fn: (p: FittingData) => void) => void }) {
  const r = useMemo(() => computeBioSwing(d), [d]);
  const armLabel = r.armType ? ARM_LABEL[r.armType] : "À classer";
  const planeLabel = r.backswingPlane ? PLANE_LABEL[r.backswingPlane] : "À calculer";
  const downswingLabel = r.downswingPlane ? PLANE_LABEL[r.downswingPlane] : "À calculer";

  const setBio = <K extends keyof FittingData["bioSwing"]>(key: K, value: FittingData["bioSwing"][K]) => {
    set((x) => { x.bioSwing[key] = value; });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#bed8c1] bg-[linear-gradient(120deg,#edf7ed,#f8f5e9)] p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4e805b]">BioSwing Dynamics</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#173c28]">La biomécanique avant la prescription</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#5d7463]">
              Le module croise la morphologie, le type de bras droit et les mesures de l’avant-bras pour proposer un matchup. Le moniteur garde toujours la main sur les observations et les overrides.
            </p>
          </div>
          <Badge variant="secondary" className="gap-1 border-[#c9dfc9] bg-white/70 text-[#326143]"><Sparkles className="h-3 w-3" /> Profil sauvegardé</Badge>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Screen 1 · Morphologie" subtitle="Joueur chaussé, posture naturelle. Le seuil de ±4 pouces est appliqué automatiquement." icon={<Ruler className="h-4 w-4" />}>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumField
              label="Taille" value={d.measures.heightCm} unit="cm" step="0.5"
              onChange={(v) => set((x) => { x.measures.heightCm = v; })} testId="input-bioswing-height"
            />
            <NumField
              label="Envergure" value={d.measures.armSpanCm} unit="cm" step="0.5"
              hint="D’un bout de majeur à l’autre."
              onChange={(v) => set((x) => { x.measures.armSpanCm = v; })} testId="input-bioswing-wingspan"
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Stat label="Écart envergure − taille" value={r.differenceIn === null ? "—" : `${r.differenceIn > 0 ? "+" : ""}${r.differenceIn.toFixed(1)}\"`} sub="Conversion automatique depuis les cm" tone={r.differenceIn === null ? "neutral" : "accent"} />
            <Stat label="Plan de backswing" value={planeLabel} sub={r.autoBackswingPlane && r.backswingPlane !== r.autoBackswingPlane ? `Auto : ${PLANE_LABEL[r.autoBackswingPlane]}` : "Règle morphologique ±4\""} mono={false} tone={r.backswingPlane ? "ok" : "neutral"} testId="stat-bioswing-backswing" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Override du plan de backswing" hint="Laisse Auto pour conserver le calcul morphologique.">
              <Select value={d.bioSwing.manualBackswingPlane || "auto"} onValueChange={(v) => setBio("manualBackswingPlane", v === "auto" ? "" : v as BioSwingPlane)}>
                <SelectTrigger data-testid="select-bioswing-backswing"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="auto">Auto · règle ±4\"</SelectItem>{planeOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Forces au sol observées" hint="Optionnel : tendance Glide / Spin / Launch.">
              <Select value={d.bioSwing.groundForceType || "none"} onValueChange={(v) => setBio("groundForceType", v === "none" ? "" : v as BioSwingGroundForce)}>
                <SelectTrigger data-testid="select-bioswing-ground"><SelectValue placeholder="À observer" /></SelectTrigger>
                <SelectContent><SelectItem value="none">À observer</SelectItem>{groundOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          {d.bioSwing.groundForceType ? <p className="mt-3 text-xs text-muted-foreground">{GROUND_FORCE_LABEL[d.bioSwing.groundForceType]} : {recommendedGroundForce(d.bioSwing.groundForceType)}</p> : null}
        </SectionCard>

        <SectionCard title="Screen 2 · Avant-bras / humérus" subtitle="La comparaison donne une tendance de plan de downswing." icon={<ScanLine className="h-4 w-4" />}>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumField
              label="Longueur avant-bras" value={d.measures.forearmLengthCm} unit="cm" step="0.5"
              hint="Du coude à l’articulation du majeur."
              onChange={(v) => set((x) => { x.measures.forearmLengthCm = v; })} testId="input-bioswing-forearm"
            />
            <NumField
              label="Longueur humérus" value={d.measures.humerusLengthCm} unit="cm" step="0.5"
              hint="De l’épaule au milieu du coude."
              onChange={(v) => set((x) => { x.measures.humerusLengthCm = v; })} testId="input-bioswing-humerus"
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Stat label="Plan de downswing" value={downswingLabel} sub={r.forearmCm !== null && r.humerusCm !== null ? "Avant-bras comparé à l’humérus" : "Saisir les deux longueurs"} mono={false} tone={r.downswingPlane ? "ok" : "neutral"} testId="stat-bioswing-downswing" />
            <Field label="Override du plan de downswing">
              <Select value={d.bioSwing.manualDownswingPlane || "auto"} onValueChange={(v) => setBio("manualDownswingPlane", v === "auto" ? "" : v as BioSwingPlane)}>
                <SelectTrigger data-testid="select-bioswing-downswing"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="auto">Auto · ratio avant-bras / humérus</SelectItem>{planeOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.15fr]">
        <SectionCard title="Screen 3 · Bras droit" subtitle="Classification manuelle du moniteur ou issue d’une observation vidéo." icon={<ScanLine className="h-4 w-4" />}>
          <Field label="Type de bras droit" hint="On Top : coude monte + paume vers le sol · Side On : coude aligné · Under : coude rentre + paume vers le ciel.">
            <Select value={d.bioSwing.rightArmType || "none"} onValueChange={(v) => setBio("rightArmType", v === "none" ? "" : v as FittingData["bioSwing"]["rightArmType"])}>
              <SelectTrigger data-testid="select-bioswing-arm"><SelectValue placeholder="À classer" /></SelectTrigger>
              <SelectContent><SelectItem value="none">À classer</SelectItem><SelectItem value="OnTop">On Top · Across the line</SelectItem><SelectItem value="SideOn">Side On · Down the line</SelectItem><SelectItem value="Under">Under · Laid off</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="Observation du moniteur" className="mt-4">
            <Textarea value={d.bioSwing.rightArmObservation} onChange={(e) => setBio("rightArmObservation", e.target.value)} rows={5} placeholder="Coude, paume, trajectoire du bras, photo ou vidéo observée…" data-testid="input-bioswing-arm-note" />
          </Field>
        </SectionCard>

        <SectionCard title="Résultat · Matchup recommandé" subtitle="Le résultat reste modifiable et doit être validé par le moniteur." icon={<CheckCircle2 className="h-4 w-4" />}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Type de bras" value={armLabel} sub="Observation Right Arm" mono={false} tone={r.armType ? "accent" : "neutral"} />
            <Stat label="Hinge" value={r.matchup?.hinge ?? "À déterminer"} sub="Selon le type de bras" mono={false} tone={r.matchup ? "accent" : "neutral"} />
            <Stat label="Release" value={r.matchup?.release ?? "À déterminer"} sub="À tester sur quelques swings" mono={false} tone={r.matchup ? "accent" : "neutral"} />
          </div>
          {r.backswingPlane && r.armType ? <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold">{PLANE_LABEL[r.backswingPlane]} × {ARM_LABEL[r.armType]}</span><Badge variant="secondary">{PLANE_MATCHUPS[r.backswingPlane][r.armType]}</Badge></div><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Posture : {POSTURE_BY_PLANE[r.backswingPlane].posture}. Point d’attention : {POSTURE_BY_PLANE[r.backswingPlane].attention}.</p></div> : <p className="mt-4 rounded-md border border-dashed p-3 text-sm text-muted-foreground">Complète le plan et le type de bras pour afficher le matchup.</p>}
          {r.warning ? <Alert className="mt-3 border-chart-2/40 bg-chart-2/10"><AlertTriangle className="h-4 w-4" /><AlertDescription className="text-xs">{r.warning}</AlertDescription></Alert> : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Field label="Hinge override"><Select value={d.bioSwing.manualHinge || "auto"} onValueChange={(v) => setBio("manualHinge", v === "auto" ? "" : v)}><SelectTrigger data-testid="select-bioswing-hinge"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="auto">Auto · recommandé</SelectItem><SelectItem value="Diagonal Hinge">Diagonal Hinge</SelectItem><SelectItem value="Horizontal Hinge">Horizontal Hinge</SelectItem><SelectItem value="Vertical Hinge">Vertical Hinge</SelectItem></SelectContent></Select></Field>
            <Field label="Position du club"><Select value={d.bioSwing.manualClubPosition || "auto"} onValueChange={(v) => setBio("manualClubPosition", v === "auto" ? "" : v)}><SelectTrigger data-testid="select-bioswing-position"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="auto">Auto · recommandée</SelectItem><SelectItem value="Across the line">Across the line</SelectItem><SelectItem value="Down the line">Down the line</SelectItem><SelectItem value="Laid off">Laid off</SelectItem></SelectContent></Select></Field>
            <Field label="Release"><Select value={d.bioSwing.manualRelease || "auto"} onValueChange={(v) => setBio("manualRelease", v === "auto" ? "" : v)}><SelectTrigger data-testid="select-bioswing-release"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="auto">Auto · recommandé</SelectItem><SelectItem value="Cover Release">Cover Release</SelectItem><SelectItem value="Corner Release">Corner Release</SelectItem><SelectItem value="Extension Release">Extension Release</SelectItem></SelectContent></Select></Field>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="Checklist moniteur" subtitle="Chaque validation est enregistrée dans la fiche joueur.">
          <div className="grid gap-2 sm:grid-cols-2">
            {BIOSWING_CHECKLIST.map((item) => {
              const checked = Boolean(d.bioSwing.checklist[item.id]);
              return <label key={item.id} className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${checked ? "border-primary/30 bg-primary/5" : "border-card-border bg-card"}`}><Checkbox checked={checked} onCheckedChange={(value) => set((x) => { x.bioSwing.checklist[item.id] = Boolean(value); })} data-testid={`checkbox-bioswing-${item.id}`} /><span className="min-w-0"><span className="block text-sm font-medium">{item.label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{item.action}</span></span></label>;
            })}
          </div>
        </SectionCard>
        <SectionCard title="Notes BioSwing" subtitle="Hypothèses, sensations et décisions à conserver dans le profil.">
          <Textarea value={d.bioSwing.notes} onChange={(e) => setBio("notes", e.target.value)} rows={9} placeholder="Ce que le joueur ressent, ce qui a été confirmé ou doit être vérifié à la prochaine séance…" data-testid="input-bioswing-notes" />
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">Source de la logique : {"FitLab_Pro_BioSwing_Dynamics_Module.xlsx"}. Une classification vidéo assistée pourra être branchée dans une prochaine étape, sans remplacer la validation du moniteur.</p>
        </SectionCard>
      </div>
    </div>
  );
}
