import { callLlm } from "./llm.js";

/**
 * Analyse d'une transcription audio de seance de fitting.
 * Renvoie les champs de la fiche qui peuvent etre remplis, chacun accompagne
 * de l'extrait de transcription qui le justifie, pour relecture par le fitter.
 */

const CLUBS = [
  "DR", "3W", "5W", "7W", "H3", "H4", "H5",
  "3i", "4i", "5i", "6i", "7i", "8i", "9i", "PW", "GW", "SW", "LW",
] as const;

const TM_FIELDS = [
  "clubSpeed", "ballSpeed", "smash", "launch", "spin", "attackAngle",
  "dynamicLoft", "spinLoft", "faceAngle", "clubPath", "faceToPath",
  "height", "landingAngle", "carry", "total", "sideCarry",
] as const;

const PLAYER_FIELDS = [
  "firstName", "lastName", "email", "phone", "gender", "birthYear", "handedness",
  "handicap", "yearsPlaying", "roundsPerMonth", "tempo", "physicalNotes", "missPattern", "club",
] as const;

const MEASURE_FIELDS = [
  "heightCm", "wristToFloorCm", "armSpanCm", "handLengthCm",
  "handCircumferenceCm", "middleFingerCm", "gloveSizeCurrent", "shoeSole",
] as const;

const RECO_FIELDS = [
  "headIrons", "headWoods", "shaftIrons", "shaftWoods", "flex", "lengthIrons",
  "lengthDriver", "lie", "gripModel", "gripSize", "glove", "loftGapping",
  "driverLoft", "ballModel", "priority", "notes",
] as const;

const CLUB_FIELDS = [
  "club", "brand", "model", "year", "shaft", "flex", "shaftWeight",
  "lengthIn", "lieNote", "gripModel", "gripSize", "wraps",
] as const;

const PROMPT = `Tu es l'assistant d'un club-fitter professionnel. On te donne la TRANSCRIPTION AUDIO d'une seance de fitting fers et bois, dictee a voix haute pendant la seance. Le fitter y annonce les mesures du joueur, ses observations, les marques sur la lie board et parfois des chiffres Trackman.

Ta mission : extraire tout ce qui est reellement dit et le placer dans les champs de la fiche. Renvoie UNIQUEMENT un objet JSON valide, sans texte autour et sans bloc de code, de la forme :

{
  "summary": "resume en une phrase de ce que contient la transcription",
  "player": { "firstName": "Marc", "lastName": "Dupont", "gender": "H", "handedness": "droitier", "handicap": "15", "birthYear": "1984", "yearsPlaying": "12", "roundsPerMonth": "4", "tempo": "moyen", "physicalNotes": "epaule droite sensible", "missPattern": "slice au driver", "club": "Royal Waterloo", "email": "", "phone": "" },
  "measures": { "heightCm": "182", "wristToFloorCm": "88", "armSpanCm": "188", "handLengthCm": "19.5", "handCircumferenceCm": "22", "middleFingerCm": "8.5", "gloveSizeCurrent": "L", "shoeSole": "crampons" },
  "currentClubs": [ { "club": "7i", "brand": "Ping", "model": "G425", "year": "2021", "shaft": "AWT 2.0", "flex": "R", "shaftWeight": "98", "lengthIn": "37.5", "lieNote": "standard", "gripModel": "Golf Pride Tour Velvet", "gripSize": "standard", "wraps": "1" } ],
  "lieTests": [ { "club": "7i", "mark": "toe_slight", "shotsHitLeft": "3", "correctionDeg": "", "note": "marque nette en pointe" } ],
  "trackman": [ { "club": "7i", "clubSpeed": "87.4", "ballSpeed": "118.2", "smash": "1.35", "launch": "17.2", "spin": "5100", "attackAngle": "-2.1", "dynamicLoft": "22.4", "spinLoft": "", "faceAngle": "-0.8", "clubPath": "1.4", "faceToPath": "", "height": "27.5", "landingAngle": "42", "carry": "163", "total": "168", "sideCarry": "-4" } ],
  "reco": { "flex": "S", "lie": "1 degre upright", "lengthIrons": "+0.5 pouce", "gripSize": "midsize", "glove": "L", "headIrons": "", "headWoods": "", "shaftIrons": "", "shaftWoods": "", "lengthDriver": "", "gripModel": "", "loftGapping": "", "driverLoft": "", "ballModel": "", "priority": "", "notes": "" },
  "targetBrand": "PING",
  "fitterNotes": "observations libres du fitter, en une ou deux phrases, dans ses mots",
  "quotes": { "measures.heightCm": "il mesure un metre quatre-vingt-deux", "lieTests.0": "la marque part clairement vers la pointe sur le fer 7" }
}

Regles imperatives :
- N'INVENTE RIEN. Un champ qui n'est pas dit dans la transcription reste une chaine vide "". Un tableau sans donnee reste [].
- Les nombres dictes en toutes lettres doivent etre convertis en chiffres : "un metre quatre-vingt-deux" -> "182", "quatre-vingt-huit centimetres" -> "88", "dix-neuf virgule cinq" -> "19.5".
- Toutes les longueurs corporelles en CENTIMETRES. Si le fitter parle en pouces ou en pieds, convertis (1 pouce = 2.54 cm, 1 pied = 30.48 cm). "wristToFloorCm" = distance du pli du poignet au sol. "armSpanCm" = envergure bras ecartes. "handLengthCm" = pli du poignet au bout du majeur. "handCircumferenceCm" = tour de main. "middleFingerCm" = longueur du majeur.
- Vitesses Trackman en MPH, distances Trackman (carry, total, height, sideCarry) en METRES, spin en tr/min, angles en degres. Convertis si le fitter dicte en km/h ou en yards (1 yard = 0.9144 m).
- "club" (dans currentClubs, lieTests, trackman) doit valoir exactement une de ces valeurs : ${CLUBS.join(", ")}. Driver = "DR", bois 3 = "3W", hybride 4 = "H4", fer 7 = "7i", pitching = "PW", gap ou approach = "GW", sand = "SW", lob = "LW".
- Si le fitter decrit le materiel actuel comme une SERIE complete sans nommer de club precis ("il joue du Callaway Rogue", "sa serie est en Ping G425"), utilise "7i" comme club de reference pour cette entree et precise "serie complete" dans "lieNote".
- "mark" (lie board) vaut exactement : "toe" (marque franche en pointe), "toe_slight" (legerement pointe), "center" (centre), "heel_slight" (legerement talon), "heel" (marque franche au talon), ou "".
- "gender" vaut "H" ou "F" ou "". "handedness" vaut "droitier" ou "gaucher" ou "". "tempo" vaut "lent", "moyen", "rapide" ou "". "shoeSole" vaut "plate", "crampons" ou "".
- "targetBrand" : seulement si une marque cible est evoquee pour la commande (PING, Callaway, Cobra, Titleist, Mizuno, Srixon, PXG, TaylorMade). Sinon "".
- "quotes" : pour chaque valeur que tu remplis, ajoute une entree dont la cle est le chemin du champ ("player.handicap", "measures.wristToFloorCm", "reco.flex") ou l'index du tableau ("lieTests.0", "trackman.1", "currentClubs.0"), et la valeur est l'extrait EXACT et court de la transcription qui le justifie. Ne cite jamais une phrase qui n'est pas dans le texte.
- Nombres sous forme de chaines, point decimal, sans unite.
- Si la transcription ne contient aucune donnee de fitting exploitable, renvoie tous les champs vides et un "summary" qui l'explique.`;

type Dict = Record<string, unknown>;

const str = (v: unknown) => {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  return s === "-" || s.toLowerCase() === "n/a" || s.toLowerCase() === "null" ? "" : s;
};

const numStr = (v: unknown) => {
  const s = str(v).replace(",", ".");
  if (!s) return "";
  const n = Number(s.replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? String(n) : "";
};

const oneOf = <T extends string>(v: unknown, allowed: readonly T[]): T | "" =>
  (allowed as readonly string[]).includes(str(v)) ? (str(v) as T) : "";

const pick = (src: Dict, fields: readonly string[], numeric: readonly string[] = []) => {
  const out: Record<string, string> = {};
  for (const f of fields) {
    const v = numeric.includes(f) ? numStr(src[f]) : str(src[f]);
    if (v) out[f] = v;
  }
  return out;
};

export async function parseTranscript(transcript: string) {
  const text = transcript.trim();
  if (text.length < 20) throw new Error("Transcription trop courte pour être analysée.");
  if (text.length > 60000) throw new Error("Transcription trop longue (60 000 caractères maximum).");

  const raw = await callLlm({
    prompt: `${PROMPT}\n\n--- TRANSCRIPTION ---\n${text}`,
    maxTokens: 8000,
  });

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Analyse impossible : réponse illisible du module d'analyse.");

  let p: Dict;
  try {
    p = JSON.parse(raw.slice(start, end + 1)) as Dict;
  } catch {
    throw new Error("Analyse impossible : réponse illisible du module d'analyse.");
  }

  const srcPlayer = (p.player ?? {}) as Dict;
  const player = pick(srcPlayer, PLAYER_FIELDS, ["handicap", "birthYear", "yearsPlaying", "roundsPerMonth"]);
  const g = oneOf(srcPlayer.gender, ["H", "F"] as const);
  if (g) player.gender = g; else delete player.gender;
  const hd = oneOf(srcPlayer.handedness, ["droitier", "gaucher"] as const);
  if (hd) player.handedness = hd; else delete player.handedness;
  const tp = oneOf(srcPlayer.tempo, ["lent", "moyen", "rapide"] as const);
  if (tp) player.tempo = tp; else delete player.tempo;

  const srcMeasures = (p.measures ?? {}) as Dict;
  const measures = pick(srcMeasures, MEASURE_FIELDS, [
    "heightCm", "wristToFloorCm", "armSpanCm", "handLengthCm", "handCircumferenceCm", "middleFingerCm",
  ]);
  const sole = oneOf(srcMeasures.shoeSole, ["plate", "crampons"] as const);
  if (sole) measures.shoeSole = sole; else delete measures.shoeSole;

  const reco = pick((p.reco ?? {}) as Dict, RECO_FIELDS);

  const currentClubs = (Array.isArray(p.currentClubs) ? (p.currentClubs as Dict[]) : [])
    .map((c) => {
      const row = pick(c, CLUB_FIELDS, ["year", "shaftWeight", "lengthIn", "wraps"]);
      row.club = oneOf(c.club, CLUBS);
      return row;
    })
    .filter((c) => c.club && CLUB_FIELDS.some((f) => f !== "club" && c[f]));

  const lieTests = (Array.isArray(p.lieTests) ? (p.lieTests as Dict[]) : [])
    .map((l) => ({
      club: oneOf(l.club, CLUBS),
      mark: oneOf(l.mark, ["toe", "toe_slight", "center", "heel_slight", "heel"] as const),
      shotsHitLeft: numStr(l.shotsHitLeft),
      correctionDeg: numStr(l.correctionDeg),
      note: str(l.note),
    }))
    .filter((l) => l.club && (l.mark || l.correctionDeg || l.note));

  const trackman = (Array.isArray(p.trackman) ? (p.trackman as Dict[]) : [])
    .map((r) => {
      const row: Record<string, string> = { club: oneOf(r.club, CLUBS) };
      for (const f of TM_FIELDS) row[f] = numStr(r[f]);
      if (!row.faceToPath && row.faceAngle && row.clubPath) {
        row.faceToPath = String(Math.round((Number(row.faceAngle) - Number(row.clubPath)) * 10) / 10);
      }
      if (!row.smash && row.ballSpeed && row.clubSpeed && Number(row.clubSpeed) > 0) {
        row.smash = String(Math.round((Number(row.ballSpeed) / Number(row.clubSpeed)) * 100) / 100);
      }
      row.impactHoriz = "";
      row.impactVert = "";
      return row;
    })
    .filter((r) => r.club && TM_FIELDS.some((f) => r[f] !== ""));

  const quotesRaw = (p.quotes ?? {}) as Dict;
  const quotes: Record<string, string> = {};
  for (const [k, v] of Object.entries(quotesRaw)) {
    const q = str(v);
    if (q) quotes[k] = q.length > 220 ? `${q.slice(0, 217)}...` : q;
  }

  return {
    summary: str(p.summary),
    player,
    measures,
    reco,
    currentClubs,
    lieTests,
    trackman,
    targetBrand: oneOf(str(p.targetBrand).toUpperCase(), [
      "PING", "CALLAWAY", "COBRA", "TITLEIST", "MIZUNO", "SRIXON", "PXG", "TAYLORMADE",
    ] as const),
    fitterNotes: str(p.fitterNotes),
    quotes,
  };
}

export type TranscriptResult = Awaited<ReturnType<typeof parseTranscript>>;
