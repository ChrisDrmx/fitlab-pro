import {
  IN, PING_COLORS_CURRENT, PING_COLORS_LEGACY, PING_LENGTH_BY_HEIGHT,
  STATIC_LIE_TABLE, HEIGHT_BANDS, GRIP_SIZE_TABLE, GLOVE_TABLE,
  FLEX_BY_IRON7_SPEED, CLUB_WINDOWS, PGA_TOUR, LIE_MARKS, apeIndexReading,
  GAP_TARGET_M, STANDARD_LIE,
} from "@/data/reference";
import type { ClubKey, FittingData, LieMark, TrackmanRow } from "@/lib/types";
import { CLUB_LABEL } from "@/lib/types";

export const num = (v: string | number | null | undefined): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

export const fmt = (n: number | null, d = 1) => (n === null ? "—" : n.toFixed(d).replace(/\.0$/, ""));
export const inToCm = (i: number) => i * IN;
export const cmToIn = (c: number) => c / IN;

/** Affiche un ajustement de longueur en pouces sous forme fractionnaire lisible. */
export function lengthLabel(adjIn: number): string {
  if (Math.abs(adjIn) < 0.01) return "Standard";
  const sign = adjIn > 0 ? "+" : "-";
  const a = Math.abs(adjIn);
  const frac =
    Math.abs(a - 0.25) < 0.01 ? "1/4\"" :
    Math.abs(a - 0.5) < 0.01 ? "1/2\"" :
    Math.abs(a - 0.75) < 0.01 ? "3/4\"" :
    Math.abs(a - 1) < 0.01 ? "1\"" :
    Math.abs(a - 1.5) < 0.01 ? "1 1/2\"" :
    `${a}"`;
  return `${sign}${frac} (${sign}${(a * IN).toFixed(1).replace(".", ",")} cm)`;
}

/* ---------------- Mesures statiques ---------------- */

export interface StaticResult {
  heightCm: number | null;
  wtfCm: number | null;
  wtfIn: number | null;
  heightBand: keyof typeof HEIGHT_BANDS | null;
  lieCorrection: number | null;          // ° (+ upright)
  lieCorrectionLabel: string;
  lengthAdjIn: number | null;
  lengthAdjLabel: string;
  pingColorCurrent: { color: string; fr: string; hex: string; deg: number } | null;
  pingColorLegacy: { color: string; fr: string; deg: number } | null;
  apeRatio: number | null;
  apeReading: ReturnType<typeof apeIndexReading> | null;
  gripSize: string | null;
  gripGloveHint: string | null;
  gloveSize: string | null;
  gloveCadet: boolean;
  iron6LengthIn: number | null;
  driverLengthIn: number | null;
  warnings: string[];
}

function heightBand(cm: number): keyof typeof HEIGHT_BANDS {
  if (cm < HEIGHT_BANDS.small.maxCm) return "small";
  if (cm < HEIGHT_BANDS.mid.maxCm) return "mid";
  return "tall";
}

const IRON6_STD_IN = 37.5; // longueur standard fer 6 (référence PING i230)
const DRIVER_STD_IN = 45.5;

export function computeStatic(d: FittingData): StaticResult {
  const w: string[] = [];
  const heightCm = num(d.measures.heightCm);
  const wtfCm = num(d.measures.wristToFloorCm);
  const wtfIn = wtfCm === null ? null : cmToIn(wtfCm);
  const band = heightCm === null ? null : heightBand(heightCm);

  // Correction de lie : table croisée wrist-to-floor x taille
  let lieCorrection: number | null = null;
  if (wtfIn !== null && band) {
    const rows = STATIC_LIE_TABLE.slice().sort(
      (a, b) => Math.abs(a.wtfIn - wtfIn) - Math.abs(b.wtfIn - wtfIn)
    );
    const hit = rows.find((r) => r[band] !== null);
    lieCorrection = hit ? (hit[band] as number) : null;
    if (wtfIn > 40.5 || wtfIn < 28.5) w.push("Wrist-to-floor hors de la plage documentée (28,5–40,5 pouces / 72–103 cm) : vérifier la mesure.");
  }

  // Ajustement de longueur : bandes de taille PING
  let lengthAdjIn: number | null = null;
  if (heightCm !== null) {
    const b = PING_LENGTH_BY_HEIGHT.find((x) => heightCm >= x.minCm && heightCm < x.maxCm);
    lengthAdjIn = b ? b.adjIn : null;
  }
  // Affinage par wrist-to-floor : un WTF très éloigné de la médiane décale d'un cran
  if (lengthAdjIn !== null && wtfIn !== null) {
    if (wtfIn >= 38) lengthAdjIn += 0.5;
    else if (wtfIn <= 31) lengthAdjIn -= 0.5;
  }

  const pingColorCurrent =
    lieCorrection === null
      ? null
      : (() => {
          const c = PING_COLORS_CURRENT.slice().sort(
            (a, b) => Math.abs(a.deg - lieCorrection!) - Math.abs(b.deg - lieCorrection!)
          )[0];
          return { color: c.color, fr: c.fr, hex: c.hex, deg: c.deg };
        })();

  const pingColorLegacy =
    wtfIn === null
      ? null
      : (() => {
          const c =
            PING_COLORS_LEGACY.find((x) => wtfIn >= x.wtfIn[0] && wtfIn < x.wtfIn[1]) ??
            PING_COLORS_LEGACY.slice().sort(
              (a, b) =>
                Math.abs((a.wtfIn[0] + a.wtfIn[1]) / 2 - wtfIn) -
                Math.abs((b.wtfIn[0] + b.wtfIn[1]) / 2 - wtfIn)
            )[0];
          return { color: c.color, fr: c.fr, deg: c.deg };
        })();

  const spanCm = num(d.measures.armSpanCm);
  const apeRatio = spanCm !== null && heightCm ? spanCm / heightCm : null;
  const apeReading = apeRatio === null ? null : apeIndexReading(apeRatio);

  // Grip
  const handCm = num(d.measures.handLengthCm);
  let gripSize: string | null = null;
  let gripGloveHint: string | null = null;
  if (handCm !== null) {
    const handIn = cmToIn(handCm);
    const g = GRIP_SIZE_TABLE.find((x) => handIn >= x.minIn && handIn <= x.maxIn);
    gripSize = g ? g.size : null;
    gripGloveHint = g ? g.glove : null;
  }

  // Gant
  const circCm = num(d.measures.handCircumferenceCm);
  let gloveSize: string | null = null;
  let gloveCadet = false;
  if (handCm !== null || circCm !== null) {
    const gender = d.player.gender === "F" ? "F" : "H";
    const rows = GLOVE_TABLE.filter((r) => r.gender === gender);
    const byLen = handCm === null ? null : rows.find((r) => handCm >= r.lenCm[0] && handCm < r.lenCm[1]);
    const byCirc = circCm === null ? null : rows.find((r) => circCm >= r.circCm[0] && circCm < r.circCm[1]);
    gloveSize = (byCirc ?? byLen)?.size ?? null;
    if (byLen && byCirc && byLen.size !== byCirc.size) {
      const order = ["S", "M", "ML", "L", "XL", "XXL"];
      gloveCadet = order.indexOf(byCirc.size) > order.indexOf(byLen.size);
      gloveSize = byCirc.size;
    }
  }

  if (d.measures.shoeSole === "crampons")
    w.push("Le wrist-to-floor doit être mesuré en chaussures plates : la mesure prise en chaussures à crampons majore la valeur d'environ 1 cm.");

  return {
    heightCm, wtfCm, wtfIn, heightBand: band,
    lieCorrection,
    lieCorrectionLabel:
      lieCorrection === null ? "—" :
      lieCorrection === 0 ? "Standard" :
      `${Math.abs(lieCorrection)}° ${lieCorrection > 0 ? "UPRIGHT" : "FLAT"}`,
    lengthAdjIn,
    lengthAdjLabel: lengthAdjIn === null ? "—" : lengthLabel(lengthAdjIn),
    pingColorCurrent, pingColorLegacy,
    apeRatio, apeReading,
    gripSize, gripGloveHint, gloveSize, gloveCadet,
    iron6LengthIn: lengthAdjIn === null ? null : IRON6_STD_IN + lengthAdjIn,
    driverLengthIn: lengthAdjIn === null ? null : DRIVER_STD_IN + lengthAdjIn,
    warnings: w,
  };
}

/* ---------------- Lie dynamique ---------------- */

export interface DynLieResult {
  club: ClubKey;
  label: string;
  mark: LieMark;
  markLabel: string;
  correction: number | null;
  correctionLabel: string;
  hint: string;
  standardLie: number | null;
  targetLie: number | null;
}

export function computeDynamicLie(d: FittingData): DynLieResult[] {
  return d.lieTests.map((t) => {
    const manual = num(t.correctionDeg);
    const m = LIE_MARKS.find((x) => x.key === t.mark);
    const correction = manual !== null ? manual : m ? m.correction : null;
    const std = STANDARD_LIE[t.club] ?? null;
    return {
      club: t.club,
      label: CLUB_LABEL[t.club],
      mark: t.mark,
      markLabel: m?.label ?? "Non relevée",
      correction,
      correctionLabel:
        correction === null ? "—" :
        correction === 0 ? "Standard" :
        `${Math.abs(correction)}° ${correction > 0 ? "UPRIGHT" : "FLAT"}`,
      hint: m?.hint ?? "",
      standardLie: std,
      targetLie: std !== null && correction !== null ? std + correction : null,
    };
  });
}

/** Moyenne des corrections dynamiques observées, arrondie au demi-degré. */
export function dynamicLieConsensus(rows: DynLieResult[]): number | null {
  const vals = rows.map((r) => r.correction).filter((v): v is number => v !== null);
  if (!vals.length) return null;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.round(avg * 2) / 2;
}

/* ---------------- Trackman ---------------- */

export type Verdict = "bas" | "ok" | "haut" | "na";

export interface MetricEval {
  key: string;
  label: string;
  value: number | null;
  window: [number, number] | null;
  tour: number | null;
  verdict: Verdict;
  unit: string;
}

const range = (v: number | null, win: [number, number] | null): Verdict => {
  if (v === null || !win) return "na";
  if (v < win[0]) return "bas";
  if (v > win[1]) return "haut";
  return "ok";
};

export function evalTrackmanRow(row: TrackmanRow): MetricEval[] {
  const win = CLUB_WINDOWS[row.club] ?? null;
  const tour = PGA_TOUR.find((t) => t.club === row.club) ?? null;
  const cs = num(row.clubSpeed);
  const bs = num(row.ballSpeed);
  const smash = num(row.smash) ?? (cs && bs ? bs / cs : null);

  return [
    { key: "clubSpeed", label: "Vitesse de club", value: cs, window: null, tour: tour?.clubSpeed ?? null, verdict: "na", unit: "mph" },
    { key: "ballSpeed", label: "Vitesse de balle", value: bs, window: null, tour: tour?.ballSpeed ?? null, verdict: "na", unit: "mph" },
    { key: "smash", label: "Smash factor", value: smash, window: win?.smash ?? null, tour: tour?.smash ?? null, verdict: range(smash, win?.smash ?? null), unit: "" },
    { key: "launch", label: "Angle de départ", value: num(row.launch), window: win?.launch ?? null, tour: tour?.launch ?? null, verdict: range(num(row.launch), win?.launch ?? null), unit: "°" },
    { key: "spin", label: "Backspin", value: num(row.spin), window: win?.spin ?? null, tour: tour?.spin ?? null, verdict: range(num(row.spin), win?.spin ?? null), unit: "tr/min" },
    { key: "attack", label: "Angle d'attaque", value: num(row.attackAngle), window: win?.attack ?? null, tour: tour?.attack ?? null, verdict: range(num(row.attackAngle), win?.attack ?? null), unit: "°" },
    { key: "dynamicLoft", label: "Loft dynamique", value: num(row.dynamicLoft), window: null, tour: null, verdict: "na", unit: "°" },
    { key: "spinLoft", label: "Spin loft", value: num(row.spinLoft), window: null, tour: null, verdict: "na", unit: "°" },
    { key: "faceToPath", label: "Face-to-path", value: num(row.faceToPath), window: [-2, 2], tour: null, verdict: range(num(row.faceToPath), [-2, 2]), unit: "°" },
    { key: "height", label: "Hauteur max", value: num(row.height), window: win?.height ?? null, tour: tour?.height ?? null, verdict: range(num(row.height), win?.height ?? null), unit: "m/yd" },
    { key: "landing", label: "Angle de chute", value: num(row.landingAngle), window: win?.landing ?? null, tour: tour?.landing ?? null, verdict: range(num(row.landingAngle), win?.landing ?? null), unit: "°" },
    { key: "carry", label: "Carry", value: num(row.carry), window: null, tour: tour?.carry ?? null, verdict: "na", unit: "m" },
  ];
}

/** Spin loft théorique = loft dynamique - angle d'attaque. */
export function spinLoftCheck(row: TrackmanRow): { computed: number | null; entered: number | null; delta: number | null } {
  const dl = num(row.dynamicLoft);
  const aa = num(row.attackAngle);
  const computed = dl !== null && aa !== null ? dl - aa : null;
  const entered = num(row.spinLoft);
  return { computed, entered, delta: computed !== null && entered !== null ? entered - computed : null };
}

/* ---------------- Gapping ---------------- */

export interface GapRow { from: string; to: string; carryFrom: number; carryTo: number; gap: number; verdict: "serré" | "ok" | "trou" }

export function computeGapping(rows: TrackmanRow[]): GapRow[] {
  const order: ClubKey[] = ["DR","3W","5W","7W","H3","H4","H5","3i","4i","5i","6i","7i","8i","9i","PW","GW","SW","LW"];
  const withCarry = rows
    .map((r) => ({ club: r.club, carry: num(r.carry) }))
    .filter((r): r is { club: ClubKey; carry: number } => r.carry !== null)
    .sort((a, b) => order.indexOf(a.club) - order.indexOf(b.club));
  const out: GapRow[] = [];
  for (let i = 0; i < withCarry.length - 1; i++) {
    const a = withCarry[i], b = withCarry[i + 1];
    const gap = Math.abs(a.carry - b.carry);
    out.push({
      from: CLUB_LABEL[a.club], to: CLUB_LABEL[b.club],
      carryFrom: a.carry, carryTo: b.carry, gap,
      verdict: gap < GAP_TARGET_M[0] - 2 ? "serré" : gap > GAP_TARGET_M[1] + 3 ? "trou" : "ok",
    });
  }
  return out;
}

/* ---------------- Flex ---------------- */

export function flexFromIron7(speedMph: number | null): string | null {
  if (speedMph === null) return null;
  const f = FLEX_BY_IRON7_SPEED.find((x) => speedMph >= x.min && speedMph < x.max);
  return f ? f.flex : null;
}

/** Table dédiée driver (True Spec Golf) — ne pas déduire de la table fers. */
const DRIVER_FLEX_BANDS: { max: number; flex: string }[] = [
  { max: 72, flex: "Ladies (L)" },
  { max: 84, flex: "Senior (A)" },
  { max: 97, flex: "Regular (R)" },
  { max: 105, flex: "Stiff (S)" },
  { max: Infinity, flex: "X-Stiff (X)" },
];

export function flexFromDriver(speedMph: number | null): string | null {
  if (speedMph === null) return null;
  return DRIVER_FLEX_BANDS.find((b) => speedMph < b.max)?.flex ?? null;
}

/* ---------------- Synthèse du diagnostic ---------------- */

export interface Insight {
  /** Identifiant stable, utilise pour cocher/decocher le constat dans le rapport. */
  id: string;
  area: string;
  priority: "haute" | "moyenne" | "basse";
  title: string;
  detail: string;
  action?: string;
}

export interface Diagnosis {
  summary: {
    lie: string; lieSource: string;
    length: string; lengthSource: string;
    shaft: string; shaftSource: string;
    grip: string; gripSource: string;
  };
  insights: Insight[];
  spec: { label: string; value: string }[];
}

const lieText = (v: number | null) =>
  v === null ? "—" : v === 0 ? "Standard" : `${Math.abs(v)}° ${v > 0 ? "UPRIGHT" : "FLAT"}`;

export function buildDiagnosis(d: FittingData): Diagnosis {
  const insights: Insight[] = [];
  const push = (i: Omit<Insight, "id">) => insights.push({ id: "", ...i });
  const s = computeStatic(d);
  const dyn = computeDynamicLie(d);
  const consensus = dynamicLieConsensus(dyn);
  const retainedLie = consensus !== null ? consensus : s.lieCorrection;

  /* ---- Lie ---- */
  if (s.lieCorrection !== null) {
    push({
      area: "Lie",
      priority: "moyenne",
      title: `Lie statique : ${s.lieCorrectionLabel}`,
      detail: `Wrist-to-floor ${fmt(s.wtfCm)} cm pour ${fmt(s.heightCm, 0)} cm de taille. Code couleur PING équivalent : ${s.pingColorCurrent?.fr ?? "—"} (système actuel 1°/couleur).`,
      action: "Point de départ à valider systématiquement sur la lie board avant commande.",
    });
  }
  if (consensus !== null && s.lieCorrection !== null && Math.abs(consensus - s.lieCorrection) >= 1) {
    push({
      area: "Lie",
      priority: "haute",
      title: "Écart entre lie statique et lie dynamique",
      detail: `La table statique donne ${s.lieCorrectionLabel} alors que la lie board mesure ${lieText(consensus)}. Le lie dynamique prime : c'est lui qui reflète la position réelle du club à l'impact, posture et libération du joueur incluses.`,
      action: `Commander la série en ${lieText(consensus)} et recontrôler après 3 à 4 semaines de jeu.`,
    });
  }
  if (consensus !== null && consensus !== 0) {
    push({
      area: "Lie",
      priority: "haute",
      title: `Lie dynamique retenu : ${lieText(consensus)}`,
      detail: `Moyenne des clubs testés sur la lie board. Un lie trop upright envoie la balle à gauche pour un droitier, un lie trop flat l'envoie à droite ; l'effet grandit à mesure que le loft augmente.`,
      action: "Valider la plage de flexion tolérée par le fabricant sur la tête retenue avant réglage.",
    });
  }

  /* ---- Morphologie ---- */
  if (s.apeReading && s.apeReading.tone === "warn") {
    push({
      area: "Morphologie",
      priority: "moyenne",
      title: `Envergure : ${s.apeReading.label}`,
      detail: s.apeReading.hint,
      action: "Croiser avec le wrist-to-floor, qui reste la mesure primaire de longueur et de lie.",
    });
  }

  /* ---- Trackman ---- */
  d.trackman.forEach((row) => {
    const metrics = evalTrackmanRow(row);
    const label = CLUB_LABEL[row.club];
    metrics.forEach((m) => {
      if (m.verdict === "na" || m.verdict === "ok") return;
      const high = m.verdict === "haut";
      push({
        area: `Trackman · ${label}`,
        priority: m.key === "smash" || m.key === "spin" ? "haute" : "moyenne",
        title: `${label} — ${m.label} ${high ? "trop élevé" : "trop bas"}`,
        detail: `${fmt(m.value, m.key === "spin" ? 0 : 2)}${m.unit} contre une fenêtre cible de ${m.window?.[0]}–${m.window?.[1]}${m.unit}.`,
        action: trackmanAction(m.key, high),
      });
    });
    const sl = spinLoftCheck(row);
    if (sl.delta !== null && Math.abs(sl.delta) > 1.5) {
      push({
        area: `Trackman · ${label}`,
        priority: "basse",
        title: `${label} — incohérence de spin loft`,
        detail: `Spin loft saisi ${fmt(sl.entered)}° contre ${fmt(sl.computed)}° calculé (loft dynamique - angle d'attaque).`,
        action: "Vérifier la saisie ou écarter les coups aux impacts douteux.",
      });
    }
    if (row.impactHoriz && row.impactHoriz !== "centre") {
      push({
        area: `Impact · ${label}`,
        priority: "haute",
        title: `${label} — impact décentré vers le ${row.impactHoriz}`,
        detail: row.impactHoriz === "talon"
          ? "Impact au talon : perte de vitesse de balle et gear effect vers la droite."
          : "Impact vers le toe : perte de smash factor et gear effect vers la gauche.",
        action: row.impactHoriz === "talon"
          ? "Contrôler la longueur du club et la distance à la balle avant de conclure sur la tête."
          : "Souvent lié à un club trop court ou à un setup trop éloigné de la balle : tester +0,5\".",
      });
    }
    if (row.impactVert && row.impactVert !== "centre" && row.club === "DR") {
      push({
        area: "Impact · Driver",
        priority: "moyenne",
        title: `Driver — impact ${row.impactVert} sur la face`,
        detail: row.impactVert === "bas"
          ? "Impact bas sur la face : départ plus bas, backspin plus élevé, perte de carry."
          : "Impact haut sur la face : départ plus haut et backspin réduit, ce qui favorise le carry.",
        action: row.impactVert === "bas"
          ? "Travailler la position de balle et la hauteur de tee, puis retester avant de changer de loft."
          : "Profil favorable : conserver ce point d'impact et ajuster le loft en conséquence.",
      });
    }
  });

  /* ---- Gapping ---- */
  computeGapping(d.trackman).forEach((g) => {
    if (g.verdict === "ok") return;
    push({
      area: "Gapping",
      priority: g.verdict === "trou" ? "haute" : "moyenne",
      title: `${g.from} -> ${g.to} : ${g.verdict === "trou" ? "trou de distance" : "écart trop serré"}`,
      detail: `${g.gap.toFixed(0)} m d'écart (${g.carryFrom.toFixed(0)} m contre ${g.carryTo.toFixed(0)} m). Cible : ${GAP_TARGET_M[0]}–${GAP_TARGET_M[1]} m.`,
      action: g.verdict === "trou"
        ? "Réétager les lofts ou ajouter un club intermédiaire (hybride ou wedge)."
        : "Deux clubs redondants : écarter les lofts ou en retirer un de la série.",
    });
  });

  /* ---- Shaft ---- */
  const iron7 = d.trackman.find((r) => r.club === "7i");
  const driver = d.trackman.find((r) => r.club === "DR");
  const flexIron = flexFromIron7(num(iron7?.clubSpeed ?? null));
  const flexDriver = flexFromDriver(num(driver?.clubSpeed ?? null));
  let flex = flexIron ?? flexDriver ?? null;
  if (flexIron && flexDriver && flexIron !== flexDriver) {
    push({
      area: "Shaft",
      priority: "moyenne",
      title: `Flex divergent entre fers (${flexIron}) et driver (${flexDriver})`,
      detail: "Les deux tables ne convergent pas : la vitesse de tête au fer 7 et celle au driver ne progressent pas au même rythme chez ce joueur.",
      action: "Traiter les fers et les bois comme deux jeux distincts plutôt que d'imposer un flex unique.",
    });
  }
  if (d.player.tempo === "rapide" && flex) {
    push({
      area: "Shaft",
      priority: "moyenne",
      title: "Tempo rapide : monter d'un cran de rigidité",
      detail: `La table de vitesse indique un flex ${flex}, mais un tempo rapide et une transition agressive chargent davantage le shaft.`,
      action: "Tester le flex supérieur et comparer la dispersion, pas seulement le carry.",
    });
  }
  if (d.player.tempo === "lent" && flex) {
    push({
      area: "Shaft",
      priority: "basse",
      title: "Tempo fluide : un flex plus souple reste envisageable",
      detail: `La table indique un flex ${flex} ; un tempo lent tolère souvent un cran plus souple, qui aide au départ de balle.`,
      action: "Comparer hauteur de balle et régularité sur le flex inférieur.",
    });
  }

  /* ---- Grip & gant ---- */
  if (s.gripSize) {
    push({
      area: "Grip",
      priority: "basse",
      title: `Taille de grip : ${s.gripSize}`,
      detail: `Longueur de main mesurée : ${fmt(num(d.measures.handLengthCm))} cm du pli du poignet au bout du majeur.${s.gripGloveHint ? ` ${s.gripGloveHint}` : ""}`,
      action: "Un grip trop fin favorise une face fermée, un grip trop épais freine la libération : ajuster par couches de scotch (~ +1/64\" par couche).",
    });
  }
  if (s.gloveSize) {
    push({
      area: "Gant",
      priority: "basse",
      title: `Taille de gant : ${s.gloveSize}${s.gloveCadet ? " Cadet" : ""}`,
      detail: s.gloveCadet
        ? "Tour de main large et doigts courts : le modèle Cadet évite le tissu flottant au bout des doigts."
        : "Tour de main et longueur de doigts cohérents avec la coupe standard.",
    });
  }

  if (!insights.length) {
    push({
      area: "Données",
      priority: "moyenne",
      title: "Aucune donnée exploitable",
      detail: "Complète les mesures statiques, le test de lie board ou les données Trackman pour générer le diagnostic.",
    });
  }

  const order = { haute: 0, moyenne: 1, basse: 2 };
  insights.sort((a, b) => order[a.priority] - order[b.priority]);

  // Identifiant stable par constat (permet de le cocher ou non dans le rapport).
  const seen: Record<string, number> = {};
  for (const it of insights) {
    const base = `${it.area}-${it.title}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    seen[base] = (seen[base] ?? 0) + 1;
    it.id = seen[base] > 1 ? `${base}-${seen[base]}` : base;
  }

  /* ---- Résumé ---- */
  const lengthTxt = s.lengthAdjIn === null ? "—" : lengthLabel(s.lengthAdjIn);
  const summary = {
    lie: lieText(retainedLie),
    lieSource: consensus !== null ? "Lie board (dynamique)" : s.lieCorrection !== null ? "Table statique wrist-to-floor" : "À mesurer",
    length: lengthTxt,
    lengthSource: s.iron6LengthIn ? `Fer 6 ~ ${fmt(s.iron6LengthIn, 2)}" · Driver ~ ${fmt(s.driverLengthIn, 2)}"` : "Saisir la taille",
    shaft: flex ?? "—",
    shaftSource: flexIron ? `Vitesse fer 7 : ${iron7?.clubSpeed} mph` : flexDriver ? `Vitesse driver : ${driver?.clubSpeed} mph` : "Saisir une vitesse de club",
    grip: s.gripSize ?? "—",
    gripSource: s.gloveSize ? `Gant ${s.gloveSize}${s.gloveCadet ? " Cadet" : ""}` : "Saisir longueur et tour de main",
  };

  const spec: { label: string; value: string }[] = [
    { label: "Marque cible", value: d.targetBrand || "—" },
    { label: "Lie fers", value: summary.lie },
    { label: "Code couleur PING", value: s.pingColorCurrent ? `${s.pingColorCurrent.fr} (${s.pingColorCurrent.color})` : "—" },
    { label: "Longueur", value: lengthTxt },
    { label: "Longueur fer 6", value: s.iron6LengthIn ? `${fmt(s.iron6LengthIn, 2)}"` : "—" },
    { label: "Longueur driver", value: s.driverLengthIn ? `${fmt(s.driverLengthIn, 2)}"` : "—" },
    { label: "Flex", value: flex ?? "—" },
    { label: "Taille de grip", value: s.gripSize ?? "—" },
    { label: "Taille de gant", value: s.gloveSize ? `${s.gloveSize}${s.gloveCadet ? " Cadet" : ""}` : "—" },
  ];

  return { summary, insights, spec };
}

function trackmanAction(key: string, high: boolean): string {
  switch (key) {
    case "smash":
      return high
        ? "Smash inhabituellement élevé : vérifier la calibration et la qualité des mesures."
        : "Travailler la qualité de centrage avant de changer de tête : le smash factor dépend d'abord du point d'impact.";
    case "spin":
      return high
        ? "Réduire le loft dynamique ou passer sur un shaft à profil plus bas en spin ; vérifier aussi la balle utilisée."
        : "Augmenter le loft ou choisir un shaft plus souple en pointe pour retrouver du backspin porteur.";
    case "launch":
      return high
        ? "Baisser le loft ou reculer légèrement la position de balle."
        : "Monter le loft, ou tester un shaft plus souple en pointe pour élever le départ.";
    case "attack":
      return high
        ? "Angle d'attaque très ascendant : contrôler la position de balle et le point bas du swing."
        : "Angle d'attaque trop descendant : la position de balle et le transfert d'appuis primes sur le matériel.";
    case "clubSpeed":
      return high ? "Vitesse au-dessus de la référence : privilégier le contrôle de dispersion." : "Vitesse sous la référence : viser le rendement plutôt que le poids de shaft.";
    case "landing":
      return high ? "Angle de chute élevé : bon arrêt de balle, mais surveiller la perte de roule." : "Angle de chute faible : la balle ne s'arrêtera pas sur green ferme, augmenter hauteur et spin.";
    case "height":
      return high ? "Trajectoire très haute : sensible au vent, réduire loft ou spin." : "Trajectoire basse : viser plus de hauteur pour tenir les greens.";
    case "faceToPath":
      return "Écart face-to-path marqué : c'est la courbe de balle qui est en cause, à traiter en technique avant tout réglage.";
    default:
      return "Retester après ajustement pour confirmer la tendance.";
  }
}
