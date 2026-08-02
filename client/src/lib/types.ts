export type ClubRow = {
  club: string;
  brand: string;
  model: string;
  year: string;
  shaft: string;
  flex: string;
  shaftWeight: string;
  length: string;
  lie: string;
  gripModel: string;
  gripSize: string;
  wraps: string;
};

export type LieRow = { club: string; mark: string; shots: string; correction: string; note: string };

export type TrackmanRow = {
  club: string;
  clubSpeed: number | null;
  ballSpeed: number | null;
  smashFactor: number | null;
  launchAngle: number | null;
  backspin: number | null;
  attackAngle: number | null;
  dynamicLoft: number | null;
  spinLoft: number | null;
  faceAngle: number | null;
  clubPath: number | null;
  faceToPath: number | null;
  height: number | null;
  landAngle: number | null;
  carry: number | null;
  total: number | null;
  sideCarry: number | null;
};

export type Insight = { id: string; priority: "Haute" | "Moyenne" | "Basse"; text: string; action: string; checked: boolean };

export type Fitting = {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  date: string;
  status: string;
  targetBrand: string;
  player: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender: string;
    birthYear: string;
    handedness: string;
    handicap: string;
    yearsPlaying: string;
    roundsPerMonth: string;
    tempo: string;
    physicalNotes: string;
    goals: string[];
    missPattern: string;
    golfClub: string;
  };
  measures: {
    heightCm: string;
    wristToFloorCm: string;
    wingspanCm: string;
    handLengthCm: string;
    handCircumferenceCm: string;
    middleFingerCm: string;
    currentGloveSize: string;
    shoeSole: string;
  };
  transcript: string;
  currentClubs: ClubRow[];
  lieTests: LieRow[];
  trackman: TrackmanRow[];
  reco: {
    lie: string;
    lengthInches: string;
    lengthCm: string;
    flex: string;
    gripModel: string;
    gripSize: string;
    glove: string;
    pingColorCode: string;
    loftGapping: string;
    driverLoft: string;
    ballModel: string;
  };
  insights: Insight[];
  fitterNotes: string;
  excludedInsights: string[];
  unitSystem: "metric" | "imperial";
};

export const blankClub = (): ClubRow => ({ club: "7i", brand: "", model: "", year: "", shaft: "", flex: "", shaftWeight: "", length: "", lie: "", gripModel: "", gripSize: "", wraps: "" });
export const blankTrackman = (): TrackmanRow => ({ club: "DR", clubSpeed: null, ballSpeed: null, smashFactor: null, launchAngle: null, backspin: null, attackAngle: null, dynamicLoft: null, spinLoft: null, faceAngle: null, clubPath: null, faceToPath: null, height: null, landAngle: null, carry: null, total: null, sideCarry: null });

export const blankFitting = (): Fitting => ({
  date: new Date().toISOString(), status: "Brouillon", targetBrand: "",
  player: { firstName: "", lastName: "", email: "", phone: "", gender: "", birthYear: "", handedness: "", handicap: "", yearsPlaying: "", roundsPerMonth: "", tempo: "", physicalNotes: "", goals: [], missPattern: "", golfClub: "" },
  measures: { heightCm: "", wristToFloorCm: "", wingspanCm: "", handLengthCm: "", handCircumferenceCm: "", middleFingerCm: "", currentGloveSize: "", shoeSole: "" },
  transcript: "", currentClubs: [], lieTests: [], trackman: [],
  reco: { lie: "", lengthInches: "", lengthCm: "", flex: "", gripModel: "", gripSize: "", glove: "", pingColorCode: "", loftGapping: "", driverLoft: "", ballModel: "" },
  insights: [], fitterNotes: "", excludedInsights: [], unitSystem: "metric",
});
