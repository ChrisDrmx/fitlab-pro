import { z } from "zod";

/**
 * Schema de sortie structuree pour l'analyse d'une transcription de fitting.
 * Utilise en "structured outputs" cote OpenAI (Responses API) et comme
 * validateur pour le fournisseur de secours (Anthropic).
 *
 * Regles de forme imposees par les structured outputs stricts :
 *  - tous les champs sont requis ;
 *  - une absence de valeur s'exprime par null (jamais par une cle manquante) ;
 *  - pas de dictionnaire a cles libres : les citations passent par un tableau.
 */

export const CLUBS = [
  "DR", "3W", "5W", "7W", "H3", "H4", "H5",
  "3i", "4i", "5i", "6i", "7i", "8i", "9i", "PW", "GW", "SW", "LW",
] as const;

export const BRANDS = [
  "PING", "CALLAWAY", "COBRA", "TITLEIST", "MIZUNO", "SRIXON", "PXG", "TAYLORMADE",
] as const;

const txt = () => z.string().nullable();

const Club = z.enum(CLUBS);

const Player = z.object({
  firstName: txt(),
  lastName: txt(),
  email: txt(),
  phone: txt(),
  gender: z.enum(["H", "F"]).nullable(),
  birthYear: txt(),
  handedness: z.enum(["droitier", "gaucher"]).nullable(),
  handicap: txt(),
  yearsPlaying: txt(),
  roundsPerMonth: txt(),
  tempo: z.enum(["lent", "moyen", "rapide"]).nullable(),
  physicalNotes: txt(),
  missPattern: txt(),
  club: txt(),
});

const Measures = z.object({
  heightCm: txt(),
  wristToFloorCm: txt(),
  armSpanCm: txt(),
  handLengthCm: txt(),
  handCircumferenceCm: txt(),
  middleFingerCm: txt(),
  gloveSizeCurrent: txt(),
  shoeSole: z.enum(["plate", "crampons"]).nullable(),
});

const CurrentClub = z.object({
  club: Club,
  brand: txt(),
  model: txt(),
  year: txt(),
  shaft: txt(),
  flex: txt(),
  shaftWeight: txt(),
  lengthIn: txt(),
  lieNote: txt(),
  gripModel: txt(),
  gripSize: txt(),
  wraps: txt(),
});

const LieTest = z.object({
  club: Club,
  mark: z.enum(["toe", "toe_slight", "center", "heel_slight", "heel"]).nullable(),
  shotsHitLeft: txt(),
  correctionDeg: txt(),
  note: txt(),
});

const TrackmanRow = z.object({
  club: Club,
  clubSpeed: txt(),
  ballSpeed: txt(),
  smash: txt(),
  launch: txt(),
  spin: txt(),
  attackAngle: txt(),
  dynamicLoft: txt(),
  spinLoft: txt(),
  faceAngle: txt(),
  clubPath: txt(),
  faceToPath: txt(),
  height: txt(),
  landingAngle: txt(),
  carry: txt(),
  total: txt(),
  sideCarry: txt(),
});

const Reco = z.object({
  headIrons: txt(),
  headWoods: txt(),
  shaftIrons: txt(),
  shaftWoods: txt(),
  flex: txt(),
  lengthIrons: txt(),
  lengthDriver: txt(),
  lie: txt(),
  gripModel: txt(),
  gripSize: txt(),
  glove: txt(),
  loftGapping: txt(),
  driverLoft: txt(),
  ballModel: txt(),
  priority: txt(),
  notes: txt(),
});

/** Une valeur extraite, tracee jusqu'a la phrase source. */
const Value = z.object({
  /** Chemin du champ : "measures.heightCm", "reco.flex", "trackman.0", "lieTests.1"... */
  field: z.string(),
  /** Nature de la valeur : mesuree, recommandee, hypothese du fitter, ou incertaine. */
  status: z.enum(["mesure", "recommandation", "hypothese", "incertain"]),
  confidence: z.enum(["haute", "moyenne", "faible"]),
  /** Extrait EXACT de la transcription qui justifie la valeur. */
  evidence: z.string(),
});

export const TranscriptSchema = z.object({
  summary: z.string(),
  player: Player,
  measures: Measures,
  currentClubs: z.array(CurrentClub),
  lieTests: z.array(LieTest),
  trackman: z.array(TrackmanRow),
  reco: Reco,
  targetBrand: z.enum(BRANDS).nullable(),
  fitterNotes: txt(),
  values: z.array(Value),
  /** Points a verifier de vive voix : chiffre inaudible, unite douteuse, club non nomme... */
  ambiguities: z.array(z.string()),
});

export type TranscriptParsed = z.infer<typeof TranscriptSchema>;
