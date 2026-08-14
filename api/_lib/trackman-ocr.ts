import { callLlm } from "./llm.js";

/**
 * Lecture d'une capture d'écran ou d'une photo de rapport Trackman.
 * Renvoie des lignes prêtes à insérer dans le tableau de l'étape Trackman.
 */

const CLUBS = [
  "DR", "3W", "5W", "7W", "H3", "H4", "H5",
  "3i", "4i", "5i", "6i", "7i", "8i", "9i", "PW", "GW", "SW", "LW",
] as const;

const NUMERIC_FIELDS = [
  "clubSpeed", "ballSpeed", "smash", "launch", "spin", "attackAngle",
  "dynamicLoft", "spinLoft", "faceAngle", "clubPath", "faceToPath",
  "height", "landingAngle", "carry", "total", "sideCarry",
] as const;

const PROMPT = `Tu lis une capture d'écran ou une photo d'un rapport Trackman (ou d'un autre launch monitor) fournie par un club-fitter professionnel.

Extrais chaque ligne de mesure visible et renvoie UNIQUEMENT un objet JSON valide, sans texte autour, sans bloc de code, de la forme :

{
  "detectedUnits": { "speed": "mph" | "kmh" | "ms", "distance": "yards" | "meters" | "feet" },
  "source": "courte description de ce que montre l'image (ex: 'Rapport Trackman Combine 6 clubs' ou 'Moyennes de session driver')",
  "rows": [
    {
      "club": "DR",
      "clubSpeed": "82.4", "ballSpeed": "118.2", "smash": "1.43",
      "launch": "12.1", "spin": "2450", "attackAngle": "1.2",
      "dynamicLoft": "13.8", "spinLoft": "12.6", "faceAngle": "-0.8",
      "clubPath": "1.4", "faceToPath": "-2.2",
      "height": "27.5", "landingAngle": "38.2",
      "carry": "212.0", "total": "232.5", "sideCarry": "-4.1"
    }
  ]
}

Règles impératives :
- "club" doit être exactement une de ces valeurs : ${CLUBS.join(", ")}. Driver = "DR", Bois 3 = "3W", Hybride 4 = "H4", Fer 7 = "7i", Pitching wedge = "PW", Gap/Approach wedge = "GW", Sand wedge = "SW", Lob wedge = "LW". Si le club n'est pas identifiable, mets "".
- CONVERSIONS OBLIGATOIRES : toutes les vitesses en MPH (si l'écran est en km/h divise par 1.60934, si en m/s multiplie par 2.23694). Toutes les distances (carry, total, height, sideCarry) en MÈTRES (si l'écran est en yards multiplie par 0.9144, si en pieds multiplie par 0.3048). Le backspin en tr/min. Tous les angles en degrés.
- Reporte le signe : angle d'attaque négatif = descendant, club path négatif = out-to-in pour un droitier, side carry négatif = à gauche.
- Champ non lisible ou absent de l'image : chaîne vide "". N'invente jamais une valeur, ne calcule pas un champ manquant à partir des autres, sauf le smash factor si vitesse de balle et vitesse de club sont toutes deux lisibles.
- Nombres sous forme de chaînes, point décimal (pas de virgule), sans unité.
- Si l'image montre plusieurs frappes du même club plus une ligne de moyenne, ne renvoie que la ligne de moyenne.
- Si l'image ne contient aucune donnée de launch monitor, renvoie {"detectedUnits":{},"source":"aucune donnée détectée","rows":[]}.`;

type OcrRow = Record<string, string>;

export async function readTrackmanImage(dataUrl: string) {
  const m = /^data:(image\/(png|jpeg|jpg|webp|gif));base64,(.+)$/i.exec(dataUrl.trim());
  if (!m) throw new Error("Format d'image non reconnu. Utilisez une photo JPEG, PNG ou WebP.");
  const mediaType = m[1].toLowerCase() === "image/jpg" ? "image/jpeg" : m[1].toLowerCase();
  const b64 = m[3];

  const text = await callLlm({
    prompt: PROMPT,
    image: { mediaType, base64: b64 },
    maxTokens: 4000,
  });

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Lecture impossible : aucune donnée exploitable dans l'image.");

  let parsed: { detectedUnits?: Record<string, string>; source?: string; rows?: OcrRow[] };
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error("Lecture impossible : réponse illisible du module d'analyse.");
  }

  const clean = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(",", ".").trim();
    if (!s || s === "-" || s.toLowerCase() === "n/a") return "";
    return Number.isFinite(Number(s)) ? String(Number(s.replace(/[^\d.\-]/g, ""))) : "";
  };

  const rows = (parsed.rows ?? [])
    .map((r) => {
      const out: OcrRow = { club: CLUBS.includes(String(r.club) as never) ? String(r.club) : "" };
      for (const f of NUMERIC_FIELDS) out[f] = clean(r[f]);
      // Identite Trackman : face-to-path = face angle - club path.
      if (!out.faceToPath && out.faceAngle && out.clubPath) {
        out.faceToPath = String(Math.round((Number(out.faceAngle) - Number(out.clubPath)) * 10) / 10);
      }
      if (!out.smash && out.ballSpeed && out.clubSpeed && Number(out.clubSpeed) > 0) {
        out.smash = String(Math.round((Number(out.ballSpeed) / Number(out.clubSpeed)) * 100) / 100);
      }
      return out;
    })
    .filter((r) => NUMERIC_FIELDS.some((f) => r[f] !== ""));

  return { rows, source: parsed.source ?? "", detectedUnits: parsed.detectedUnits ?? {} };
}
