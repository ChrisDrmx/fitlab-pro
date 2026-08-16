import type { BioSwingArmType, BioSwingData, BioSwingGroundForce, BioSwingPlane, FittingData } from "./types";

export const BIO_SWING_SOURCE = "FitLab_Pro_BioSwing_Dynamics_Module.xlsx";
export const CM_PER_INCH = 2.54;
export const BIO_SWING_THRESHOLD_IN = 4;

export const PLANE_LABEL: Record<BioSwingPlane, string> = {
  Shoulder: "Shoulder Plane",
  Torso: "Torso Plane",
  Hip: "Hip / Shaft Plane",
};

export const ARM_LABEL: Record<Exclude<BioSwingArmType, "">, string> = {
  OnTop: "On Top",
  SideOn: "Side On",
  Under: "Under",
};

export const GROUND_FORCE_LABEL: Record<Exclude<BioSwingGroundForce, "">, string> = {
  RearPost: "Rear Post",
  CenterPost: "Center Post",
  FrontPost: "Front Post",
};

export const ARM_MATCHUPS: Record<Exclude<BioSwingArmType, "">, {
  hinge: string;
  clubPosition: string;
  release: string;
  gripTendency: string;
}> = {
  OnTop: { hinge: "Diagonal Hinge", clubPosition: "Across the line", release: "Cover Release", gripTendency: "Souvent plus faible / neutre" },
  SideOn: { hinge: "Horizontal Hinge", clubPosition: "Down the line", release: "Corner Release", gripTendency: "Neutre" },
  Under: { hinge: "Vertical Hinge", clubPosition: "Laid off", release: "Extension Release", gripTendency: "Souvent plus fort" },
};

export const PLANE_MATCHUPS: Record<BioSwingPlane, Record<Exclude<BioSwingArmType, "">, string>> = {
  Shoulder: { OnTop: "Possible · attention across", SideOn: "Très compatible", Under: "Compatible" },
  Torso: { OnTop: "Compatible", SideOn: "Idéal", Under: "Compatible" },
  Hip: { OnTop: "Moins naturel", SideOn: "Compatible", Under: "Très compatible" },
};

export const POSTURE_BY_PLANE: Record<BioSwingPlane, { posture: string; attention: string }> = {
  Shoulder: { posture: "Plus érigée, bras plus libres", attention: "Éviter de trop pencher" },
  Torso: { posture: "Posture standard · doigts sur genoux", attention: "Équilibre idéal" },
  Hip: { posture: "Plus penchée, rotation plus horizontale", attention: "Éviter de se redresser" },
};

export const BIOSWING_CHECKLIST = [
  { id: "morphology", label: "Mesures morphologiques", action: "Taille + envergure, joueur chaussé" },
  { id: "backswing", label: "Plan de backswing", action: "Appliquer la règle ±4 pouces" },
  { id: "right-arm", label: "Screen du bras droit", action: "Observer On Top / Side On / Under" },
  { id: "downswing", label: "Avant-bras / humérus", action: "Mesurer et comparer" },
  { id: "hinge", label: "Hinge recommandé", action: "Vérifier la cohérence avec le bras droit" },
  { id: "club-position", label: "Position du club en haut", action: "Across / Down the line / Laid off" },
  { id: "posture", label: "Posture", action: "Adapter l'inclinaison au plan" },
  { id: "grip", label: "Grip", action: "Vérifier la cohérence avec le type de bras" },
  { id: "matchup", label: "Tester le matchup", action: "Quelques swings + observation" },
  { id: "profile", label: "Profil joueur", action: "Sauvegarder les résultats dans FitLab" },
] as const;

export function parseMeasure(value: string): number | null {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function planeFromDifference(diffIn: number | null): BioSwingPlane | "" {
  if (diffIn === null) return "";
  if (diffIn > BIO_SWING_THRESHOLD_IN) return "Shoulder";
  if (diffIn < -BIO_SWING_THRESHOLD_IN) return "Hip";
  return "Torso";
}

export function computeBioSwing(d: Pick<FittingData, "measures" | "bioSwing">) {
  const heightCm = parseMeasure(d.measures.heightCm);
  const wingspanCm = parseMeasure(d.measures.armSpanCm);
  const forearmCm = parseMeasure(d.measures.forearmLengthCm);
  const humerusCm = parseMeasure(d.measures.humerusLengthCm);
  const differenceCm = heightCm !== null && wingspanCm !== null ? wingspanCm - heightCm : null;
  const differenceIn = differenceCm === null ? null : differenceCm / CM_PER_INCH;
  const autoBackswingPlane = planeFromDifference(differenceIn);
  const autoDownswingPlane: BioSwingPlane | "" = forearmCm === null || humerusCm === null
    ? ""
    : forearmCm > humerusCm ? "Shoulder" : forearmCm < humerusCm ? "Hip" : "Torso";
  const backswingPlane = d.bioSwing.manualBackswingPlane || autoBackswingPlane;
  const downswingPlane = d.bioSwing.manualDownswingPlane || autoDownswingPlane;
  const armType = d.bioSwing.rightArmType;
  const matchup = armType ? ARM_MATCHUPS[armType] : null;
  const warning = d.bioSwing.manualHinge && matchup && d.bioSwing.manualHinge !== matchup.hinge
    ? "Le hinge saisi diffère du matchup recommandé. Vérifie le choix avec le moniteur."
    : "";

  return {
    heightCm,
    wingspanCm,
    forearmCm,
    humerusCm,
    differenceCm,
    differenceIn,
    autoBackswingPlane,
    autoDownswingPlane,
    backswingPlane,
    downswingPlane,
    armType,
    matchup,
    warning,
    ready: Boolean(backswingPlane || downswingPlane || armType),
  };
}

export function recommendedGroundForce(type: BioSwingGroundForce): string {
  if (type === "RearPost") return "Glide · force horizontale / latérale";
  if (type === "CenterPost") return "Spin · rotation / torque";
  if (type === "FrontPost") return "Launch · poussée verticale";
  return "À observer avec le moniteur";
}
