export type ClubKey =
  | "DR" | "3W" | "5W" | "7W" | "H3" | "H4" | "H5"
  | "3i" | "4i" | "5i" | "6i" | "7i" | "8i" | "9i" | "PW" | "GW" | "SW" | "LW";

export const IRON_CLUBS: ClubKey[] = ["3i","4i","5i","6i","7i","8i","9i","PW","GW","SW","LW"];
export const WOOD_CLUBS: ClubKey[] = ["DR","3W","5W","7W","H3","H4","H5"];

export const CLUB_LABEL: Record<ClubKey, string> = {
  DR: "Driver", "3W": "Bois 3", "5W": "Bois 5", "7W": "Bois 7",
  H3: "Hybride 3", H4: "Hybride 4", H5: "Hybride 5",
  "3i": "Fer 3", "4i": "Fer 4", "5i": "Fer 5", "6i": "Fer 6", "7i": "Fer 7",
  "8i": "Fer 8", "9i": "Fer 9", PW: "Pitching Wedge", GW: "Gap Wedge",
  SW: "Sand Wedge", LW: "Lob Wedge",
};

export type LieMark = "toe" | "toe_slight" | "center" | "heel_slight" | "heel" | "";

export interface Player {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: "H" | "F" | "";
  birthYear: string;
  handedness: "droitier" | "gaucher" | "";
  handicap: string;
  yearsPlaying: string;
  roundsPerMonth: string;
  tempo: "lent" | "moyen" | "rapide" | "";
  physicalNotes: string;
  goals: string[];
  missPattern: string;
  club: string;
}

export interface Measures {
  heightCm: string;
  wristToFloorCm: string;
  armSpanCm: string;
  handLengthCm: string;      // pli du poignet -> bout du majeur
  handCircumferenceCm: string; // tour de main aux articulations
  middleFingerCm: string;
  gloveSizeCurrent: string;
  shoeSole: "plate" | "crampons" | "";
}

export interface CurrentClub {
  club: ClubKey;
  brand: string;
  model: string;
  year: string;
  shaft: string;
  flex: string;
  shaftWeight: string;
  lengthIn: string;
  lieNote: string;
  gripModel: string;
  gripSize: string;
  wraps: string;
}

export interface LieTest {
  club: ClubKey;
  mark: LieMark;
  shotsHitLeft: string;
  correctionDeg: string; // override manuel
  note: string;
}

export interface TrackmanRow {
  club: ClubKey;
  clubSpeed: string;
  ballSpeed: string;
  smash: string;
  launch: string;
  spin: string;
  attackAngle: string;
  dynamicLoft: string;
  spinLoft: string;
  faceAngle: string;
  clubPath: string;
  faceToPath: string;
  height: string;
  landingAngle: string;
  carry: string;
  total: string;
  sideCarry: string;
  impactHoriz: "talon" | "centre" | "toe" | "";
  impactVert: "bas" | "centre" | "haut" | "";
}

export interface Recommendation {
  headIrons: string;
  headWoods: string;
  shaftIrons: string;
  shaftWoods: string;
  flex: string;
  lengthIrons: string;
  lengthDriver: string;
  lie: string;
  gripModel: string;
  gripSize: string;
  glove: string;
  loftGapping: string;
  driverLoft: string;
  ballModel: string;
  priority: string;
  notes: string;
}

export interface FittingData {
  player: Player;
  measures: Measures;
  currentClubs: CurrentClub[];
  lieTests: LieTest[];
  trackman: TrackmanRow[];
  reco: Recommendation;
  targetBrand: string;
  fitterNotes: string;
  /** Identifiants des constats decoches : ils ne figurent pas dans le PDF. */
  excludedInsights: string[];
  /** Transcription audio de la seance, conservee avec la fiche du joueur. */
  transcript: string;
  unitSystem: "metric" | "imperial";
}

export interface CoachingStudent {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  level: string;
  handicap: string;
  notes: string;
}

export type CoachingPriority = "haute" | "moyenne" | "basse" | "";

export interface CoachingRecommendation {
  id: string;
  problemObserved: string;
  probableCause: string;
  proposedCorrection: string;
  priority: CoachingPriority;
}

export interface CoachingExercise {
  id: string;
  title: string;
  duration: string;
  repetitions: string;
  frequency: string;
  instructions: string;
  successCriteria: string;
  videoUrl: string;
}

export interface CoachingPhoto {
  id: string;
  name: string;
  dataUrl: string;
}

export interface CoachingData {
  student: CoachingStudent;
  date: string;
  objective: string;
  duration: string;
  proNotes: string;
  transcript: string;
  recommendations: CoachingRecommendation[];
  exercises: CoachingExercise[];
  trackmanPhotos: CoachingPhoto[];
  studentReport: string;
}

export const emptyFitting = (): FittingData => ({
  targetBrand: "PING",
  fitterNotes: "",
  excludedInsights: [],
  transcript: "",
  unitSystem: "metric",
  player: {
    firstName: "", lastName: "", email: "", phone: "", gender: "", birthYear: "",
    handedness: "droitier", handicap: "", yearsPlaying: "", roundsPerMonth: "",
    tempo: "", physicalNotes: "", goals: [], missPattern: "", club: "",
  },
  measures: {
    heightCm: "", wristToFloorCm: "", armSpanCm: "", handLengthCm: "",
    handCircumferenceCm: "", middleFingerCm: "", gloveSizeCurrent: "", shoeSole: "plate",
  },
  currentClubs: [],
  lieTests: [],
  trackman: [],
  reco: {
    headIrons: "", headWoods: "", shaftIrons: "", shaftWoods: "", flex: "",
    lengthIrons: "", lengthDriver: "", lie: "", gripModel: "", gripSize: "",
    glove: "", loftGapping: "", driverLoft: "", ballModel: "", priority: "", notes: "",
  },
});

export const emptyCoaching = (): CoachingData => ({
  student: {
    firstName: "", lastName: "", email: "", phone: "", level: "", handicap: "", notes: "",
  },
  date: new Date().toISOString().slice(0, 10),
  objective: "",
  duration: "",
  proNotes: "",
  transcript: "",
  recommendations: [],
  exercises: [],
  trackmanPhotos: [],
  studentReport: "",
});
