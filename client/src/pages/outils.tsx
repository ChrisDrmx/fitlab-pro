import { useState } from "react";
import { Layout, PageHeader } from "@/components/layout";
import { SectionCard, Field, NumField, Stat, SourceLink } from "@/components/kit";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calculator, Ruler, Hand, Gauge, ArrowLeftRight } from "lucide-react";
import { num } from "@/lib/engine";
import {
  GRIP_SIZE_TABLE, GRIP_SIZE_SRC, GLOVE_TABLE, GLOVE_SRC, STATIC_LIE_TABLE, STATIC_LIE_SRC,
  PING_COLORS_CURRENT, PING_SRC, FLEX_BY_IRON7_SPEED, FLEX_IRON_SRC, FLEX_BY_DRIVER_SPEED,
  FLEX_DRIVER_SRC, LIE_YARDS_PER_DEGREE, LIE_M_PER_DEGREE, LIE_DEVIATION_SRC, LIE_BOARD_SCALE,
  LIE_BOARD_SRC, AMATEUR_BENCHMARK, IN,
} from "@/data/reference";

export default function Outils() {
  /* Convertisseur */
  const [cm, setCm] = useState("");
  const [inch, setInch] = useState("");

  /* Lie board */
  const [markMm, setMarkMm] = useState("");
  const [rocker, setRocker] = useState("6.35");
  const [outdoor, setOutdoor] = useState("non");
  const mm = num(markMm);
  const rk = num(rocker);
  let lieErr = mm !== null && rk ? mm / rk : null;
  if (lieErr !== null && outdoor === "oui") lieErr = lieErr - 1;
  const lieErrRounded = lieErr === null ? null : Math.round(lieErr * 2) / 2;

  /* Déviation */
  const [devDeg, setDevDeg] = useState("");
  const dd = num(devDeg);

  /* Longueur ↔ lie */
  const [lenChange, setLenChange] = useState("");
  const lc = num(lenChange);

  return (
    <Layout>
      <PageHeader title="Outils de calcul" subtitle="Conversions et calculs rapides utilisés pendant la séance de fitting" />
      <div className="grid gap-4 p-4 md:p-6 xl:grid-cols-2">
        <SectionCard title="Convertisseur centimètres / pouces" icon={<ArrowLeftRight className="h-4 w-4" />}>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumField
              label="Centimètres" value={cm} unit="cm" step="0.1"
              onChange={(v) => { setCm(v); const n = num(v); setInch(n === null ? "" : (n / IN).toFixed(3)); }}
              testId="input-conv-cm"
            />
            <NumField
              label="Pouces" value={inch} unit='"' step="0.125"
              onChange={(v) => { setInch(v); const n = num(v); setCm(n === null ? "" : (n * IN).toFixed(2)); }}
              testId="input-conv-in"
            />
          </div>
          <p className="mt-3 font-mono text-xs text-muted-foreground">1 pouce = 2,54 cm · 1/64" ≈ 0,40 mm (une couche de scotch de grip)</p>
        </SectionCard>

        <SectionCard title="Lie board — trace vers erreur de lie" subtitle="Mesure le décalage de la trace par rapport au centre de la semelle." icon={<Gauge className="h-4 w-4" />}>
          <div className="grid gap-4 sm:grid-cols-3">
            <NumField
              label="Décalage de la trace" value={markMm} unit="mm" step="0.5"
              hint="Positif vers le toe, négatif vers le talon"
              onChange={setMarkMm} testId="input-mark-mm"
            />
            <Field label="Rocker de semelle" hint="mm par degré de lie">
              <Select value={rocker} onValueChange={setRocker}>
                <SelectTrigger className="h-11 md:h-9" data-testid="select-rocker"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="4.8">4,8 mm/° — semelle étroite (3/16")</SelectItem>
                  <SelectItem value="6.35">6,35 mm/° — standard (1/4")</SelectItem>
                  <SelectItem value="9.5">9,5 mm/° — semelle large (3/8")</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Mesure en extérieur" hint="Corrige le biais de +1° upright">
              <Select value={outdoor} onValueChange={setOutdoor}>
                <SelectTrigger className="h-11 md:h-9" data-testid="select-outdoor"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="non">Non — indoor</SelectItem>
                  <SelectItem value="oui">Oui — extérieur</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Stat
              label="Erreur de lie estimée"
              value={lieErrRounded === null ? "—" : `${Math.abs(lieErrRounded)}°`}
              sub={lieErrRounded === null ? "Saisir le décalage" : lieErrRounded > 0 ? "Trace vers le toe : club trop FLAT" : lieErrRounded < 0 ? "Trace vers le talon : club trop UPRIGHT" : "Lie correct"}
              tone={lieErrRounded === null ? "neutral" : lieErrRounded === 0 ? "ok" : "accent"}
              testId="stat-lie-err"
            />
            <Stat
              label="Correction à appliquer"
              value={lieErrRounded === null || lieErrRounded === 0 ? "—" : `${Math.abs(lieErrRounded)}° ${lieErrRounded > 0 ? "UPRIGHT" : "FLAT"}`}
              sub="Arrondi au demi-degré"
              tone={lieErrRounded ? "accent" : "neutral"}
              testId="stat-lie-corr"
            />
          </div>
          <div className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <p>{LIE_BOARD_SCALE.mizunoRule}</p>
            <p>{LIE_BOARD_SCALE.outdoorBias}</p>
          </div>
          <SourceLink src={LIE_BOARD_SRC} className="mt-3" />
        </SectionCard>

        <SectionCard title="Impact d'une erreur de lie sur la trajectoire" icon={<Calculator className="h-4 w-4" />}>
          <NumField label="Erreur de lie" value={devDeg} unit="°" step="0.5" onChange={setDevDeg} testId="input-dev-deg" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Stat
              label="Déviation latérale"
              value={dd === null ? "—" : `${(Math.abs(dd) * LIE_M_PER_DEGREE).toFixed(1)} m`}
              sub={`Règle de ${LIE_YARDS_PER_DEGREE} yards (≈ ${LIE_M_PER_DEGREE} m) par degré`}
              tone={dd ? "accent" : "neutral"} testId="stat-dev"
            />
            <Stat
              label="Direction (droitier)"
              value={dd === null || dd === 0 ? "—" : dd > 0 ? "Vers la gauche" : "Vers la droite"}
              sub={dd === null ? "" : dd > 0 ? "Trop upright ferme la face à l'impact" : "Trop flat ouvre la face à l'impact"}
              mono={false} tone={dd ? "warn" : "neutral"} testId="stat-dev-dir"
            />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            L'effet grandit avec le loft : à 4° d'erreur, un pitching wedge dévie d'environ 7,9 m contre 4,6 m pour un fer 3.
          </p>
          <SourceLink src={LIE_DEVIATION_SRC} className="mt-3" />
        </SectionCard>

        <SectionCard title="Compromis longueur / lie" subtitle="Allonger un club le rend fonctionnellement plus upright." icon={<Ruler className="h-4 w-4" />}>
          <NumField label="Changement de longueur" value={lenChange} unit='"' step="0.125" onChange={setLenChange} testId="input-len-change" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Stat
              label="Effet équivalent sur le lie"
              value={lc === null ? "—" : `${Math.abs(lc * 2).toFixed(2)}° ${lc > 0 ? "UPRIGHT" : lc < 0 ? "FLAT" : ""}`}
              sub="1/2 pouce ≈ 1° de lie"
              tone={lc ? "accent" : "neutral"} testId="stat-len-lie"
            />
            <Stat
              label="Effet sur le swingweight"
              value={lc === null ? "—" : `${lc > 0 ? "+" : ""}${(lc * 6).toFixed(1)} pts`}
              sub="≈ 6 points de swingweight par pouce"
              tone="neutral" testId="stat-len-sw"
            />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{LIE_BOARD_SCALE.swingweight}</p>
          <SourceLink src={LIE_BOARD_SRC} className="mt-3" />
        </SectionCard>

        <SectionCard title="Tables de flex par vitesse" icon={<Gauge className="h-4 w-4" />}>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Vitesse de tête au fer 7</div>
          <MiniTable
            head={["Vitesse (mph)", "Flex"]}
            rows={FLEX_BY_IRON7_SPEED.map((f) => [
              f.max >= 900 ? `${f.min} +` : f.min <= 0 ? `< ${f.max}` : `${f.min} – ${f.max}`,
              f.flex,
            ])}
          />
          <SourceLink src={FLEX_IRON_SRC} className="mb-4 mt-2" />
          <div className="mb-2 text-xs font-medium text-muted-foreground">Vitesse de tête au driver</div>
          <MiniTable
            head={["mph", "km/h", "Carry (m)", "Flex"]}
            rows={FLEX_BY_DRIVER_SPEED.map((f) => [f.mph, f.kmh, f.carryM, f.flex])}
          />
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Repère amateur : {AMATEUR_BENCHMARK.driverSpeedMph} mph ({AMATEUR_BENCHMARK.driverSpeedKmh} km/h) de vitesse de tête au driver. {AMATEUR_BENCHMARK.note}
          </p>
          <SourceLink src={[FLEX_DRIVER_SRC, AMATEUR_BENCHMARK.src]} className="mt-2" />
        </SectionCard>

        <SectionCard title="Tailles de grip et de gant" icon={<Hand className="h-4 w-4" />}>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Grip — longueur de main (pli du poignet au bout du majeur)</div>
          <MiniTable
            head={["Longueur de main", "Taille de grip"]}
            rows={GRIP_SIZE_TABLE.map((g) => [
              `${g.minIn === 0 ? "<" : g.minIn.toFixed(1)}${g.minIn === 0 ? ` ${g.maxIn}"` : `–${g.maxIn >= 99 ? "+" : g.maxIn.toFixed(1)}"`} · ${(g.minIn * IN).toFixed(1)}–${g.maxIn >= 99 ? "+" : (g.maxIn * IN).toFixed(1)} cm`,
              g.size,
            ])}
          />
          <SourceLink src={GRIP_SIZE_SRC} className="mb-4 mt-2" />
          <div className="mb-2 text-xs font-medium text-muted-foreground">Gant — FootJoy</div>
          <MiniTable
            head={["Taille", "Sexe", "Longueur main (cm)", "Tour de main (cm)"]}
            rows={GLOVE_TABLE.map((g) => [
              g.size, g.gender === "H" ? "Homme" : "Femme",
              `${g.lenMin} – ${g.lenMax}`,
              g.circMin !== null ? `${g.circMin} – ${g.circMax}` : "—",
            ])}
          />
          <SourceLink src={GLOVE_SRC} className="mt-2" />
        </SectionCard>

        <SectionCard title="Table de lie statique" subtitle="Wrist-to-floor croisé avec la taille du joueur." className="xl:col-span-2" icon={<Ruler className="h-4 w-4" />}>
          <div className="overflow-x-auto">
            <MiniTable
              head={["Wrist-to-floor", "Petite taille", "Taille moyenne", "Grande taille"]}
              rows={STATIC_LIE_TABLE.map((r) => [
                `${r.wtfIn.toFixed(1)}" · ${(r.wtfIn * IN).toFixed(0)} cm`,
                r.small === null ? "—" : lieCell(r.small),
                r.mid === null ? "—" : lieCell(r.mid),
                r.tall === null ? "—" : lieCell(r.tall),
              ])}
            />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Bandes de taille : petite 147–168 cm, moyenne 168–188 cm, grande 188–201 cm. Valeur positive = upright, négative = flat.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {PING_COLORS_CURRENT.map((c) => (
              <Badge key={c.color} variant="outline" className="gap-1.5 font-normal">
                <span className="h-2.5 w-2.5 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
                {c.fr} · {c.deg > 0 ? `+${c.deg}` : c.deg}°
              </Badge>
            ))}
          </div>
          <SourceLink src={[STATIC_LIE_SRC, PING_SRC]} className="mt-3" />
        </SectionCard>
      </div>
    </Layout>
  );
}

const lieCell = (v: number) => (v === 0 ? "Standard" : `${v > 0 ? "+" : ""}${v}° ${v > 0 ? "upright" : "flat"}`);

function MiniTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-xs text-muted-foreground">
          {head.map((h) => <th key={h} className="pb-2 pr-3 font-medium">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-border/50 last:border-0">
            {r.map((c, j) => (
              <td key={j} className={`py-1.5 pr-3 ${j === 0 ? "font-mono text-xs tabular-nums text-muted-foreground" : ""}`}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
