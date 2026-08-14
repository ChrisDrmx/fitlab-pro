import { SectionCard, Field, NumField, Stat, SourceLink } from "@/components/kit";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Ruler, Hand, AlertTriangle, Info } from "lucide-react";
import type { FittingData } from "@/lib/types";
import { computeStatic, fmt, cmToIn } from "@/lib/engine";
import {
  PING_SRC, PING_COLORS_CURRENT_SRC, STATIC_LIE_SRC, GRIP_SIZE_SRC, GLOVE_SRC,
  ARM_SPAN_NOTE, GRIP_BUILDUP_NOTE, GLOVE_NOTE,
} from "@/data/reference";

export function StepMeasures({ d, set }: { d: FittingData; set: (fn: (p: FittingData) => void) => void }) {
  const m = d.measures;
  const r = computeStatic(d);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <SectionCard
          title="Mesures du corps"
          subtitle="Chaussures plates, sol dur, posture naturelle, bras relâchés."
          icon={<Ruler className="h-4 w-4" />}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <NumField
              label="Taille" value={m.heightCm} unit="cm" step="0.5"
              onChange={(v) => set((x) => { x.measures.heightCm = v; })}
              testId="input-height"
            />
            <NumField
              label="Wrist-to-floor" value={m.wristToFloorCm} unit="cm" step="0.5"
              hint="Du pli du poignet de la main avant jusqu'au sol, bras relâché."
              onChange={(v) => set((x) => { x.measures.wristToFloorCm = v; })}
              testId="input-wtf"
            />
            <NumField
              label="Envergure" value={m.armSpanCm} unit="cm" step="0.5"
              hint="Bras écartés à l'horizontale, d'un bout de majeur à l'autre."
              onChange={(v) => set((x) => { x.measures.armSpanCm = v; })}
              testId="input-armspan"
            />
            <Field label="Chaussures lors de la mesure">
              <Select value={m.shoeSole} onValueChange={(v) => set((x) => { x.measures.shoeSole = v as "plate" | "crampons"; })}>
                <SelectTrigger className="h-11 md:h-9" data-testid="select-shoe"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="plate">Semelle plate</SelectItem>
                  <SelectItem value="crampons">Chaussures de golf</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          {r.wtfIn !== null ? (
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              Wrist-to-floor = {fmt(r.wtfIn, 2)} pouces
              {r.heightBand ? ` · bande de taille : ${r.heightBand === "small" ? "petite" : r.heightBand === "mid" ? "moyenne" : "grande"}` : ""}
            </p>
          ) : null}
          <SourceLink src={[PING_SRC, STATIC_LIE_SRC]} className="mt-3" />
        </SectionCard>

        <SectionCard title="Mains, grip et gant" icon={<Hand className="h-4 w-4" />}>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumField
              label="Longueur de main" value={m.handLengthCm} unit="cm" step="0.1"
              hint="Du pli du poignet au bout du majeur, main du gant."
              onChange={(v) => set((x) => { x.measures.handLengthCm = v; })}
              testId="input-handlength"
            />
            <NumField
              label="Tour de main" value={m.handCircumferenceCm} unit="cm" step="0.1"
              hint="Au niveau des articulations, pouce exclu."
              onChange={(v) => set((x) => { x.measures.handCircumferenceCm = v; })}
              testId="input-handcirc"
            />
            <NumField
              label="Longueur du majeur" value={m.middleFingerCm} unit="cm" step="0.1"
              hint="Mesure de contrôle pour arbitrer Standard / Midsize."
              onChange={(v) => set((x) => { x.measures.middleFingerCm = v; })}
              testId="input-finger"
            />
            <Field label="Taille de gant actuelle">
              <Select value={m.gloveSizeCurrent} onValueChange={(v) => set((x) => { x.measures.gloveSizeCurrent = v; })}>
                <SelectTrigger className="h-11 md:h-9" data-testid="select-glove-current"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {["S", "M", "ML", "L", "XL", "XXL", "Cadet M", "Cadet ML", "Cadet L", "Cadet XL"].map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          {m.handLengthCm ? (
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              Longueur de main = {fmt(cmToIn(parseFloat(m.handLengthCm.replace(",", "."))), 2)} pouces
            </p>
          ) : null}
          <SourceLink src={[GRIP_SIZE_SRC, GLOVE_SRC]} className="mt-3" />
        </SectionCard>
      </div>

      <div className="space-y-4">
        <SectionCard title="Lecture statique automatique" subtitle="Calculé en direct à partir des mesures saisies.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat
              label="Lie statique" value={r.lieCorrectionLabel}
              sub={r.wtfIn !== null ? `Table wrist-to-floor × taille` : "Saisir taille et wrist-to-floor"}
              tone={r.lieCorrection === null ? "neutral" : r.lieCorrection === 0 ? "ok" : "accent"}
              testId="stat-lie"
            />
            <Stat
              label="Longueur de club" value={r.lengthAdjLabel}
              sub={r.iron6LengthIn ? `Fer 6 ≈ ${fmt(r.iron6LengthIn, 2)}" · Driver ≈ ${fmt(r.driverLengthIn, 2)}"` : "Saisir la taille"}
              tone={r.lengthAdjIn === null ? "neutral" : r.lengthAdjIn === 0 ? "ok" : "accent"}
              testId="stat-length"
            />
            <div className="rounded-md border border-card-border bg-card px-3 py-2.5" data-testid="stat-ping">
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Code couleur PING</div>
              <div className="mt-1 flex items-center gap-2">
                {r.pingColorCurrent ? (
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-border"
                    style={{ backgroundColor: r.pingColorCurrent.hex }}
                  />
                ) : null}
                <span className="text-lg font-semibold leading-tight">
                  {r.pingColorCurrent ? `${r.pingColorCurrent.fr}` : "—"}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                {r.pingColorCurrent
                  ? `Système actuel 1°/couleur (${r.pingColorCurrent.color}). Équivalent historique 0,75°/couleur : ${r.pingColorLegacy?.fr ?? "—"}.`
                  : "Saisir les mesures"}
              </div>
            </div>
            <Stat
              label="Taille de grip" value={r.gripSize ?? "—"}
              sub={r.gripGloveHint ?? "Saisir la longueur de main"}
              mono={false} tone={r.gripSize ? "accent" : "neutral"} testId="stat-grip"
            />
            <Stat
              label="Taille de gant" value={r.gloveSize ? `${r.gloveSize}${r.gloveCadet ? " Cadet" : ""}` : "—"}
              sub={r.gloveCadet ? "Paume large / doigts courts → Cadet" : "FootJoy — longueur & tour de main"}
              mono={false} tone={r.gloveSize ? "accent" : "neutral"} testId="stat-glove"
            />
            <Stat
              label="Ape index" value={r.apeRatio ? fmt(r.apeRatio, 3) : "—"}
              sub={r.apeReading ? r.apeReading.label : "Saisir l'envergure"}
              tone={r.apeReading?.tone === "warn" ? "warn" : r.apeRatio ? "ok" : "neutral"}
              testId="stat-ape"
            />
          </div>

          {r.warnings.map((w) => (
            <Alert key={w} className="mt-3 border-chart-2/40 bg-chart-2/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">{w}</AlertDescription>
            </Alert>
          ))}
          {r.apeReading?.tone === "warn" ? (
            <Alert className="mt-3">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">{r.apeReading.hint}</AlertDescription>
            </Alert>
          ) : null}
          <SourceLink src={PING_COLORS_CURRENT_SRC} className="mt-3" />
        </SectionCard>

        <SectionCard title="Notes de protocole">
          <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
            <p><span className="font-medium text-foreground">Envergure. </span>{ARM_SPAN_NOTE}</p>
            <p><span className="font-medium text-foreground">Grip et build-up. </span>{GRIP_BUILDUP_NOTE}</p>
            <p><span className="font-medium text-foreground">Gant. </span>{GLOVE_NOTE}</p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
