import { callLlmStructured } from "./llm.js";
import type { LlmDiag } from "./llm.js";
import { TranscriptSchema, CLUBS, BRANDS } from "./schema-transcript.js";
import type { TranscriptParsed } from "./schema-transcript.js";

/**
 * Analyse d'une transcription audio de seance de fitting.
 * Renvoie les champs de la fiche qui peuvent etre remplis, chacun accompagne
 * de l'extrait de transcription qui le justifie, de la nature de la valeur
 * (mesure / recommandation / hypothese / incertain) et d'un niveau de
 * confiance, pour relecture par le fitter.
 *
 * La forme de la reponse est garantie par un schema de sortie structuree :
 * le modele ne peut pas renvoyer un JSON hors format.
 */

const TM_FIELDS = [
  "clubSpeed", "ballSpeed", "smash", "launch", "spin", "attackAngle",
  "dynamicLoft", "spinLoft", "faceAngle", "clubPath", "faceToPath",
  "height", "landingAngle", "carry", "total", "sideCarry",
] as const;

const NUM_PLAYER = ["handicap", "birthYear", "yearsPlaying", "roundsPerMonth"];
const NUM_MEASURES = [
  "heightCm", "wristToFloorCm", "armSpanCm",
  "forearmLengthCm", "humerusLengthCm",
  "handLengthCm", "handCircumferenceCm", "middleFingerCm",
];
const NUM_CLUB = ["year", "shaftWeight", "lengthIn", "wraps"];

const INSTRUCTIONS = `Tu es un expert en fitting de golf (fers et bois) et en extraction de donnees.

On te donne la TRANSCRIPTION AUDIO d'une seance de fitting, dictee a voix haute pendant la seance par le fitter. Il y annonce les mesures du joueur, ses observations, les marques sur la lie board, parfois des chiffres Trackman, et son avis de prescription.

Analyse TOUTE la transcription, meme si elle contient des erreurs de reconnaissance vocale. Retrouve tous les nombres lies aux mesures corporelles, au materiel et aux performances.

Regles imperatives :
- N'INVENTE JAMAIS une valeur absente. Un champ non dit vaut null. Un tableau sans donnee vaut [].
- Corrige les erreurs de transcription evidentes ("chef" ou "chaft" = "shaft", "lie bord" = "lie board", "smache" = "smash", "ping g quatre cent vingt-cinq" = "G425"), mais conserve toujours le texte original dans le champ "evidence".
- Distingue clairement :
  * "mesure" : une valeur reellement mesuree ou lue sur un appareil ;
  * "recommandation" : une prescription du fitter ("on part sur du stiff") ;
  * "hypothese" : une piste evoquee sans decision ("on pourrait peut-etre tester du midsize") ;
  * "incertain" : une valeur entendue mais douteuse (chiffre coupe, unite absente, club non nomme).
- Convertis les nombres dictes en toutes lettres : "un metre quatre-vingt-deux" -> "182", "dix-neuf virgule cinq" -> "19.5", "quatre-vingt-dix-huit quatre" -> "98.4".
- Toutes les longueurs corporelles en CENTIMETRES (1 pouce = 2.54 cm, 1 pied = 30.48 cm). "wristToFloorCm" = pli du poignet au sol. "armSpanCm" = envergure bras ecartes. "forearmLengthCm" = milieu du coude a l'articulation du majeur. "humerusLengthCm" = articulation de l'epaule au milieu du coude. "handLengthCm" = pli du poignet au bout du majeur. "handCircumferenceCm" = tour de main. "middleFingerCm" = longueur du majeur.
- Vitesses Trackman en MPH, distances Trackman (carry, total, height, sideCarry) en METRES, spin en tr/min, angles en degres. Convertis depuis km/h (÷1.609) ou yards (×0.9144) si necessaire, et signale la conversion dans "evidence".
- "club" vaut exactement une de ces valeurs : ${CLUBS.join(", ")}. Driver = "DR", bois 3 = "3W", hybride 4 = "H4", fer 7 = "7i", pitching = "PW", gap ou approach = "GW", sand = "SW", lob = "LW".
- Si le materiel actuel est decrit comme une SERIE complete sans club precis ("il joue du Callaway Rogue"), utilise "7i" comme club de reference et ecris "serie complete" dans "lieNote".
- "mark" (lie board) : "toe" (marque franche en pointe), "toe_slight", "center", "heel_slight", "heel", ou null.
- "targetBrand" : uniquement si une marque cible est evoquee pour la commande, parmi ${BRANDS.join(", ")}. Sinon null.
- Les nombres sont des chaines de caracteres, avec un point decimal, sans unite.
- "values" : UNE entree pour chaque valeur que tu remplis. "field" est le chemin du champ ("player.handicap", "measures.wristToFloorCm", "reco.flex") ou l'index de la ligne du tableau ("lieTests.0", "trackman.1", "currentClubs.0", "targetBrand", "fitterNotes"). "evidence" est l'extrait EXACT et court de la transcription qui justifie la valeur : ne cite jamais une phrase absente du texte.
- "ambiguities" : liste courte, en francais, des points a verifier de vive voix (chiffre inaudible, unite douteuse, club non identifie, contradiction entre deux passages).
- "fitterNotes" : les observations libres du fitter, dans ses mots, en une ou deux phrases.
- Si la transcription ne contient aucune donnee de fitting exploitable, renvoie tous les champs a null et explique-le dans "summary".`;

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

/** Aplatit un objet du schema en Record<string,string>, en ecartant les vides. */
const flat = (src: Dict | null | undefined, numeric: readonly string[] = []) => {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(src ?? {})) {
    const s = numeric.includes(k) ? numStr(v) : str(v);
    if (s) out[k] = s;
  }
  return out;
};

export async function parseTranscript(
  transcript: string,
  tune: { model?: string; effort?: string } = {},
) {
  const text = transcript.trim();
  if (text.length < 20) throw new Error("Transcription trop courte pour être analysée.");
  if (text.length > 60000) throw new Error("Transcription trop longue (60 000 caractères maximum).");

  const diag: Partial<LlmDiag> = {};
  const p: TranscriptParsed = await callLlmStructured({
    instructions: INSTRUCTIONS,
    input: `--- TRANSCRIPTION ---\n${text}`,
    schema: TranscriptSchema,
    schemaName: "fitting_data",
    maxTokens: 8000,
    model: tune.model,
    effort: tune.effort,
    diag,
  });

  const player = flat(p.player as Dict, NUM_PLAYER);
  const measures = flat(p.measures as Dict, NUM_MEASURES);
  const reco = flat(p.reco as Dict);

  const currentClubs = (p.currentClubs ?? [])
    .map((c) => flat(c as Dict, NUM_CLUB))
    .filter((c) => c.club && Object.keys(c).some((k) => k !== "club"));

  const lieTests = (p.lieTests ?? [])
    .map((l) => ({
      club: str(l.club),
      mark: str(l.mark),
      shotsHitLeft: numStr(l.shotsHitLeft),
      correctionDeg: numStr(l.correctionDeg),
      note: str(l.note),
    }))
    .filter((l) => l.club && (l.mark || l.correctionDeg || l.note));

  const trackman = (p.trackman ?? [])
    .map((r) => {
      const src = r as Dict;
      const row: Record<string, string> = { club: str(src.club) };
      for (const f of TM_FIELDS) row[f] = numStr(src[f]);
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

  /* Tracabilite : citation + nature + confiance, indexees par chemin de champ. */
  const quotes: Record<string, string> = {};
  const flags: Record<string, { status: string; confidence: string }> = {};
  for (const v of p.values ?? []) {
    const key = str(v.field);
    if (!key) continue;
    const q = str(v.evidence);
    if (q) quotes[key] = q.length > 220 ? `${q.slice(0, 217)}...` : q;
    flags[key] = { status: str(v.status) || "mesure", confidence: str(v.confidence) || "moyenne" };
  }

  const ambiguities = (p.ambiguities ?? []).map(str).filter(Boolean).slice(0, 12);

  return {
    summary: str(p.summary),
    player,
    measures,
    reco,
    currentClubs,
    lieTests,
    trackman,
    targetBrand: str(p.targetBrand).toUpperCase(),
    fitterNotes: str(p.fitterNotes),
    quotes,
    flags,
    ambiguities,
    diag: diag as LlmDiag,
  };
}

export type TranscriptResult = Awaited<ReturnType<typeof parseTranscript>>;
